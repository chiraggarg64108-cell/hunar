import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import AadhaarSkillCard from '../components/AadhaarSkillCard'
import { getWorker, getWorkers, addVerification, addWorkMedia } from '../data/seedData'
import { isWorkProofImage } from '../utils/voiceParser'
import {
  Mic, Share2, PlusCircle, CheckCircle, Calendar, Star,
  Lock, AlertTriangle, ArrowRight, ShieldCheck, Sparkles
} from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { t, lang } = useLanguage()

  const [worker, setWorker] = useState(null)
  const [showSimulateModal, setShowSimulateModal] = useState(false)
  const [simPhone, setSimPhone] = useState('')
  const [simRating, setSimRating] = useState(5)
  const [simReview, setSimReview] = useState('')
  const [simError, setSimError] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [softWarningFile, setSoftWarningFile] = useState(null)

  const mediaInputRef = useRef(null)

  useEffect(() => {
    // If not logged in, redirect to login
    if (!currentUser) {
      navigate('/login')
      return
    }

    // Try finding worker by workerId, phone, or name
    if (currentUser.workerId) {
      const found = getWorker(currentUser.workerId)
      if (found) {
        setWorker(found)
        return
      }
    }

    const all = getWorkers()
    const match = all.find(w => w.phone === currentUser.phone || w.name.toLowerCase() === currentUser.name.toLowerCase())
    if (match) {
      setWorker(match)
    } else {
      setWorker(null)
    }
  }, [currentUser, navigate])

  const refreshWorker = () => {
    if (worker) {
      setWorker(getWorker(worker.id))
    }
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  // Handle Simulation of Customer Verification (anti-fraud: 1 phone per worker)
  const handleSimulateVerification = (e) => {
    e.preventDefault()
    setSimError('')
    const cleanPhone = simPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setSimError(lang === 'hi' ? '10-digit phone number zaroori hai' : 'Please enter a 10-digit phone number')
      return
    }

    const res = addVerification(worker.id, cleanPhone, simRating, simReview)
    if (!res.success) {
      if (res.reason === 'duplicate') {
        setSimError(t('alreadyVerifiedAlert'))
      } else {
        setSimError('Verification failed. Worker not found.')
      }
      return
    }

    setShowSimulateModal(false)
    setSimPhone('')
    setSimReview('')
    refreshWorker()
    showToast(t('verificationSuccessAlert'))
  }

  // Handle Media File Upload
  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Soft check
    if (!isWorkProofImage(file)) {
      setSoftWarningFile(file)
      return
    }

    saveMediaFile(file)
  }

  const saveMediaFile = (file) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const isVideo = file.type.startsWith('video/')
      const newMedia = {
        id: `wm-${Date.now()}`,
        type: isVideo ? 'video' : 'image',
        url: ev.target?.result,
        verified: false,
        caption: isVideo ? 'Kaam ki video clip' : 'Naye kaam ka photo'
      }
      addWorkMedia(worker.id, newMedia)
      refreshWorker()
      showToast(lang === 'hi' ? 'Media add ho gaya!' : 'Work media uploaded!')
      setSoftWarningFile(null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 transition-colors">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Welcome Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {t('greeting')}, {currentUser?.name || 'Worker'}! 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {worker ? `${worker.skill} • ${worker.area}` : 'Aapka Digital Skill Hub'}
            </p>
          </div>
          {worker && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate('/builder?mode=edit')}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl hover:scale-102 active:scale-95 transition-all flex items-center gap-1"
                title="Edit Card using Voice"
              >
                <span>✏️ Edit</span>
              </button>
              <button
                onClick={() => navigate(`/profile/${worker.id}`)}
                className="text-xs font-bold text-hunar-teal bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 px-2.5 py-1.5 rounded-xl hover:scale-102 active:scale-95 transition-all"
              >
                Public 👁️
              </button>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-green-600 text-white text-xs font-bold p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-bounce">
            <span>✅ {toastMsg}</span>
            <button onClick={() => setToastMsg('')}>✕</button>
          </div>
        )}

        {/* 1-1-1 Promise Strip (Persistent Hook) */}
        <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-base">⏱️</span>
            <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight mt-0.5">
              {t('promise1Title')}
            </p>
            <p className="text-[9px] text-slate-400 leading-tight truncate">
              {t('promise1Desc')}
            </p>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-base">📱</span>
            <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight mt-0.5">
              {t('promise2Title')}
            </p>
            <p className="text-[9px] text-slate-400 leading-tight truncate">
              {t('promise2Desc')}
            </p>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-base">👆</span>
            <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight mt-0.5">
              {t('promise3Title')}
            </p>
            <p className="text-[9px] text-slate-400 leading-tight truncate">
              {t('promise3Desc')}
            </p>
          </div>
        </div>

        {/* CASE A: NO PROFILE YET -> PROMINENT CALL TO ACTION CARD */}
        {!worker ? (
          <div className="bg-gradient-to-br from-hunar-blue via-teal-800 to-hunar-navy text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-3xl shadow-inner">
              🎤
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">
                {t('ctaNoCardTitle')}
              </h2>
              <p className="text-xs text-teal-100 mt-1 max-w-xs mx-auto leading-relaxed">
                {t('ctaNoCardSub')}
              </p>
            </div>
            <button
              onClick={() => navigate('/builder')}
              className="btn-primary bg-white text-hunar-blue hover:bg-slate-100 shadow-xl text-base py-4 font-black"
            >
              <Mic size={20} className="text-teal-600 animate-pulse" />
              <span>{t('startVoiceBtn')}</span>
            </button>
          </div>
        ) : (
          /* CASE B: PROFILE EXISTS -> SHOW AADHAAR CARD + DASHBOARD TOOLS */
          <div className="space-y-4">
            {/* The Aadhaar-inspired ID Card */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal-600" />
                  <span>{t('mySkillCardHeading')}</span>
                </span>
                <span className="text-xs font-mono font-bold text-hunar-blue dark:text-teal-400">
                  {worker.skillId}
                </span>
              </div>
              <AadhaarSkillCard worker={worker} showActions={true} />
            </div>

            {/* Cold-Start Nudge if 0 verifications */}
            {worker.verificationCount === 0 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-200">
                    Get Verified
                  </p>
                  <p className="text-xs font-bold mt-0.5 leading-snug">
                    {t('nudgeOldCustomer')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = `Namaste! Maine apna naya HunarCard banaya hai. Kripya is link par jaakar mera kaam verify kar dein: ${window.location.origin}/profile/${worker.id}`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className="bg-white text-amber-900 px-3.5 py-2 rounded-xl text-xs font-black shadow-md flex-shrink-0 active:scale-95 transition-all"
                >
                  Share QR 💬
                </button>
              </div>
            )}

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-2 gap-3">
              {/* Simulate Customer Verification (Demo Helper) */}
              <button
                onClick={() => setShowSimulateModal(true)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-left shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all group active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                  ⭐
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  Customer Scan (Demo)
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Simulate live 1-phone review
                </p>
              </button>

              {/* Add Work Media */}
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-left shadow-sm hover:border-teal-400 dark:hover:border-teal-600 transition-all group active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                  📸
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {t('actionAddMedia')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Photos or 15s work clip
                </p>
              </button>
            </div>

            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaUpload}
            />

            {/* Incoming Bookings Section */}
            <div className="app-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar size={16} className="text-hunar-teal" />
                  <span>{t('actionViewBookings')}</span>
                </h3>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full">
                  {worker.bookings?.length || 0} New
                </span>
              </div>

              {worker.bookings && worker.bookings.length > 0 ? (
                <div className="space-y-2">
                  {worker.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            b.type === 'contract' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {b.type === 'contract' ? 'Multi-day Theka' : '1 Day Visit'}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            📅 {b.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                          📍 {b.address || b.area}
                        </p>
                        {b.notes && (
                          <p className="text-xs text-slate-400 italic mt-0.5">
                            "{b.notes}"
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  Abhi koi nayi booking nahi aayi hai.
                </div>
              )}
            </div>

            {/* Freemium Trust Ladder UI Hint (Revenue Model Layer 2) */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl text-amber-400">
                    {worker.verificationCount >= 5 ? '🏅' : <Lock size={20} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                      {t('proBadgeTitle')}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {t('proBadgeDesc')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Current Verifications: {worker.verificationCount} / 5</span>
                <span className={worker.verificationCount >= 5 ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>
                  {worker.verificationCount >= 5 ? 'Unlocked! ✅' : 'Locked 🔒'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Soft Warning Modal for Non-Work Photo */}
        {softWarningFile && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center text-2xl mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-black text-center text-slate-800 dark:text-slate-100">
                {lang === 'hi' ? 'Kaam ki photo nahi lag rahi?' : 'Not a work photo?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                {lang === 'hi'
                  ? 'Ye photo kisi selfie ya screenshot jaisi lag rahi hai. Kya aap isko portfolio mein add karna chahte hain?'
                  : 'This file appears to be a selfie or personal image rather than work proof. Add it anyway?'}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveMediaFile(softWarningFile)}
                  className="btn-primary text-xs py-2.5 flex-1"
                >
                  Haan, Add Karein
                </button>
                <button
                  onClick={() => setSoftWarningFile(null)}
                  className="btn-secondary text-xs py-2.5 flex-1"
                >
                  Ruk Jayein
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATE CUSTOMER VERIFICATION MODAL (Hackathon Judgement Feature) */}
        {showSimulateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('verifyModalTitle')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSimulateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('verifyModalSub')}
              </p>

              <form onSubmit={handleSimulateVerification} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {t('customerPhoneLabel')}
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    className="input-field text-sm py-2.5"
                    placeholder="e.g. 9811223344"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Anti-fraud: Ek number se ek hi baar verification allowed hai.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {t('customerRatingLabel')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setSimRating(num)}
                        className={`text-2xl transition-transform active:scale-125 ${
                          num <= simRating ? 'star-filled' : 'star-empty'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
                      {simRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Review / Voice Feedback
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm py-2.5"
                    placeholder="e.g. Ramesh ji ne badiya pipe fitting kari"
                    value={simReview}
                    onChange={(e) => setSimReview(e.target.value)}
                  />
                </div>

                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="confirmCheck"
                    defaultChecked
                    required
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="confirmCheck" className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                    {t('customerConfirmCheck')}
                  </label>
                </div>

                {simError && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/60 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                    ⚠️ {simError}
                  </p>
                )}

                <button type="submit" className="btn-green text-sm py-3 mt-2">
                  <span>{t('submitVerification')}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
