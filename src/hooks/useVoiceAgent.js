import { useState, useRef, useEffect, useCallback } from 'react'
import {
  sanitizeTextForSpeech,
  getBestVoiceForLang,
  getPreferredAudioMimeType,
  cleanAudioMimeType,
  audioBlobToBase64,
  getGeminiApiKey,
  isGeminiKeyConfigured,
  callGeminiMultimodalAudio,
  callGeminiTextBrain
} from '../utils/voiceAgent'

export const AGENT_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING'
}

export function useVoiceAgent({
  mode = 'onboarding', // 'onboarding' | 'edit'
  currentProfile = {},
  onProfileUpdate,
  onIntent,
  onUserMessage,
  onAiMessage,
  apiKey = null
}) {
  const [state, setState] = useState(AGENT_STATES.IDLE)
  const [volumeLevel, setVolumeLevel] = useState(0) // 0 to 100 for live reactive waveform
  const [lastTranscript, setLastTranscript] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [voiceError, setVoiceError] = useState(null)
  const [isKeyConfigured, setIsKeyConfigured] = useState(isGeminiKeyConfigured())
  const [audioSupported, setAudioSupported] = useState(true)

  // Media & Web Audio Refs
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])

  // VAD & Timing Refs
  const hasSpokenRef = useRef(false)
  const silenceTimerRef = useRef(null)
  const maxCapTimerRef = useRef(null)
  const noSpeechTimerRef = useRef(null)
  const lastQuestionRef = useRef('')

  // Turn-Taking & State Sync Refs
  const stateRef = useRef(AGENT_STATES.IDLE)
  const shouldAutoListenRef = useRef(true)
  const autoListenTimeoutRef = useRef(null)
  const safetyEndTimeoutRef = useRef(null)

  // Callback & Profile Props Refs to prevent stale closures
  const currentProfileRef = useRef(currentProfile)
  const modeRef = useRef(mode)
  const apiKeyRef = useRef(apiKey)
  const onProfileUpdateRef = useRef(onProfileUpdate)
  const onIntentRef = useRef(onIntent)
  const onUserMessageRef = useRef(onUserMessage)
  const onAiMessageRef = useRef(onAiMessage)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    currentProfileRef.current = currentProfile
    modeRef.current = mode
    apiKeyRef.current = apiKey
    onProfileUpdateRef.current = onProfileUpdate
    onIntentRef.current = onIntent
    onUserMessageRef.current = onUserMessage
    onAiMessageRef.current = onAiMessage
    setIsKeyConfigured(isGeminiKeyConfigured())
  })

  // Check MediaRecorder & getUserMedia support
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setAudioSupported(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll(true)
    }
  }, [])

  // 1. Cleanup all streams, audio contexts, timers, and TTS
  const stopAll = useCallback((isUnmounting = false) => {
    if (autoListenTimeoutRef.current) clearTimeout(autoListenTimeoutRef.current)
    if (safetyEndTimeoutRef.current) clearTimeout(safetyEndTimeoutRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (maxCapTimerRef.current) clearTimeout(maxCapTimerRef.current)
    if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current)

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    // Stop MediaRecorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      } catch {}
      mediaRecorderRef.current = null
    }

    // Stop media stream tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop())
      } catch {}
      streamRef.current = null
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
        }
      } catch {}
      audioContextRef.current = null
    }

    // Cancel speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    if (!isUnmounting) {
      setState(AGENT_STATES.IDLE)
      setVolumeLevel(0)
    }
  }, [])

  // 2. Start Recording with Real Audio & VAD (Timeslice 250ms + Resumed AudioContext)
  const startRecording = useCallback(async () => {
    // Prevent mic and speaker collision: cancel any active speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    stopAll()
    setVoiceError(null)

    try {
      console.log('[VoiceDebug] Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      streamRef.current = stream

      // Setup Web Audio API Analyser for live mic volume & VAD
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()

      // CRITICAL MAC/CHROME FIX: Explicitly resume AudioContext if suspended
      if (audioCtx.state === 'suspended') {
        console.log('[VoiceDebug] AudioContext suspended on Mac/Chrome, resuming now...')
        await audioCtx.resume()
      }
      audioContextRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.3
      source.connect(analyser)
      analyserRef.current = analyser

      // Setup MediaRecorder
      const preferredMime = getPreferredAudioMimeType()
      const cleanMime = cleanAudioMimeType(preferredMime)
      console.log(`[VoiceDebug] Initializing MediaRecorder with MIME: ${cleanMime}`)

      const mediaRecorder = new MediaRecorder(stream, { mimeType: preferredMime })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      hasSpokenRef.current = false

      // Collect audio chunks continuously in chunksRef
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log(`[VoiceDebug] Chunk pushed: ${event.data.size} bytes. Total chunks: ${chunksRef.current.length}`)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log(`[VoiceDebug] mediaRecorder.onstop fired. Total chunks collected: ${chunksRef.current.length}`)
        const audioBlob = new Blob(chunksRef.current, { type: cleanMime })
        chunksRef.current = []

        // Stop all mic tracks immediately inside onstop
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close() } catch {}
          audioContextRef.current = null
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current)
          animFrameRef.current = null
        }

        console.log(`[VoiceDebug] Created AudioBlob. Size: ${audioBlob.size} bytes, cleanMime: "${cleanMime}"`)

        // NEVER discard if user spoke or audio has data (> 500 bytes)
        if (audioBlob.size > 500) {
          await processRecordedAudio(audioBlob, cleanMime)
        } else {
          console.warn(`[GeminiVoice] AudioBlob size too small (${audioBlob.size} bytes).`)
          setVoiceError('Mic se awaaz record nahi hui, Chrome mic permission check karein')
          setState(AGENT_STATES.IDLE)
          stateRef.current = AGENT_STATES.IDLE
        }
      }

      // VAD (Voice Activity Detection) Loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateVAD = () => {
        if (stateRef.current !== AGENT_STATES.LISTENING) return

        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length // 0 to 255
        const normalizedVolume = Math.min(100, Math.round((avg / 65) * 100))
        setVolumeLevel(normalizedVolume)

        // Forgiving speech threshold (8 out of 255)
        const SPEECH_THRESHOLD = 8

        if (avg > SPEECH_THRESHOLD) {
          if (!hasSpokenRef.current) {
            hasSpokenRef.current = true
            console.log(`[VoiceDebug] VAD: Speech detected (avg=${avg.toFixed(1)}). Active turn started.`)
            if (noSpeechTimerRef.current) {
              clearTimeout(noSpeechTimerRef.current)
              noSpeechTimerRef.current = null
            }
          }
          // Reset silence timer while user is actively speaking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        } else {
          // Volume below speech threshold
          if (hasSpokenRef.current && !silenceTimerRef.current) {
            // Auto-stop after 1.8 seconds of silence
            silenceTimerRef.current = setTimeout(() => {
              console.log('[VoiceDebug] VAD: 1.8s silence detected after speech. Auto-stopping and sending to Gemini...')
              stopRecordingAndSend()
            }, 1800)
          }
        }

        animFrameRef.current = requestAnimationFrame(updateVAD)
      }

      // Start MediaRecorder with timeslice 250ms so chunks are continuously flushed
      mediaRecorder.start(250)
      setState(AGENT_STATES.LISTENING)
      stateRef.current = AGENT_STATES.LISTENING
      console.log('[VoiceDebug] Recording active. Timeslice: 250ms.')
      updateVAD()

      // Max safety cap: 12 seconds
      maxCapTimerRef.current = setTimeout(() => {
        console.log('[VoiceDebug] VAD: 12 seconds max cap reached. Auto-stopping...')
        stopRecordingAndSend()
      }, 12000)

      // Friendly prompt if silence persists for 5 seconds without speech
      noSpeechTimerRef.current = setTimeout(() => {
        if (!hasSpokenRef.current && stateRef.current === AGENT_STATES.LISTENING) {
          console.log('[VoiceDebug] VAD: 5s elapsed without speech.')
          stopAll()
          speak("Awaaz nahi aayi, mic dabakar bolein.", false)
        }
      }, 5000)

    } catch (err) {
      console.error('[VoiceDebug] Microphone access error:', err)
      setState(AGENT_STATES.IDLE)
      stateRef.current = AGENT_STATES.IDLE
      setVoiceError(`Microphone permission error: ${err.message || 'Access denied'}`)
    }
  }, [stopAll])

  // 3. Stop Recording and Send (Triggered by user tap on red orb OR by VAD auto-stop)
  const stopRecordingAndSend = useCallback(() => {
    console.log('[VoiceDebug] stopRecordingAndSend called.')
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (maxCapTimerRef.current) clearTimeout(maxCapTimerRef.current)
    if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Calling stop() triggers onstop, which creates audioBlob and calls processRecordedAudio
        mediaRecorderRef.current.stop()
      } catch (err) {
        console.warn('[VoiceDebug] Error stopping media recorder:', err)
      }
    }
  }, [])

  // 4. Process Recorded Audio through Gemini Multimodal REST API
  const processRecordedAudio = useCallback(async (audioBlob, cleanMime) => {
    setState(AGENT_STATES.PROCESSING)
    stateRef.current = AGENT_STATES.PROCESSING
    setVolumeLevel(0)
    setVoiceError(null)

    try {
      console.log(`[VoiceDebug] Converting audio blob (${audioBlob.size} bytes) to Base64...`)
      const audioBase64 = await audioBlobToBase64(audioBlob)

      const apiKey = apiKeyRef.current || getGeminiApiKey()

      if (!apiKey) {
        setIsKeyConfigured(false)
        const errMsg = "Gemini API key missing: add it in Settings."
        setVoiceError(errMsg)
        const warnReply = "Gemini API key configure karein Settings mein, ya neeche box mein likhein."
        onAiMessageRef.current?.(warnReply)
        speak(warnReply, false)
        return
      }

      setIsKeyConfigured(true)

      console.log(`[VoiceDebug] Calling Gemini Multimodal REST API...`)
      const response = await callGeminiMultimodalAudio({
        audioBase64,
        base64Audio: audioBase64,
        mimeType: cleanMime,
        currentProfile: currentProfileRef.current,
        mode: modeRef.current,
        lastQuestion: lastQuestionRef.current,
        apiKey
      })

      if (response && response.error) {
        console.error('[GeminiVoice] Gemini API call returned error:', response.error)
        setVoiceError(response.error)
        onAiMessageRef.current?.(response.error)
        speak(response.error, false)
        setState(AGENT_STATES.IDLE)
        stateRef.current = AGENT_STATES.IDLE
        return
      }

      if (response && response.replyText) {
        console.log('[VoiceDebug] Gemini Multimodal Success! Transcript:', response.transcript)
        setLastTranscript(response.transcript)
        setVoiceError(null)

        // Show user's accurate transcript bubble
        if (response.transcript) {
          onUserMessageRef.current?.(response.transcript)
        }

        // Apply profile updates immediately to state & localStorage
        if (response.updates && Object.keys(response.updates).length > 0) {
          onProfileUpdateRef.current?.(response.updates)
        }

        // Handle intent
        if (response.intent) {
          onIntentRef.current?.(response.intent, response)
        }

        // Show AI reply bubble and speak
        onAiMessageRef.current?.(response.replyText)
        lastQuestionRef.current = response.replyText
        speak(response.replyText, response.shouldAutoListen !== false)
      } else {
        const errorReply = "Aapki awaaz theek se nahi suni. Kripya dobara bolein ya text mein likhein."
        setVoiceError('Awaaz samajh nahi aayi. Kripya dobara bolein.')
        onAiMessageRef.current?.(errorReply)
        speak(errorReply, true)
      }
    } catch (err) {
      console.error('[VoiceDebug] Audio processing error:', err)
      setVoiceError(`Audio processing error: ${err.message || 'Unknown error'}`)
      setState(AGENT_STATES.IDLE)
      stateRef.current = AGENT_STATES.IDLE
    }
  }, [])

  // 5. Speak Function with High-Quality Indian TTS & Auto-Listen Loop
  const speak = useCallback((rawText, autoListenAfter = true) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    // Immediately stop any mic/recording to prevent echo
    stopAll()

    const cleanText = sanitizeTextForSpeech(rawText)
    if (!cleanText) {
      setState(AGENT_STATES.IDLE)
      return
    }

    setState(AGENT_STATES.SPEAKING)
    stateRef.current = AGENT_STATES.SPEAKING
    setAiMessage(rawText)
    lastQuestionRef.current = rawText
    shouldAutoListenRef.current = autoListenAfter

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 0.96
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Assign Indian voice
    const bestVoice = getBestVoiceForLang('hi-IN')
    if (bestVoice) {
      utterance.voice = bestVoice
      utterance.lang = bestVoice.lang
    } else {
      utterance.lang = 'hi-IN'
    }

    const handleSpeechEnd = () => {
      if (safetyEndTimeoutRef.current) clearTimeout(safetyEndTimeoutRef.current)

      if (shouldAutoListenRef.current) {
        // Wait 300ms pause after TTS ends to prevent speaker echo, then auto-record next turn!
        autoListenTimeoutRef.current = setTimeout(() => {
          console.log('[VoiceDebug] Turn-taking: 300ms post-TTS echo buffer elapsed. Auto-starting mic...')
          startRecording()
        }, 300)
      } else {
        setState(AGENT_STATES.IDLE)
        stateRef.current = AGENT_STATES.IDLE
      }
    }

    utterance.onend = handleSpeechEnd
    utterance.onerror = (e) => {
      console.warn('[VoiceDebug] SpeechSynthesis error:', e)
      handleSpeechEnd()
    }

    // Safety timeout in case Chrome/Safari drops onend event on long text
    const estimatedDurationMs = Math.max(2500, cleanText.length * 95)
    safetyEndTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === AGENT_STATES.SPEAKING) {
        console.warn('[VoiceDebug] Safety speech end triggered')
        handleSpeechEnd()
      }
    }, estimatedDurationMs)

    window.speechSynthesis.speak(utterance)
  }, [stopAll, startRecording])

  // 6. Barge-in (Interruption: cancel speech immediately and start recording)
  const bargeIn = useCallback(() => {
    console.log('[VoiceDebug] Barge-in triggered by user!')
    stopAll()
    startRecording()
  }, [stopAll, startRecording])

  // 7. Text Input Turn Handler (Uses Gemini Text Brain or Local Fallback)
  const handleText = useCallback(async (text) => {
    stopAll()
    setState(AGENT_STATES.PROCESSING)
    stateRef.current = AGENT_STATES.PROCESSING
    setVoiceError(null)

    try {
      const response = await callGeminiTextBrain({
        text,
        currentProfile: currentProfileRef.current,
        mode: modeRef.current,
        lastQuestion: lastQuestionRef.current,
        apiKey: apiKeyRef.current || getGeminiApiKey()
      })

      if (response && response.replyText) {
        if (response.updates && Object.keys(response.updates).length > 0) {
          onProfileUpdateRef.current?.(response.updates)
        }
        if (response.intent) {
          onIntentRef.current?.(response.intent, response)
        }

        onAiMessageRef.current?.(response.replyText)
        speak(response.replyText, response.shouldAutoListen !== false)
      } else {
        setState(AGENT_STATES.IDLE)
      }
    } catch (err) {
      console.error('[VoiceDebug] Text turn processing failed:', err)
      setVoiceError(`Text error: ${err.message}`)
      setState(AGENT_STATES.IDLE)
    }
  }, [stopAll, speak])

  return {
    state,
    volumeLevel,
    lastTranscript,
    aiMessage,
    voiceError,
    clearVoiceError: () => setVoiceError(null),
    isKeyConfigured,
    audioSupported,
    startRecording,
    stopRecordingAndSend,
    speak,
    bargeIn,
    stopAll,
    handleText,
    isSpeaking: state === AGENT_STATES.SPEAKING,
    isListening: state === AGENT_STATES.LISTENING,
    isProcessing: state === AGENT_STATES.PROCESSING,
    isIdle: state === AGENT_STATES.IDLE
  }
}
