// Onboarding Page — Voice-first profile creation
// Steps: Speak → Confirm → Photo → Card Ready → Add Work (optional)

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { LangToggle, AudioGuideBtn, StarPicker, Spinner, Toast, Avatar } from '../components/SharedComponents'
import {
  parseVoiceTranscript, getConfirmationText,
  speak, stopSpeaking, createRecognizer, isLikelyWorkPhoto
} from '../utils/voiceParser'
import {
  generateWorkerId, saveWorker, getSkillMeta, SKILLS, addWorkMedia
} from '../data/seedData'

const STEPS = { SPEAK: 'speak', CONFIRM: 'confirm', PHOTO: 'photo', READY: 'ready', WORK: 'work' }

const SKILL_OPTIONS = ['Plumber', 'Electrician', 'Mason', 'Carpenter']
const SKILL_ICONS = { Plumber: '🪠', Electrician: '💡', Mason: '🧱', Carpenter: '🔨' }

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [step, setStep] = useState(STEPS.SPEAK)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [profile, setProfile] = useState(null)
  const [editingProfile, setEditingProfile] = useState(null)
  const [avatarSrc, setAvatarSrc] = useState(null)
  const [workerId, setWorkerId] = useState(null)
  const [toast, setToast] = useState(null)
  const [irrelevantWarning, setIrrelevantWarning] = useState(null)
  const [uploadedMedia, setUploadedMedia] = useState([])
  const [speechSupported, setSpeechSupported] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')

  const recognizerRef = useRef(null)
  const photoInputRef = useRef(null)
  const workInputRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSpeechSupported(false)
    return () => {
      stopSpeaking()
      recognizerRef.current?.stop()
    }
  }, [])

  // Play audio guide for current step
  useEffect(() => {
    const guides = {
      [STEPS.SPEAK]: t('audioGuide'),
      [STEPS.CONFIRM]: lang === 'hi' ? 'Neeche diya hua card dekho aur confirm karo.' : 'Review the extracted info below and confirm.',
      [STEPS.PHOTO]: lang === 'hi' ? 'Apni ek photo lagao.' : 'Add your profile photo.',
      [STEPS.READY]: lang === 'hi' ? 'Aapka card taiyaar hai! Share karein.' : 'Your card is ready! Share it.',
      [STEPS.WORK]: lang === 'hi' ? 'Kaam ki photo ya video daalo.' : 'Add work photos or videos.',
    }
    speak(guides[step], lang)
  }, [step])

  function startRecording() {
    if (!speechSupported) {
      setManualMode(true)
      return
    }
    setTranscript('')
    setInterimText('')
    setRecording(true)
    stopSpeaking()

    const rec = createRecognizer(
      (text, isFinal) => {
        if (isFinal) {
          setTranscript(t => t + text)
          setInterimText('')
        } else {
          setInterimText(text)
        }
      },
      () => {
        setRecording(false)
        recognizerRef.current = null
      },
      (err) => {
        setRecording(false)
        recognizerRef.current = null
        if (err === 'not_supported') setSpeechSupported(false)
        else if (err === 'not-allowed') {
          showToast('Microphone access needed. Please allow mic permission.', 'error')
        }
        setManualMode(true)
      }
    )
    if (rec) {
      recognizerRef.current = rec
      try { rec.start() } catch { setRecording(false) }
    }
  }

  function stopRecording() {
    recognizerRef.current?.stop()
    setRecording(false)
  }

  function handleTranscriptReady(text) {
    const parsed = parseVoiceTranscript(text)
    if (!parsed.skill) {
      showToast(t('skillNotDetected'), 'error')
      return
    }
    setProfile(parsed)
    setEditingProfile({ ...parsed })

    // Read back confirmation
    const confirmText = getConfirmationText(parsed, lang)
    speak(confirmText, lang)
    setStep(STEPS.CONFIRM)
  }

  function handleVoiceSubmit() {
    const finalText = transcript || manualText
    if (!finalText.trim()) {
      showToast(lang === 'hi' ? 'Pehle kuch boliye ya type karein' : 'Please speak or type first', 'error')
      return
    }
    handleTranscriptReady(finalText)
  }

  function handleConfirm() {
    // Create worker with edited profile
    const id = generateWorkerId()
    setWorkerId(id)

    const meta = getSkillMeta(editingProfile.skill)
    const newWorker = {
      id,
      name: editingProfile.name || 'Worker',
      skill: editingProfile.skill || 'Plumber',
      skillKey: meta.key,
      experience: editingProfile.experience || 1,
      area: editingProfile.area || 'Delhi NCR',
      rate: `${editingProfile.rate || '₹300'} / ${editingProfile.rateType === 'day' ? 'day' : 'visit'}`,
      rateNum: parseInt((editingProfile.rate || '300').replace(/\D/g, '')) || 300,
      rateType: editingProfile.rateType || 'visit',
      phone: '',
      avatar: null,
      verificationCount: 0,
      verifiedPhones: [],
      status: 'pending',
      createdAt: Date.now(),
      workMedia: [],
      reviews: [],
      sponsoredBy: null,
      bookings: [],
    }
    saveWorker(newWorker)
    setStep(STEPS.PHOTO)
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarSrc(ev.target.result)
      // Update worker with avatar
      const workers = JSON.parse(localStorage.getItem('hc_workers') || '[]')
      const idx = workers.findIndex(w => w.id === workerId)
      if (idx >= 0) {
        workers[idx].avatar = ev.target.result
        localStorage.setItem('hc_workers', JSON.stringify(workers))
      }
    }
    reader.readAsDataURL(file)
  }

  function proceedToReady() {
    setStep(STEPS.READY)
    speak(t('cardReadyTitle') + '. ' + t('cardReadySub'), lang)
  }

  function handleWorkUpload(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const likely = isLikelyWorkPhoto(file)
      if (!likely) {
        setIrrelevantWarning(file)
        return
      }
      processWorkFile(file)
    })
  }

  function processWorkFile(file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const media = {
        id: `m${Date.now()}`,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: ev.target.result,
        verified: false,
        caption: '',
      }
      setUploadedMedia(prev => [...prev, media])
      if (workerId) addWorkMedia(workerId, media)
    }
    reader.readAsDataURL(file)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function getShareText() {
    const baseUrl = window.location.origin
    const url = `${baseUrl}/profile/${workerId}`
    const name = editingProfile?.name || profile?.name || 'Worker'
    const skill = editingProfile?.skill || profile?.skill || 'Karigar'
    if (lang === 'hi') {
      return `Namaste! Main ${name} hoon, ${skill} ka kaam karta hoon. Mera HunarCard dekhiye: ${url}`
    }
    return `Hello! I'm ${name}, a ${skill}. View my HunarCard: ${url}`
  }

  const profileUrl = workerId ? `${window.location.origin}/profile/${workerId}` : ''

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <LangToggle />

      {/* Top bar */}
      <div className="bg-hunar-blue px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-white/80 text-2xl active:scale-95">←</button>
        <div>
          <h1 className="text-white font-bold text-lg">HunarCard</h1>
          <p className="text-blue-200 text-xs">
            {step === STEPS.SPEAK && (lang === 'hi' ? 'Step 1: Boliye' : 'Step 1: Speak')}
            {step === STEPS.CONFIRM && (lang === 'hi' ? 'Step 2: Confirm Karein' : 'Step 2: Confirm')}
            {step === STEPS.PHOTO && (lang === 'hi' ? 'Step 3: Photo' : 'Step 3: Photo')}
            {step === STEPS.READY && (lang === 'hi' ? 'Card Taiyaar! 🎉' : 'Card Ready! 🎉')}
            {step === STEPS.WORK && (lang === 'hi' ? 'Kaam Ki Gallery' : 'Work Gallery')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-blue-100">
        <div
          className="h-full bg-hunar-teal transition-all duration-500"
          style={{ width: { speak: '20%', confirm: '45%', photo: '65%', ready: '85%', work: '100%' }[step] }}
        />
      </div>

      <div className="flex-1 px-5 py-6 overflow-y-auto">

        {/* ===== STEP: SPEAK ===== */}
        {step === STEPS.SPEAK && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-hunar-blue mb-2">{t('step1Title')}</h2>
              <p className="text-slate-500 text-sm">{t('step1Sub')}</p>
              <div className="mt-2"><AudioGuideBtn text={t('audioGuide')} /></div>
            </div>

            {/* Big Mic Button */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording() }}
              onTouchEnd={stopRecording}
              onClick={!recording ? undefined : undefined}
              className={`w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl mb-6 transition-all duration-200 select-none
                ${recording
                  ? 'bg-red-500 recording-pulse scale-110'
                  : 'bg-hunar-blue mic-pulse active:scale-95'}`}
            >
              <span className="text-5xl">{recording ? '🔴' : '🎤'}</span>
              <span className="text-white text-sm font-semibold mt-2">
                {recording ? t('listening') : t('tapToSpeak')}
              </span>
            </button>

            {/* Live transcript display */}
            {(transcript || interimText) && (
              <div className="w-full bg-white rounded-2xl p-4 shadow mb-4 text-slate-700 text-sm italic leading-relaxed">
                {transcript}
                {interimText && <span className="text-slate-400">{interimText}</span>}
              </div>
            )}

            {/* Example text */}
            <div className="w-full bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-hunar-blue font-semibold mb-1">
                {lang === 'hi' ? '📢 Aise boliye:' : '📢 For example:'}
              </p>
              <p className="text-sm text-slate-600 italic">"{t('exampleText')}"</p>
            </div>

            {/* Manual text fallback */}
            {(manualMode || !speechSupported) && (
              <div className="w-full mb-4">
                <p className="text-xs text-slate-500 mb-2">
                  {lang === 'hi' ? 'Ya yahan type karein:' : 'Or type here:'}
                </p>
                <textarea
                  className="w-full border-2 border-blue-200 rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:border-hunar-blue min-h-[80px]"
                  placeholder={t('exampleText')}
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
              </div>
            )}

            {!speechSupported && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl mb-4">
                ⚠️ Voice input not supported in this browser. Please type above.
              </p>
            )}

            {(transcript || manualText) && (
              <button onClick={handleVoiceSubmit} className="btn-primary">
                <span>➡️</span>
                {lang === 'hi' ? 'Aage Badho' : 'Continue'}
              </button>
            )}
          </div>
        )}

        {/* ===== STEP: CONFIRM ===== */}
        {step === STEPS.CONFIRM && editingProfile && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-hunar-blue mb-1">{t('confirmTitle')}</h2>
              <p className="text-slate-500 text-sm">
                {lang === 'hi' ? 'Edit kar sakte hain neeche' : 'You can edit below'}
              </p>
            </div>

            <div className="card mb-5 space-y-4">
              {/* Skill selector */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">{t('skillLabel')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => setEditingProfile(p => ({ ...p, skill }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${editingProfile.skill === skill ? 'border-hunar-blue bg-hunar-light' : 'border-slate-200 bg-white'}`}
                    >
                      <span className="text-2xl">{SKILL_ICONS[skill]}</span>
                      <span className="text-xs font-semibold text-slate-700">{skill}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('nameLabel')}</label>
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-hunar-blue"
                  value={editingProfile.name || ''}
                  onChange={e => setEditingProfile(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              {/* Experience */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('expLabel')} ({t('years')})</label>
                <input
                  type="number"
                  min="1" max="50"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-hunar-blue"
                  value={editingProfile.experience || ''}
                  onChange={e => setEditingProfile(p => ({ ...p, experience: parseInt(e.target.value) || 1 }))}
                />
              </div>

              {/* Area */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('areaLabel')}</label>
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-hunar-blue"
                  value={editingProfile.area || ''}
                  onChange={e => setEditingProfile(p => ({ ...p, area: e.target.value }))}
                />
              </div>

              {/* Rate */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('rateLabel')}</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-hunar-blue"
                    value={editingProfile.rate || ''}
                    placeholder="₹300"
                    onChange={e => setEditingProfile(p => ({ ...p, rate: e.target.value }))}
                  />
                  <select
                    className="border-2 border-slate-200 rounded-xl px-3 py-3 text-slate-800 font-semibold focus:outline-none focus:border-hunar-blue bg-white"
                    value={editingProfile.rateType || 'visit'}
                    onChange={e => setEditingProfile(p => ({ ...p, rateType: e.target.value }))}
                  >
                    <option value="visit">/ visit</option>
                    <option value="day">/ day</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audio readback */}
            <button
              onClick={() => speak(getConfirmationText(editingProfile, lang), lang)}
              className="w-full flex items-center justify-center gap-2 py-3 text-hunar-teal font-semibold text-sm mb-5"
            >
              🔊 {lang === 'hi' ? 'Dobara Sunein' : 'Play Again'}
            </button>

            <div className="space-y-3">
              <button onClick={handleConfirm} className="btn-green">
                ✅ {t('confirmBtn')}
              </button>
              <button onClick={() => setStep(STEPS.SPEAK)} className="btn-secondary">
                ❌ {t('retryBtn')}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP: PHOTO ===== */}
        {step === STEPS.PHOTO && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-hunar-blue mb-2">{t('photoTitle')}</h2>
              <p className="text-slate-500 text-sm">{t('photoSub')}</p>
            </div>

            {/* Avatar preview */}
            <div
              className="w-36 h-36 rounded-full border-4 border-dashed border-blue-300 flex items-center justify-center mb-6 overflow-hidden bg-blue-50 cursor-pointer active:scale-95 transition-transform"
              onClick={() => photoInputRef.current?.click()}
            >
              {avatarSrc
                ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                : <div className="text-center"><span className="text-4xl">📷</span><p className="text-xs text-hunar-blue font-semibold mt-1">Tap to add</p></div>
              }
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            <button onClick={() => photoInputRef.current?.click()} className="btn-primary mb-4 w-auto px-8">
              📷 {t('uploadPhoto')}
            </button>

            <button onClick={proceedToReady} className="text-hunar-blue font-semibold text-sm underline underline-offset-2 py-2">
              {lang === 'hi' ? 'Photo ke bina aage badho →' : 'Skip photo for now →'}
            </button>
          </div>
        )}

        {/* ===== STEP: READY ===== */}
        {step === STEPS.READY && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-hunar-blue mb-2">{t('cardReadyTitle')}</h2>
              <p className="text-slate-500 text-sm">{t('cardReadySub')}</p>
            </div>

            {/* Mini card preview */}
            <div className="w-full card mb-5 border-2 border-blue-100">
              <div className="flex items-center gap-4 mb-3">
                {avatarSrc
                  ? <img src={avatarSrc} className="w-16 h-16 rounded-full object-cover" alt="Avatar" />
                  : <div className="w-16 h-16 rounded-full bg-hunar-blue flex items-center justify-center text-2xl font-bold text-white">
                      {(editingProfile?.name || 'W')[0]}
                    </div>
                }
                <div>
                  <h3 className="font-black text-lg text-slate-800">{editingProfile?.name}</h3>
                  <p className="text-hunar-teal font-semibold text-sm">
                    {SKILL_ICONS[editingProfile?.skill]} {editingProfile?.skill}
                  </p>
                  <p className="text-slate-500 text-xs">{editingProfile?.experience} {t('years')} • {editingProfile?.area}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {editingProfile?.rate} / {editingProfile?.rateType}
                </span>
                <span className="pending-badge text-xs">⏳ Pending Verification</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
              >
                <span>💬</span> {t('shareWhatsApp')}
              </a>

              <button onClick={() => setStep(STEPS.WORK)} className="btn-secondary">
                <span>📸</span> {t('addWorkBtn')}
                <span className="text-xs bg-blue-100 text-hunar-blue px-2 py-0.5 rounded-full ml-auto">Optional</span>
              </button>

              <button onClick={() => navigate(`/dashboard/${workerId}`)} className="btn-primary">
                <span>🏠</span> {t('viewDashboard')}
              </button>

              <button
                onClick={() => navigate(`/profile/${workerId}`)}
                className="text-center w-full text-hunar-teal font-semibold text-sm py-2 underline underline-offset-2"
              >
                {lang === 'hi' ? 'Public Profile Dekho →' : 'View Public Profile →'}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP: WORK ===== */}
        {step === STEPS.WORK && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-hunar-blue mb-2">{t('addWorkTitle')}</h2>
              <p className="text-slate-500 text-sm">{t('addWorkSub')}</p>
            </div>

            {/* Work media grid */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {uploadedMedia.map((m) => (
                <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                  {m.type === 'image'
                    ? <img src={m.url} alt="" className="w-full h-full object-cover" />
                    : <video src={m.url} className="w-full h-full object-cover" muted />
                  }
                  <span className="absolute bottom-1 left-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Pending</span>
                </div>
              ))}

              {/* Upload button tile */}
              <button
                onClick={() => workInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center gap-1 bg-blue-50 active:scale-95 transition-transform"
              >
                <span className="text-2xl">+</span>
                <span className="text-xs text-hunar-blue font-semibold">Add</span>
              </button>
            </div>

            <input
              ref={workInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleWorkUpload}
            />

            {/* Irrelevant photo warning modal */}
            {irrelevantWarning && (
              <div className="fixed inset-0 bg-black/50 flex items-end z-40">
                <div className="bg-white w-full rounded-t-3xl p-6">
                  <p className="text-slate-700 font-semibold text-center mb-4">⚠️ {t('irrelevantPhoto')}</p>
                  <div className="space-y-3">
                    <button onClick={() => { processWorkFile(irrelevantWarning); setIrrelevantWarning(null) }} className="btn-primary">
                      {t('addAnyway')}
                    </button>
                    <button onClick={() => setIrrelevantWarning(null)} className="btn-secondary">
                      {t('skipPhoto')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mt-4">
              <button onClick={() => navigate(`/dashboard/${workerId}`)} className="btn-primary">
                🏠 {t('viewDashboard')}
              </button>
              <button onClick={() => navigate(`/profile/${workerId}`)} className="btn-secondary">
                👁️ {lang === 'hi' ? 'Public Profile Dekho' : 'View Public Profile'}
              </button>
            </div>
          </div>
        )}

      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
