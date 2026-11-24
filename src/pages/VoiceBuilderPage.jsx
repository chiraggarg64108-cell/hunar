import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import TopBar from '../components/TopBar'
import {
  RawAudioRecorder,
  processAudioWithGemini,
  processTextTurn,
  getFollowupQuestion,
  getMissingField,
  speakText,
  stopSpeaking,
  SKILL_KEYWORDS
} from '../utils/voiceParser'
import {
  getWorker,
  saveWorker,
  generateSkillId,
  SKILL_METAS
} from '../data/seedData'
import { Mic, MicOff, Send, Volume2, CheckCircle2, AlertCircle, Camera, RefreshCw, Sparkles, ArrowRight, Check, Edit3 } from 'lucide-react'

const AVAILABLE_SKILLS = ['Plumber', 'Electrician', 'Mason', 'Carpenter', 'Other']

export default function VoiceBuilderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser, linkWorkerProfile } = useAuth()
  const { t, lang } = useLanguage()

  // Detect Edit Mode: explicit query param or if currentUser already has an active worker profile
  const isEditParam = searchParams.get('mode') === 'edit'
  const existingWorker = currentUser?.workerId ? getWorker(currentUser.workerId) : null
  const isEditMode = Boolean(isEditParam && existingWorker)

  // Conversation turns log
  const [messages, setMessages] = useState([])

  // Profile state — prefilled if Edit Mode (PART C.1)
  const [profile, setProfile] = useState(() => {
    if (isEditMode && existingWorker) {
      return {
        id: existingWorker.id,
        skillId: existingWorker.skillId,
        name: existingWorker.name || currentUser?.name || '',
        skill: existingWorker.skill || '',
        experience: existingWorker.experience || null,
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
        bookings: existingWorker.bookings || [],
        _expecting: null
      }
    }
    return {
      name: currentUser?.name || '',
      skill: '',
      experience: null,
      area: '',
      rate: '',
      rateNum: null,
      rateType: 'visit',
      _expecting: 'skill'
    }
  })

  // Input states
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)

  // Step states: 'chat' | 'confirm' | 'photo'
  const [step, setStep] = useState('chat')
  const [photoPreview, setPhotoPreview] = useState(existingWorker?.avatar || null)
  const [fieldToEdit, setFieldToEdit] = useState(null)

  const recorderRef = useRef(null)
  const chatBottomRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize greeting prompt (PART C.2)
  useEffect(() => {
    let initialGreeting = ''
    if (isEditMode && existingWorker) {
      initialGreeting = `Namaste ${existingWorker.name || ''} ji! Aap apne card mein kya badalna chahte hain? Boliye, jaise naya rate, area ya tajurba.`
    } else {
      initialGreeting = t('aiGreeting')
    }

    const initialMsg = { sender: 'ai', text: initialGreeting, time: Date.now() }
    setMessages([initialMsg])

    // High clarity TTS speech output (PART B)
    speakText(initialGreeting, lang)

    return () => {
      stopSpeaking()
      if (recorderRef.current) {
        recorderRef.current.stop()
      }
    }
  }, [lang, isEditMode])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  // PART A: Handle MediaRecorder Audio Capture & Multimodal Gemini API Processing
  const toggleRecording = async () => {
    if (isRecording) {
      // STOP recording & process audio
      setIsRecording(false)
      setIsAiThinking(true)
      stopSpeaking()

      try {
        if (!recorderRef.current) return
        const { blob, base64, mimeType } = await recorderRef.current.stop()

        if (!base64) {
          setIsAiThinking(false)
          return
        }

        console.log("Recorded Audio Blob captured. Sending directly to Gemini Audio API...")

        // Send audio directly to Gemini (Multimodal listen + extract in 1 step)
        const result = await processAudioWithGemini({
          audioBase64: base64,
          mimeType,
          currentProfile: profile,
          isEditMode
        })

        if (result && result.transcript) {
          // Append transcribed audio as user message
          const userMsg = { sender: 'user', text: `🎙️ "${result.transcript}"`, time: Date.now() }
          setMessages(prev => [...prev, userMsg])

          // PART C.3: Explicit partial merge
          setProfile(result.updatedProfile)

          // AI reply
          const aiMsg = { sender: 'ai', text: result.replyMessage, time: Date.now() }
          setMessages(prev => [...prev, aiMsg])
          speakText(result.replyMessage, lang)

          if (result.isComplete || isEditMode) {
            setTimeout(() => {
              setStep('confirm')
              const p = result.updatedProfile
              const confirmPrompt = `Naam: ${p.name || 'Worker'}, Kaam: ${p.skill || 'Karigar'}, Tajurba: ${p.experience || 1} Saal, Area: ${p.area || 'Sonipat'}, Rate: ${p.rate || '₹300'}. Kya sab sahi hai?`
              speakText(confirmPrompt, lang)
            }, 1200)
          }
        } else {
          // If Gemini Audio API call failed or has no key, notify user to use text fallback
          const warnMsg = {
            sender: 'ai',
            text: 'Audio capture receive hua. Kripya neeche text box se bhi confirm karein ya dobara bolein.',
            time: Date.now()
          }
          setMessages(prev => [...prev, warnMsg])
        }
      } catch (err) {
        console.error("Audio recording/processing error:", err)
      } finally {
        setIsAiThinking(false)
      }
      return
    }

    // START recording raw audio
    stopSpeaking()
    try {
      const rec = new RawAudioRecorder()
      await rec.start()
      recorderRef.current = rec
      setIsRecording(true)
    } catch (e) {
      console.error("Mic access denied or error:", e)
      alert("Microphone permission zaroori hai audio record karne ke liye.")
      setIsRecording(false)
    }
  }

  // Handle Text Input Turn (Always available fallback)
  const handleUserTextMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim()
    if (!text) return

    stopSpeaking()
    setInputText('')

    const userMsg = { sender: 'user', text, time: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setIsAiThinking(true)

    try {
      const result = await processTextTurn(text, profile, isEditMode)

      setProfile(result.updatedProfile)

      const aiMsg = { sender: 'ai', text: result.replyMessage, time: Date.now() }
      setMessages(prev => [...prev, aiMsg])
      speakText(result.replyMessage, lang)

      if (result.isComplete || isEditMode) {
        setTimeout(() => {
          setStep('confirm')
          const p = result.updatedProfile
          const confirmPrompt = `Naam: ${p.name || 'Worker'}, Kaam: ${p.skill || 'Karigar'}, Tajurba: ${p.experience || 1} Saal, Area: ${p.area || 'Sonipat'}, Rate: ${p.rate || '₹300'}. Kya sab sahi hai?`
          speakText(confirmPrompt, lang)
        }, 1200)
      }
    } catch (e) {
      console.error("Error processing text input:", e)
    } finally {
      setIsAiThinking(false)
    }
  }

  // 1-Tap Manual Skill Chip Selector
  const handleSelectSkillManually = (selectedSkill) => {
    setProfile(prev => {
      const updated = { ...prev, skill: selectedSkill }
      const nextMissing = isEditMode ? null : getMissingField(updated)
      updated._expecting = nextMissing
      return updated
    })
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

  // PART C.4: Final Save & Update (writes to SAME worker record in localStorage)
  const handleFinalSave = () => {
    if (isEditMode && existingWorker) {
      // PART C.4: Update existing profile in-place, zero duplicate IDs!
      const updatedWorker = {
        ...existingWorker,
        name: profile.name || existingWorker.name,
        skill: profile.skill || existingWorker.skill,
        experience: profile.experience || existingWorker.experience,
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

    // New profile creation
    const workerId = `worker-${Date.now()}`
    const skillId = generateSkillId(profile.area || 'DEL')

    const newWorker = {
      id: workerId,
      skillId,
      name: profile.name || currentUser?.name || 'Worker',
      skill: profile.skill || 'Plumber',
      experience: profile.experience || 3,
      area: profile.area || 'Sonipat, Haryana',
      rate: profile.rate || '₹300 / visit',
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col pb-6 transition-colors">
      <TopBar />

      <div className="max-w-lg w-full mx-auto px-4 pt-3 flex-1 flex flex-col">
        {/* Header Strip */}
        <div className="flex items-center justify-between mb-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xl">
              {isEditMode ? '✏️' : '🤖'}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isEditMode ? 'Edit Profile by Voice' : t('builderTitle')}</span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  {isEditMode ? 'EDIT MODE' : 'AI MULTIMODAL'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditMode ? 'Boliye aur jo field badalna ho vo update karein' : t('builderSub')}
              </p>
            </div>
          </div>
          <button
            onClick={() => speakText(messages[messages.length - 1]?.text || t('aiGreeting'), lang)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
            title="Replay Voice Prompt"
          >
            <Volume2 size={18} />
          </button>
        </div>

        {/* STEP 1: CONVERSATIONAL CHAT */}
        {step === 'chat' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 max-h-[42vh]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-hunar-blue text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block mb-0.5">
                        HunarCard Helper
                      </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                    <RefreshCw size={14} className="animate-spin text-teal-600" />
                    <span>Gemini AI multimodal audio listening...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* LIVE PROFILE ASSEMBLY SUMMARY (PART C.1: Pre-filled in Edit Mode) */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-slate-900 dark:to-teal-950/40 rounded-2xl p-3.5 border border-teal-200/80 dark:border-teal-900/60 mb-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>{isEditMode ? 'Current Card Details (Editing):' : t('liveSummaryTitle')}</span>
                </span>
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                  {isEditMode ? 'Pre-filled' : `${[profile.name, profile.skill, profile.experience, profile.area, profile.rate].filter(Boolean).length} / 5 Fields`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* Trade */}
                <div className={`p-2 rounded-xl border transition-colors ${
                  profile.skill
                    ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-300 dark:border-teal-700'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Trade / Hunar</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                    {profile.skill ? (
                      <>
                        <span>{SKILL_METAS[profile.skill]?.icon || '🛠️'}</span>
                        <span className="text-teal-700 dark:text-teal-300">{profile.skill}</span>
                      </>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 italic">⏳ Waiting...</span>
                    )}
                  </span>
                </div>

                {/* Name */}
                <div className={`p-2 rounded-xl border transition-colors ${
                  profile.name
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                    {profile.name || <span className="text-amber-600 dark:text-amber-400 italic">⏳ Waiting...</span>}
                  </span>
                </div>

                {/* Experience */}
                <div className={`p-2 rounded-xl border transition-colors ${
                  profile.experience
                    ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Experience</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {profile.experience ? `${profile.experience} ${t('years')}` : <span className="text-amber-600 dark:text-amber-400 italic">⏳ Waiting...</span>}
                  </span>
                </div>

                {/* Area */}
                <div className={`p-2 rounded-xl border transition-colors ${
                  profile.area
                    ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Area</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                    {profile.area || <span className="text-amber-600 dark:text-amber-400 italic">⏳ Waiting...</span>}
                  </span>
                </div>

                {/* Rate */}
                <div className={`p-2 rounded-xl border transition-colors col-span-2 sm:col-span-1 ${
                  profile.rate
                    ? 'bg-green-50 dark:bg-green-950/80 border-green-300 dark:border-green-700 ring-2 ring-green-400'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Rate</span>
                  <span className="font-bold text-hunar-green mt-0.5 block">
                    {profile.rate || <span className="text-amber-600 dark:text-amber-400 italic">⏳ Waiting...</span>}
                  </span>
                </div>
              </div>

              {/* 1-Tap Quick Skill Selector Chips */}
              <div className="mt-2.5 pt-2 border-t border-teal-200/60 dark:border-teal-900/40">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'hi' ? 'Kaam Chunein (Tap to change):' : 'Select Trade:'}
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {AVAILABLE_SKILLS.map((sk) => {
                    const isSelected = profile.skill === sk
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => handleSelectSkillManually(sk)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 flex-shrink-0 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-hunar-teal text-white shadow-sm ring-2 ring-teal-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{SKILL_METAS[sk]?.icon || '🛠️'}</span>
                        <span>{sk}</span>
                        {isSelected && <Check size={12} className="ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* PART A: MEDIARECORDER MIC CONTROL BAR */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-2.5">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all select-none shadow-xl ${
                    isRecording
                      ? 'bg-red-500 recording-pulse text-white scale-110'
                      : 'bg-gradient-to-tr from-hunar-blue to-hunar-teal mic-pulse text-white active:scale-95'
                  }`}
                  aria-label="Tap to speak"
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
                <p className="text-xs font-bold mt-2 text-slate-600 dark:text-slate-300">
                  {isRecording ? '🔴 Recording... Tap again to finish' : 'Tap Mic & Speak in Hindi/English'}
                </p>
                {isRecording && (
                  <p className="text-[11px] text-red-500 font-semibold animate-pulse mt-0.5">
                    Audio stream recording active (MediaRecorder)
                  </p>
                )}
              </div>

              {/* Text Input Fallback Bar (PART A.5) */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  className="input-field text-sm py-2.5 rounded-xl"
                  placeholder={isEditMode ? 'Type change (e.g. Rate 400 rupaye kar do)' : 'Type message here if mic is busy...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUserTextMessage()
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleUserTextMessage()}
                  className="w-11 h-11 rounded-xl bg-hunar-blue text-white flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>

              {/* Quick suggestion tags for testing Edit & Creation */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">Quick:</span>
                {(isEditMode ? [
                  'Mera rate ab 400 rupaye hai',
                  'Main Bahalgarh mein kaam karta hoon',
                  'Experience 8 saal ho gaya'
                ] : [
                  'Main plumber hoon, 6 saal ka kaam hai, Sonipat mein rehta hoon',
                  'Electrician ka kaam karta hoon main, bijli theek karta hoon',
                  'Mera rate 300 rupaye per visit hai'
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
            </div>
          </div>
        )}

        {/* STEP 2: VOICE ACCENT CONFIRMATION & PARTIAL EDITING (PART C.5) */}
        {step === 'confirm' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="app-card space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-3xl mb-2">
                  ✅
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isEditMode ? 'Updated Profile Confirmation' : t('cardReadySuccess')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'hi' ? 'Voice confirmation: Sabhi details check karein.' : 'Please verify updated fields before saving.'}
                </p>
              </div>

              {/* Field review with quick in-place edits */}
              <div className="space-y-2.5">
                {[
                  { key: 'name', label: 'Naam / Name', val: profile.name },
                  { key: 'skill', label: 'Hunar / Skill', val: profile.skill },
                  { key: 'experience', label: 'Tajurba / Experience', val: `${profile.experience} Saal` },
                  { key: 'area', label: 'Area / Kshetr', val: profile.area },
                  { key: 'rate', label: 'Nirdharit Dar / Rate', val: profile.rate },
                ].map(({ key, label, val }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">{label}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{val || '—'}</span>
                    </div>
                    <button
                      onClick={() => setFieldToEdit(key)}
                      className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      Edit ✏️
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick field edit modal */}
              {fieldToEdit && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-2">
                    Edit {fieldToEdit}:
                  </p>
                  <input
                    type="text"
                    className="input-field text-sm py-2 mb-2"
                    defaultValue={profile[fieldToEdit] || ''}
                    id="editFieldInput"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const val = document.getElementById('editFieldInput')?.value
                        if (val) setProfile(p => ({ ...p, [fieldToEdit]: val }))
                        setFieldToEdit(null)
                      }}
                      className="btn-primary text-xs py-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setFieldToEdit(null)}
                      className="btn-secondary text-xs py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-4">
              <button
                onClick={handleFinalSave}
                className="btn-green text-base py-4"
              >
                <span>{isEditMode ? '✅ Save Updated Card' : t('confirmYes')}</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setStep('chat')}
                className="btn-secondary text-sm py-3.5"
              >
                <span>{t('confirmEdit')}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PASSPORT PHOTO */}
        {step === 'photo' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="app-card text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-3xl mb-2">
                📸
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {t('photoStepTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('photoStepSub')}
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-36 h-44 mx-auto rounded-2xl border-2 border-dashed border-teal-500 dark:border-teal-400 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer shadow-md hover:scale-102 transition-transform relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-4 text-slate-400">
                    <Camera size={40} className="text-teal-600 dark:text-teal-400 mb-2" />
                    <span className="text-xs font-bold text-center">Tap to choose Passport Photo</span>
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
                className="btn-secondary text-sm py-3 max-w-xs mx-auto"
              >
                <Camera size={16} />
                <span>{t('photoUploadBtn')}</span>
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <button
                onClick={handleFinalSave}
                className="btn-primary text-base py-4"
              >
                <span>🎉 Generate Digital Skill Card</span>
                <ArrowRight size={18} />
              </button>
              {!photoPreview && (
                <button
                  onClick={handleFinalSave}
                  className="text-xs text-slate-400 dark:text-slate-500 font-semibold block text-center py-1 hover:underline"
                >
                  {t('photoSkipBtn')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
