import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import TopBar from '../components/TopBar'
import { useVoiceAgent, AGENT_STATES } from '../hooks/useVoiceAgent'
import { getGeminiApiKey, setGeminiApiKey, isGeminiKeyConfigured, testGeminiApiKey } from '../utils/voiceAgent'
import {
  getWorker,
  saveWorker,
  generateSkillId,
  SKILL_METAS
} from '../data/seedData'
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Check,
  Edit3,
  Loader2,
  RefreshCw,
  Camera,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  AlertTriangle
} from 'lucide-react'

const AVAILABLE_SKILLS = ['Plumber', 'Electrician', 'Mason', 'Carpenter', 'Painter', 'AC Technician']

export default function VoiceBuilderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser, linkWorkerProfile } = useAuth()
  const { t, lang } = useLanguage()
  const isHindi = lang === 'hi'

  // Detect Edit Mode: explicit query param or if currentUser already has an active worker profile
  const isEditParam = searchParams.get('mode') === 'edit'
  const existingWorker = currentUser?.workerId ? getWorker(currentUser.workerId) : null
  const isEditMode = Boolean(isEditParam && existingWorker)

  // Profile state — prefilled if Edit Mode
  const [profile, setProfile] = useState(() => {
    if (isEditMode && existingWorker) {
      return {
        id: existingWorker.id,
        skillId: existingWorker.skillId,
        name: existingWorker.name || currentUser?.name || '',
        trade: existingWorker.skill || '',
        skill: existingWorker.skill || '',
        experience: existingWorker.experience ? `${existingWorker.experience} ${isHindi ? 'साल' : 'Years'}` : '',
        area: existingWorker.area || '',
        rate: existingWorker.rate || '',
        rateNum: existingWorker.rateNum || null,
        rateType: existingWorker.rateType || 'visit',
        avatar: existingWorker.avatar || null,
        verificationCount: existingWorker.verificationCount || 0,
        verifiedPhones: existingWorker.verifiedPhones || [],
        status: existingWorker.status || 'pending',
        sponsoredBy: existingWorker.sponsoredBy || null,
        workMedia: existingWorker.workMedia || [],
        reviews: existingWorker.reviews || [],
        bookings: existingWorker.bookings || []
      }
    }
    return {
      name: currentUser?.name || '',
      trade: '',
      skill: '',
      experience: '',
      area: '',
      rate: '',
      rateNum: null,
      rateType: 'visit'
    }
  })

  // Conversation turns log
  const [messages, setMessages] = useState([])

  // Step states: 'chat' | 'confirm' | 'photo'
  const [step, setStep] = useState('chat')
  const [photoPreview, setPhotoPreview] = useState(existingWorker?.avatar || null)
  const [fieldToEdit, setFieldToEdit] = useState(null)
  const [inputText, setInputText] = useState('')
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState([])

  // Quick In-App Gemini API Key Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey())
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')

  const chatBottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const hasInitializedRef = useRef(false)

  // Multimodal Voice Agent Hook (Real MediaRecorder Audio + VAD + Gemini 2.5 Flash)
  const {
    state,
    volumeLevel,
    lastTranscript,
    aiMessage,
    voiceError,
    clearVoiceError,
    isKeyConfigured,
    audioSupported,
    startRecording,
    stopRecordingAndSend,
    speak,
    bargeIn,
    stopAll,
    handleText,
    isSpeaking,
    isListening,
    isProcessing,
    isIdle
  } = useVoiceAgent({
    mode: isEditMode ? 'edit' : 'onboarding',
    currentProfile: profile,
    onProfileUpdate: (updates) => {
      console.log("[GeminiVoice] Profile Updates Received & Merging:", updates)
      setProfile(prev => {
        const next = { ...prev }
        // Merge non-null updates
        Object.entries(updates).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== 'null') {
            next[k] = v
          }
        })

        if (updates.trade && !next.skill) next.skill = updates.trade
        if (updates.skill && !next.trade) next.trade = updates.skill
        if (updates.rate && !next.rateNum) {
          const numMatch = String(updates.rate).match(/\d+/)
          if (numMatch) next.rateNum = parseInt(numMatch[0], 10)
        }

        // Save immediately to localStorage
        if (isEditMode && existingWorker) {
          const updatedWorker = {
            ...existingWorker,
            name: next.name || existingWorker.name,
            skill: next.trade || next.skill || existingWorker.skill,
            experience: next.experience || existingWorker.experience,
            area: next.area || existingWorker.area,
            rate: next.rate || existingWorker.rate,
            rateNum: next.rateNum || existingWorker.rateNum,
            rateType: next.rateType || existingWorker.rateType
          }
          saveWorker(updatedWorker)
        }
        try {
          localStorage.setItem('hc_draft_profile', JSON.stringify(next))
        } catch {}

        return next
      })

      // Brief green highlight animation on updated fields
      const updatedKeys = Object.keys(updates)
      setRecentlyUpdatedFields(updatedKeys)
      setTimeout(() => setRecentlyUpdatedFields([]), 2500)
    },
    onIntent: (intent, res) => {
      console.log("[VoiceDebug] Voice Intent Received:", intent)
      if (intent === 'confirm_yes') {
        setTimeout(() => setStep('confirm'), 600)
      } else if (intent === 'finish') {
        setTimeout(() => setStep('confirm'), 1000)
      } else if (intent === 'confirm_no') {
        setStep('chat')
      }
    },
    onUserMessage: (transcript) => {
      setMessages(prev => [...prev, { sender: 'user', text: `🎙️ "${transcript}"`, time: Date.now() }])
    },
    onAiMessage: (replyText) => {
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, time: Date.now() }])
    }
  })

  // Initial greeting on mount
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    let greeting = ''
    if (isEditMode && existingWorker) {
      greeting = isHindi
        ? `नमस्ते ${existingWorker.name || ''} जी! आप अपने कार्ड में क्या बदलना चाहते हैं? जैसे नया रेट, एरिया या तजुर्बा बोलिए।`
        : `Namaste ${existingWorker.name || ''} ji! Aap apne card mein kya badalna chahte hain? Boliye, jaise naya rate, area ya tajurba.`
    } else {
      greeting = isHindi
        ? 'नमस्ते! हुनरकार्ड में आपका स्वागत है। आप क्या काम करते हैं? जैसे प्लंबर, इलेक्ट्रीशियन, राजमिस्त्री, बढ़ई या पेंटर?'
        : 'Namaste! HunarCard AI me aapka swagat hai. Aap kya kaam karte hain? Jaise Plumber, Electrician, Mason, Carpenter, Painter ya AC Technician?'
    }

    setMessages([{ sender: 'ai', text: greeting, time: Date.now() }])

    // Wait 400ms and speak with auto-listen turned on
    const timer = setTimeout(() => {
      speak(greeting, true)
    }, 400)

    return () => {
      clearTimeout(timer)
      stopAll()
    }
  }, [isEditMode, isHindi, speak, stopAll])

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing, isListening])

  // Save API key from modal with real lightweight connection test
  const handleSaveModalApiKey = async () => {
    const trimmed = (apiKeyInput || '').trim()
    if (!trimmed) {
      setTestStatus('error')
      setTestMessage(isHindi ? 'कृपया जेमिनी API की दर्ज करें' : 'Please enter a Gemini API key')
      return
    }

    setTestStatus('testing')
    setTestMessage(isHindi ? 'कनेक्शन जांच रहे हैं...' : 'Testing connection to Gemini...')

    const testRes = await testGeminiApiKey(trimmed)
    if (testRes.success) {
      setGeminiApiKey(trimmed)
      setTestStatus('success')
      setTestMessage('✅ Connected! Voice AI ready.')
      setTimeout(() => {
        setShowSettingsModal(false)
        setTestStatus(null)
        setTestMessage('')
      }, 1500)
    } else {
      setTestStatus('error')
      setTestMessage(testRes.error || (isHindi ? 'कनेक्शन असफल रहा' : 'Connection failed'))
    }
  }

  // Handle Text Submission
  const handleUserTextMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim()
    if (!text) return

    setInputText('')
    stopAll()

    setMessages(prev => [...prev, { sender: 'user', text, time: Date.now() }])
    await handleText(text)
  }

  // 1-Tap Manual Trade Selector Chip
  const handleSelectTradeManually = (selectedTrade) => {
    setProfile(prev => ({ ...prev, skill: selectedTrade, trade: selectedTrade }))
    setRecentlyUpdatedFields(['trade', 'skill'])
    setTimeout(() => setRecentlyUpdatedFields([]), 2500)
    handleUserTextMessage(isHindi ? `मैं ${selectedTrade} हूँ` : `Main ${selectedTrade} hoon`)
  }

  // Photo Selector
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result)
    }
    reader.readAsDataURL(file)
  }

  // Final Save & Update (writes to SAME worker record in localStorage)
  const handleFinalSave = () => {
    stopAll()

    const rawExp = profile.experience
    const expNum = typeof rawExp === 'number' ? rawExp : parseInt(String(rawExp).replace(/\D/g, ''), 10) || 3

    if (isEditMode && existingWorker) {
      const updatedWorker = {
        ...existingWorker,
        name: profile.name || existingWorker.name,
        skill: profile.trade || profile.skill || existingWorker.skill,
        experience: expNum,
        area: profile.area || existingWorker.area,
        rate: profile.rate || existingWorker.rate,
        rateNum: profile.rateNum || existingWorker.rateNum,
        rateType: profile.rateType || existingWorker.rateType,
        avatar: photoPreview || existingWorker.avatar
      }
      saveWorker(updatedWorker)
      navigate('/dashboard')
      return
    }

    const workerId = `worker-${Date.now()}`
    const skillId = generateSkillId(profile.area || 'DEL')

    const newWorker = {
      id: workerId,
      skillId,
      name: profile.name || currentUser?.name || (isHindi ? 'कारीगर' : 'Worker'),
      skill: profile.trade || profile.skill || 'Plumber',
      experience: expNum,
      area: profile.area || 'Sonipat, Haryana',
      rate: profile.rate || (isHindi ? '₹300 / विजिट' : '₹300 / visit'),
      rateNum: profile.rateNum || 300,
      rateType: profile.rateType || 'visit',
      phone: currentUser?.phone || '9876543210',
      avatar: photoPreview || `https://api.dicebear.com/9.x/micah/svg?seed=${workerId}`,
      verificationCount: 0,
      verifiedPhones: [],
      status: 'pending',
      sponsoredBy: null,
      createdAt: Date.now(),
      workMedia: [],
      reviews: [],
      bookings: []
    }

    saveWorker(newWorker)
    linkWorkerProfile(workerId)
    navigate('/dashboard')
  }

  // Voice Orb Click Handler
  const handleOrbClick = () => {
    if (isSpeaking) {
      // Barge-in: interrupt AI speech immediately and start recording!
      bargeIn()
    } else if (isListening) {
      // Tap while recording: IMMEDIATELY stop and send to Gemini!
      console.log('[VoiceDebug] User tapped red orb to stop recording and send.')
      stopRecordingAndSend()
    } else if (isProcessing) {
      // Currently processing audio with Gemini
    } else {
      // Idle -> start recording real audio
      startRecording()
    }
  }

  const isConnected = isKeyConfigured || isGeminiKeyConfigured()

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col pb-6 transition-colors">
      <TopBar onOpenSettings={() => setShowSettingsModal(true)} />

      <div className="max-w-lg w-full mx-auto px-4 pt-3 flex-1 flex flex-col">
        {/* Header Strip with Gemini Live Connection Badge */}
        <div className="flex items-center justify-between mb-2.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xl shadow-xs">
              {isEditMode ? '✏️' : '🎙️'}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>
                  {isEditMode
                    ? (isHindi ? 'बोलकर प्रोफाइल बदलें' : 'Edit Profile by Voice')
                    : (isHindi ? 'बोलकर प्रोफाइल बनाएं' : 'Gemini Live Voice AI')}
                </span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  {isEditMode ? 'EDIT' : 'AI LIVE'}
                </span>
              </h2>
              <div className="flex items-center gap-1 mt-0.5">
                {isConnected ? (
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    <span>{isHindi ? 'जेमिनी लाइव ऑडियो कनेक्टेड' : 'Gemini Live Audio Connected'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <AlertCircle size={11} />
                    <span>{isHindi ? 'सेटिंग्स में जेमिनी की जोड़ें' : 'Add Gemini API Key in Settings'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Replay or Mute AI Button */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopAll()
                } else {
                  const lastAi = [...messages].reverse().find(m => m.sender === 'ai')?.text
                  speak(lastAi || (isHindi ? 'नमस्ते! आप क्या काम करते हैं?' : 'Namaste! Aap kya kaam karte hain?'), true)
                }
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
              title={isSpeaking ? 'Mute AI' : 'Replay Voice'}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Visible Voice Error Banner (Never Fail Silently) */}
        {voiceError && (
          <div className="mb-2 p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-xs animate-shake">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <span className="font-semibold leading-tight">{voiceError}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => {
                  clearVoiceError()
                  setShowSettingsModal(true)
                }}
                className="text-[11px] font-bold bg-red-100 dark:bg-red-900/60 px-2 py-1 rounded-lg hover:underline"
              >
                Settings
              </button>
              <button
                onClick={clearVoiceError}
                className="text-red-400 hover:text-red-600 p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: CONVERSATIONAL CHAT */}
        {step === 'chat' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-2.5 mb-2 pr-1 max-h-[35vh]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-hunar-blue text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block mb-0.5">
                        {isHindi ? 'हुनरकार्ड वॉयस AI' : 'HunarCard Voice AI'}
                      </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Processing / Thinking indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-2xl px-4 py-2 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2 shadow-xs">
                    <Loader2 size={14} className="animate-spin text-teal-600" />
                    <span>{isHindi ? 'समझ रही हूँ... (Gemini 2.5 Flash)' : 'Samajh rahi hoon... (Gemini 2.5 Flash)'}</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* LIVE PROFILE ASSEMBLY CARDS (Interactive: Voice Updated + Tap to Edit) */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-slate-900 dark:to-teal-950/40 rounded-2xl p-3 border border-teal-200/80 dark:border-teal-900/60 mb-2 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>{isHindi ? 'प्रोफाइल कार्ड (बदलने के लिए टैप करें):' : 'Profile Fields Assembly (Tap to edit):'}</span>
                </span>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
                  {[profile.name, (profile.trade || profile.skill), profile.experience, profile.area, profile.rate].filter(Boolean).length} / 5 {isHindi ? 'तैयार' : 'Done'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {/* 1. Trade Card */}
                <div
                  onClick={() => setFieldToEdit('trade')}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all hover:scale-101 ${
                    recentlyUpdatedFields.includes('trade') || recentlyUpdatedFields.includes('skill')
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/60'
                      : (profile.trade || profile.skill)
                      ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-300 dark:border-teal-700'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{isHindi ? 'काम / हुनर' : 'Trade / Hunar'}</span>
                    <Edit3 size={10} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5 truncate">
                    {(profile.trade || profile.skill) ? (
                      <>
                        <span>{SKILL_METAS[profile.trade || profile.skill]?.icon || '🛠️'}</span>
                        <span className="text-teal-700 dark:text-teal-300">{profile.trade || profile.skill}</span>
                      </>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 italic">⏳ {isHindi ? 'पूछ रहे हैं...' : 'Waiting...'}</span>
                    )}
                  </span>
                </div>

                {/* 2. Name Card */}
                <div
                  onClick={() => setFieldToEdit('name')}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all hover:scale-101 ${
                    recentlyUpdatedFields.includes('name')
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/60'
                      : profile.name
                      ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{isHindi ? 'नाम' : 'Name'}</span>
                    <Edit3 size={10} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                    {profile.name || <span className="text-amber-600 dark:text-amber-400 italic">⏳ {isHindi ? 'पूछ रहे हैं...' : 'Waiting...'}</span>}
                  </span>
                </div>

                {/* 3. Experience Card */}
                <div
                  onClick={() => setFieldToEdit('experience')}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all hover:scale-101 ${
                    recentlyUpdatedFields.includes('experience')
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/60'
                      : profile.experience
                      ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{isHindi ? 'तजुर्बा' : 'Experience'}</span>
                    <Edit3 size={10} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                    {profile.experience ? profile.experience : <span className="text-amber-600 dark:text-amber-400 italic">⏳ {isHindi ? 'पूछ रहे हैं...' : 'Waiting...'}</span>}
                  </span>
                </div>

                {/* 4. Area Card */}
                <div
                  onClick={() => setFieldToEdit('area')}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all hover:scale-101 ${
                    recentlyUpdatedFields.includes('area')
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/60'
                      : profile.area
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{isHindi ? 'एरिया' : 'Area'}</span>
                    <Edit3 size={10} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                    {profile.area || <span className="text-amber-600 dark:text-amber-400 italic">⏳ {isHindi ? 'पूछ रहे हैं...' : 'Waiting...'}</span>}
                  </span>
                </div>

                {/* 5. Rate Card */}
                <div
                  onClick={() => setFieldToEdit('rate')}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all hover:scale-101 col-span-2 sm:col-span-1 ${
                    recentlyUpdatedFields.includes('rate')
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/60'
                      : profile.rate
                      ? 'bg-green-50 dark:bg-green-950/80 border-green-300 dark:border-green-700 ring-1 ring-green-400'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{isHindi ? 'रेट' : 'Rate'}</span>
                    <Edit3 size={10} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-hunar-green mt-0.5 block truncate">
                    {profile.rate || <span className="text-amber-600 dark:text-amber-400 italic">⏳ {isHindi ? 'पूछ रहे हैं...' : 'Waiting...'}</span>}
                  </span>
                </div>
              </div>

              {/* 1-Tap Quick Trade Chips */}
              <div className="mt-2 pt-1.5 border-t border-teal-200/60 dark:border-teal-900/40">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  {isHindi ? 'अपना काम चुनें:' : '1-Tap Trade Select:'}
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {AVAILABLE_SKILLS.map((sk) => {
                    const isSelected = (profile.trade || profile.skill) === sk
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => handleSelectTradeManually(sk)}
                        className={`text-[11px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 flex-shrink-0 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-hunar-teal text-white shadow-xs ring-2 ring-teal-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{SKILL_METAS[sk]?.icon || '🛠️'}</span>
                        <span>{sk}</span>
                        {isSelected && <Check size={11} className="ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* REAL MULTIMODAL AUDIO ORB & REACTIVE VAD SOUNDWAVE CONTROLLER */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center">
              {/* Voice Orb Button with Real Mic Volume Waveform */}
              <div className="relative flex items-center justify-center my-1">
                {/* Reactive Ring Layer */}
                <div
                  className={`absolute w-24 h-24 rounded-full transition-all duration-200 ${
                    isSpeaking
                      ? 'bg-gradient-to-r from-teal-400 to-indigo-500 opacity-70 orb-speaking'
                      : isListening
                      ? 'bg-gradient-to-r from-rose-400 to-red-500 opacity-70 orb-listening'
                      : isProcessing
                      ? 'border-4 border-dashed border-teal-500 animate-spin opacity-75'
                      : 'bg-teal-500/20 opacity-0'
                  }`}
                />

                {/* Central Orb */}
                <button
                  type="button"
                  onClick={handleOrbClick}
                  className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 select-none ${
                    isSpeaking
                      ? 'bg-gradient-to-tr from-teal-600 via-indigo-600 to-purple-600 text-white'
                      : isListening
                      ? 'bg-gradient-to-tr from-red-500 to-rose-600 text-white recording-pulse hover:scale-105'
                      : isProcessing
                      ? 'bg-slate-800 text-teal-400'
                      : 'bg-gradient-to-tr from-hunar-blue to-hunar-teal text-white mic-pulse hover:scale-105'
                  }`}
                  aria-label="Gemini Multimodal Voice AI"
                >
                  {isSpeaking ? (
                    /* Soundwave Bars while AI is speaking */
                    <div className="flex items-center gap-1">
                      <span className="w-1 bg-white rounded-full soundwave-bar" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 bg-white rounded-full soundwave-bar" style={{ animationDelay: '200ms' }} />
                      <span className="w-1 bg-white rounded-full soundwave-bar" style={{ animationDelay: '400ms' }} />
                      <span className="w-1 bg-white rounded-full soundwave-bar" style={{ animationDelay: '100ms' }} />
                    </div>
                  ) : isListening ? (
                    /* LIVE REACTIVE VAD VOLUME BARS responding to user's real mic audio! */
                    <div className="flex items-center gap-1 h-8">
                      {[0.5, 0.9, 1.5, 0.9, 0.5].map((factor, idx) => {
                        const calculatedHeight = Math.max(5, Math.min(28, (volumeLevel / 100) * 28 * factor))
                        return (
                          <span
                            key={idx}
                            className="w-1.5 bg-white rounded-full transition-all duration-75"
                            style={{ height: `${calculatedHeight}px` }}
                          />
                        )
                      })}
                    </div>
                  ) : isProcessing ? (
                    <Loader2 size={28} className="animate-spin" />
                  ) : (
                    <Mic size={28} />
                  )}
                </button>
              </div>

              {/* Status Caption */}
              <div className="text-center mt-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
                  {isSpeaking && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                      <span>{isHindi ? 'बोल रही हूँ... (रोकने के लिए टैप करें)' : 'Bol rahi hoon... (Tap to interrupt)'}</span>
                    </>
                  )}
                  {isListening && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>{isHindi ? 'सुन रही हूँ... बोलिए' : 'Sun rahi hoon... Boliye'}</span>
                    </>
                  )}
                  {isProcessing && (
                    <>
                      <RefreshCw size={12} className="animate-spin text-teal-500" />
                      <span>{isHindi ? 'समझ रही हूँ...' : 'Samajh rahi hoon...'}</span>
                    </>
                  )}
                  {isIdle && (
                    <span>{isHindi ? 'बोलने के लिए माइक दबाएं' : 'Tap karein aur Hindi ya English mein bolein'}</span>
                  )}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isListening
                    ? (isHindi ? 'बोल कर यहाँ टैप करें (या 1.5s चुप रहें)' : 'Bol kar yahan tap karein (ya 1.5s chup rahein)')
                    : isSpeaking
                    ? (isHindi ? 'बीच में बोलने के लिए टैप करें' : 'Tap orb for Barge-In')
                    : (isHindi ? 'आपकी आवाज सीधे जेमिनी तक पहुंचेगी' : 'Audio directly heard by Gemini')}
                </p>
              </div>

              {/* Text Input Fallback Bar */}
              <div className="w-full flex items-center gap-2 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  className="input-field text-xs py-2 px-3 rounded-xl flex-1"
                  placeholder={
                    isEditMode
                      ? (isHindi ? 'बदलाव लिखें (जैसे: रेट 400 रुपये)' : 'Type change (e.g. Rate 400 rupaye)')
                      : (isHindi ? 'यहाँ लिखकर भेजें...' : 'Type answer or detail here...')
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUserTextMessage()
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleUserTextMessage()}
                  className="w-9 h-9 rounded-xl bg-hunar-blue text-white flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
                  title="Send message"
                >
                  <Send size={15} />
                </button>
              </div>

              {/* Quick suggestion hint chips */}
              <div className="w-full flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">Quick:</span>
                {(isEditMode ? [
                  isHindi ? 'मेरा रेट अब 400 रुपये है' : 'Mera rate ab 400 rupaye hai',
                  isHindi ? 'तजुर्बा 8 साल हो गया' : 'Experience 8 saal ho gaya',
                  isHindi ? 'मैं बहालगढ़ में काम करता हूँ' : 'Main Bahalgarh mein kaam karta hoon',
                  isHindi ? 'हाँ सब सही है' : 'Haan sab theek hai'
                ] : [
                  isHindi ? 'मैं प्लंबर हूँ, 6 साल का काम है, सोनीपत में' : 'Main plumber hoon, 6 saal ka kaam hai, Sonipat mein',
                  'Six years experience',
                  isHindi ? 'इलेक्ट्रीशियन हूँ, रेट 300 रुपये' : 'Electrician hoon, rate 300 rupaye',
                  isHindi ? 'मेरा नाम रमेश कुमार है' : 'Mera naam Ramesh Kumar hai',
                  isHindi ? 'हाँ सब सही है' : 'Haan sab theek hai'
                ]).map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => handleUserTextMessage(hint)}
                    className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg flex-shrink-0 font-medium transition-colors"
                  >
                    "{hint}"
                  </button>
                ))}
              </div>

              {/* Direct Next Step Action */}
              <div className="w-full pt-1.5 mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="text-xs text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>{isHindi ? 'कार्ड चेक करें →' : 'Review Card Details →'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE CONFIRMATION & PARTIAL EDITING */}
        {step === 'confirm' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="app-card space-y-3.5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-2xl mb-1.5">
                  ✅
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {isEditMode
                    ? (isHindi ? 'अपडेट किया गया प्रोफाइल चेक करें' : 'Updated Profile Confirmation')
                    : (isHindi ? 'कार्ड तैयार है — चेक करें' : 'Card Ready Confirmation')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHindi
                    ? 'नीचे दी गई जानकारी जांचें। बदलने के लिए किसी भी फील्ड पर टैप करें।'
                    : 'Verify details below. You can tap any field to edit.'}
                </p>
              </div>

              {/* Field review with quick in-place edits */}
              <div className="space-y-2">
                {[
                  { key: 'name', label: isHindi ? 'नाम' : 'Naam / Name', val: profile.name },
                  { key: 'trade', label: isHindi ? 'काम / हुनर' : 'Hunar / Skill', val: profile.trade || profile.skill },
                  { key: 'experience', label: isHindi ? 'तजुर्बा' : 'Tajurba / Experience', val: profile.experience },
                  { key: 'area', label: isHindi ? 'क्षेत्र / एरिया' : 'Area / Kshetr', val: profile.area },
                  { key: 'rate', label: isHindi ? 'तय रेट' : 'Nirdharit Dar / Rate', val: profile.rate },
                ].map(({ key, label, val }) => (
                  <div
                    key={key}
                    onClick={() => setFieldToEdit(key)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-teal-400 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">{label}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{val || '—'}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline p-1 flex items-center gap-1"
                    >
                      <Edit3 size={13} />
                      <span>{isHindi ? 'बदलें' : 'Edit'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              <button
                onClick={handleFinalSave}
                className="btn-green text-sm py-3.5"
              >
                <span>
                  {isEditMode
                    ? (isHindi ? '✅ अपडेट कार्ड सेव करें' : '✅ Save Updated Card')
                    : (isHindi ? '✅ कार्ड सेव करें' : '✅ Confirm & Save Skill Card')}
                </span>
                <ArrowRight size={17} />
              </button>
              <button
                onClick={() => setStep('chat')}
                className="btn-secondary text-xs py-3"
              >
                <span>{isHindi ? 'दोबारा बोलें / AI से पूछें' : 'Speak Again / Ask AI'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PASSPORT PHOTO */}
        {step === 'photo' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="app-card text-center space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-2xl mb-1">
                📸
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isHindi ? 'पासपोर्ट फोटो लगाएं (वैकल्पिक)' : 'Passport Photo (Optional)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHindi ? 'फोटो आपके आधार जैसे डिजिटल स्किल कार्ड पर दिखेगी।' : 'Photo will appear on your Aadhaar-style Digital Skill Card.'}
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-40 mx-auto rounded-2xl border-2 border-dashed border-teal-500 dark:border-teal-400 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:scale-102 transition-transform relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-3 text-slate-400">
                    <Camera size={36} className="text-teal-600 dark:text-teal-400 mb-1.5" />
                    <span className="text-[11px] font-bold text-center">{isHindi ? 'फोटो चुनने के लिए टैप करें' : 'Tap to choose Photo'}</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs py-2.5 max-w-xs mx-auto"
              >
                <Camera size={15} />
                <span>{isHindi ? 'फोटो चुनें' : 'Choose Photo'}</span>
              </button>
            </div>

            <div className="space-y-2 mt-3">
              <button
                onClick={handleFinalSave}
                className="btn-primary text-sm py-3.5"
              >
                <span>{isHindi ? '🎉 डिजिटल स्किल कार्ड बनाएं' : '🎉 Generate Digital Skill Card'}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Individual Field In-Place Editor */}
      {fieldToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {isHindi ? `बदलें: ${fieldToEdit}` : `Edit ${fieldToEdit}`}
              </h4>
              <button
                onClick={() => setFieldToEdit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              className="input-field text-sm py-2.5 mb-3"
              defaultValue={profile[fieldToEdit] || ''}
              id="editFieldInput"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const val = document.getElementById('editFieldInput')?.value
                  if (val) {
                    setProfile(p => ({
                      ...p,
                      [fieldToEdit]: val,
                      ...(fieldToEdit === 'trade' ? { skill: val } : {}),
                      ...(fieldToEdit === 'skill' ? { trade: val } : {})
                    }))
                    setRecentlyUpdatedFields([fieldToEdit])
                    setTimeout(() => setRecentlyUpdatedFields([]), 2500)
                  }
                  setFieldToEdit(null)
                }}
                className="btn-primary text-xs py-2.5"
              >
                {isHindi ? 'सेव करें' : 'Save Field'}
              </button>
              <button
                onClick={() => setFieldToEdit(null)}
                className="btn-secondary text-xs py-2.5"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Gemini API Key Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {isHindi ? 'जेमिनी लाइव वॉयस AI की' : 'Gemini Live Voice AI Key'}
                  </h4>
                  <p className="text-[10px] text-slate-500">Multimodal 2.5 Flash Audio Listening</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {isHindi
                  ? 'अपनी Google AI Studio API Key यहाँ डालें। यह आपके ब्राउज़र के localStorage में सुरक्षित रहेगी।'
                  : 'Paste your Google AI Studio API Key. It will be securely stored in your browser\'s localStorage for Gemini 2.5 Flash.'}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">
                API Key:
              </label>
              <input
                type="password"
                className="input-field text-xs py-2 font-mono"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value)
                  if (testStatus) {
                    setTestStatus(null)
                    setTestMessage('')
                  }
                }}
              />
            </div>

            {testMessage && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : testStatus === 'testing'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {testStatus === 'testing' && <Loader2 size={14} className="animate-spin text-blue-600 flex-shrink-0" />}
                {testStatus === 'success' && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
                {testStatus === 'error' && <AlertCircle size={14} className="text-red-600 flex-shrink-0" />}
                <span className="font-semibold leading-tight">{testMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveModalApiKey}
                disabled={testStatus === 'testing'}
                className="btn-primary text-xs py-2.5 flex-1 disabled:opacity-60"
              >
                {testStatus === 'testing' ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Connecting...</span>
                  </span>
                ) : (
                  <span>{testStatus === 'success' ? (isHindi ? '✅ सेव हो गया!' : '✅ Connected!') : (isHindi ? 'सेव व कनेक्ट करें' : 'Save & Connect')}</span>
                )}
              </button>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-2.5 px-3 flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300 w-auto"
                title="Get free API Key"
              >
                <span>{isHindi ? 'फ्री की लें' : 'Get Key'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
