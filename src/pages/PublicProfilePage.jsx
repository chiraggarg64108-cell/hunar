import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import TopBar from '../components/TopBar'
import AadhaarSkillCard from '../components/AadhaarSkillCard'
import { getWorker, addVerification, addBooking, SKILL_METAS } from '../data/seedData'
import { speakText, stopSpeaking } from '../utils/voiceParser'
import {
  Phone, MessageSquare, Calendar, Star, Volume2, ShieldCheck,
  CheckCircle2, AlertCircle, Share2, ArrowLeft, Play, Square,
  Clock, MapPin, Sparkles, AlertTriangle
} from 'lucide-react'

export default function PublicProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  const [worker, setWorker] = useState(null)
  const [playingAudioId, setPlayingAudioId] = useState(null)

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookJobType, setBookJobType] = useState('small')
  const [bookDate, setBookDate] = useState('')
  const [bookAddress, setBookAddress] = useState('')
  const [bookNotes, setBookNotes] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Verification Modal State (Customer Scan & Verify)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyPhone, setVerifyPhone] = useState('')
  const [verifyRating, setVerifyRating] = useState(5)
  const [verifyReview, setVerifyReview] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const found = getWorker(id)
    if (found) {
      setWorker(found)
    } else {
      setWorker(null)
    }
  }, [id])

  const refreshWorker = () => {
    if (worker) {
      setWorker(getWorker(worker.id))
    }
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  // Handle Voice Review Audio Playback
  const handlePlayVoiceReview = (review) => {
    if (playingAudioId === review.id) {
      stopSpeaking()
      setPlayingAudioId(null)
      return
    }

    setPlayingAudioId(review.id)
    speakText(review.audioText || review.text, lang, () => {
      setPlayingAudioId(null)
    })
  }

  // Handle Quick Booking Request Submit
  const handleBookingSubmit = (e) => {
    e.preventDefault()
    if (!bookDate || !bookAddress.trim()) {
      alert(lang === 'hi' ? 'Tarikh aur address zaroori hai' : 'Date and address are required')
      return
    }

    addBooking(worker.id, {
      type: bookJobType,
      date: bookDate,
      address: bookAddress.trim(),
      notes: bookNotes.trim()
    })

    setBookingSuccess(true)
    setTimeout(() => {
      setBookingSuccess(false)
      setShowBookingModal(false)
      setBookDate('')
      setBookAddress('')
      setBookNotes('')
      showToast(t('bookingSuccessAlert'))
    }, 1800)
  }

  // Handle Customer Scan & Verify (Live Demo)
  const handleVerificationSubmit = (e) => {
    e.preventDefault()
    setVerifyError('')
    const cleanPhone = verifyPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setVerifyError(lang === 'hi' ? '10-digit mobile number zaroori hai' : 'Valid 10-digit phone required')
      return
    }

    const res = addVerification(worker.id, cleanPhone, verifyRating, verifyReview)
    if (!res.success) {
      if (res.reason === 'duplicate') {
        setVerifyError(t('alreadyVerifiedAlert'))
      } else {
        setVerifyError('Verification failed.')
      }
      return
    }

    setShowVerifyModal(false)
    setVerifyPhone('')
    setVerifyReview('')
    refreshWorker()
    showToast(t('verificationSuccessAlert'))
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="app-card text-center max-w-sm w-full space-y-3">
          <span className="text-4xl">🔍</span>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
            Karigar Not Found
          </h2>
          <p className="text-xs text-slate-500">
            Ye HunarCard profile abhi available nahi hai.
          </p>
          <button onClick={() => navigate('/directory')} className="btn-primary text-sm py-2.5">
            Directory Dekhein →
          </button>
        </div>
      </div>
    )
  }

  const meta = SKILL_METAS[worker.skill] || { icon: '🛠️' }
  const whatsappMsg = `Namaste ${worker.name} ji, maine aapka HunarCard dekha, mujhe ${worker.skill} ke kaam ke liye baat karni hai.`

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-16 transition-colors">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* Back / Breadcrumb Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-hunar-teal active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
            <span>{lang === 'hi' ? 'Wapas' : 'Back'}</span>
          </button>

          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
            Public Skill Profile
          </span>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="bg-green-600 text-white text-xs font-bold p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-bounce">
            <span>✅ {toastMsg}</span>
            <button onClick={() => setToastMsg('')}>✕</button>
          </div>
        )}

        {/* The Official Aadhaar-Style Skill ID Card */}
        <AadhaarSkillCard worker={worker} showActions={false} />

        {/* THREE LARGE THUMB-FRIENDLY ACTION BUTTONS */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Call */}
          <a
            href={`tel:${worker.phone}`}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-hunar-blue text-white shadow-md hover:bg-hunar-navy active:scale-95 transition-all text-center"
          >
            <Phone size={22} className="mb-1" />
            <span className="text-xs font-black">{t('callNow')}</span>
          </a>

          {/* 2. WhatsApp */}
          <a
            href={`https://wa.me/${worker.phone}?text=${encodeURIComponent(whatsappMsg)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#25D366] text-white shadow-md hover:bg-[#1fb857] active:scale-95 transition-all text-center"
          >
            <MessageSquare size={22} className="mb-1" />
            <span className="text-xs font-black">{t('chatWhatsapp')}</span>
          </a>

          {/* 3. Quick Booking */}
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-hunar-teal text-white shadow-md hover:bg-teal-800 active:scale-95 transition-all text-center"
          >
            <Calendar size={22} className="mb-1" />
            <span className="text-xs font-black">{t('bookService')}</span>
          </button>
        </div>

        {/* SIMULATE CUSTOMER SCAN & VERIFY (DEMO PURPOSES PROMINENT BUTTON) */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/40 p-4 rounded-3xl border-2 border-amber-300 dark:border-amber-700/70 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>⭐</span>
              <span>{t('verifyModalTitle')}</span>
            </span>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold px-2 py-0.5 rounded-full">
              JUDGES DEMO
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            {lang === 'hi'
              ? 'Aap is karigar ke kaam ko confirm karke inka status live upgrade kar sakte hain (Anti-fraud: 1 phone per worker).'
              : 'Simulate a real customer scan & verify flow. Increments count and flips status to Verified live.'}
          </p>
          <button
            onClick={() => setShowVerifyModal(true)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black py-3 px-4 rounded-2xl text-xs active:scale-95 transition-all shadow flex items-center justify-center gap-2"
          >
            <span>📱 Simulate Customer Scan & Verify</span>
          </button>
        </div>

        {/* CUSTOMER VOICE REVIEWS (Playable 10-second audio clips via SpeechSynthesis) */}
        <div className="app-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span>{t('voiceReviewsHeading')}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {worker.reviews?.length || 0} Reviews
            </span>
          </div>

          {worker.reviews && worker.reviews.length > 0 ? (
            <div className="space-y-3">
              {worker.reviews.map((rev) => {
                const isPlaying = playingAudioId === rev.id
                return (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center justify-center">
                          {rev.name[0] || 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {rev.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rev.date || 'Verified Customer'}
                          </p>
                        </div>
                      </div>

                      <div className="flex text-amber-500 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rev.rating ? 'star-filled' : 'star-empty'}>★</span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{rev.text}"
                    </p>

                    {/* Playable 10-second voice note simulation button */}
                    <button
                      onClick={() => handlePlayVoiceReview(rev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isPlaying
                          ? 'bg-red-500 text-white'
                          : 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      {isPlaying ? <Square size={13} /> : <Play size={13} />}
                      <span>{isPlaying ? t('stopAudio') : t('listenVoiceReview')}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-400">
              {t('noReviewsYet')}
            </div>
          )}
        </div>

        {/* INSTAGRAM-STYLE 3-COLUMN WORK PORTFOLIO GRID */}
        <div className="app-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>📸</span>
              <span>{t('workGallery')}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {worker.workMedia?.length || 0} Posts
            </span>
          </div>

          {worker.workMedia && worker.workMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {worker.workMedia.map((m) => (
                <div
                  key={m.id}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group"
                >
                  {m.type === 'video' ? (
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt={m.caption || 'Work'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Verification Badge on Photo */}
                  <div className="absolute top-1.5 right-1.5">
                    {m.verified ? (
                      <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] shadow border border-white font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow border border-white font-bold">
                        ⏳
                      </span>
                    )}
                  </div>

                  {m.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5">
                      <p className="text-[9px] text-white font-semibold truncate leading-none">
                        {m.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              {t('noWorkMedia')}
            </div>
          )}
        </div>
      </main>

      {/* QUICK BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('bookingModalTitle')}
                </h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 text-sm font-bold">
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 size={40} className="text-green-600 mx-auto" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'Booking Bhej Di Gayi!' : 'Booking Request Sent!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {worker.name} ji ke dashboard par request add ho gayi hai.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {t('bookingJobType')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookJobType('small')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        bookJobType === 'small'
                          ? 'bg-hunar-blue text-white border-hunar-blue'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t('jobSmall')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookJobType('contract')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        bookJobType === 'contract'
                          ? 'bg-hunar-blue text-white border-hunar-blue'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t('jobContract')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {t('bookingDateLabel')}
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field text-sm py-2"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {t('bookingAddressLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House No. 24, Sector 14, Sonipat"
                    className="input-field text-sm py-2"
                    value={bookAddress}
                    onChange={(e) => setBookAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {t('bookingNotesLabel')}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Tap leak ho raha hai"
                    className="input-field text-sm py-2"
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                  />
                </div>

                {/* Revenue Model Layer 3 Hint */}
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-800 dark:text-teal-300 font-medium leading-tight">
                  ℹ️ {t('bookingPlatformFeeNote')}
                </div>

                <button type="submit" className="btn-primary text-sm py-3 mt-1">
                  <span>{t('submitBooking')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SIMULATE VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('verifyModalTitle')}
                </h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  {t('customerPhoneLabel')}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  className="input-field text-sm py-2.5"
                  placeholder="e.g. 9811223344"
                  value={verifyPhone}
                  onChange={(e) => setVerifyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoFocus
                />
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
                      onClick={() => setVerifyRating(num)}
                      className={`text-2xl transition-transform active:scale-125 ${
                        num <= verifyRating ? 'star-filled' : 'star-empty'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
                    {verifyRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Customer Voice Review Note
                </label>
                <input
                  type="text"
                  className="input-field text-sm py-2.5"
                  placeholder="e.g. Kaam time pe kiya, bahut badhiya"
                  value={verifyReview}
                  onChange={(e) => setVerifyReview(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="pubConfirmCheck"
                  defaultChecked
                  required
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="pubConfirmCheck" className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                  {t('customerConfirmCheck')}
                </label>
              </div>

              {verifyError && (
                <p className="text-xs text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/60 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                  ⚠️ {verifyError}
                </p>
              )}

              <button type="submit" className="btn-green text-sm py-3 mt-2">
                <span>{t('submitVerification')}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
