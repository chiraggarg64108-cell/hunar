// Public Profile Page — the page customers see after scanning QR or clicking shared link
// Shows full worker card, work gallery, reviews, booking, and verification simulation

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useLanguage } from '../context/LanguageContext'
import { LangToggle, StarRating, StarPicker, VerificationBadge, SkillPill, Toast, ProBadgeLocked } from '../components/SharedComponents'
import { getWorker, addVerification, addBooking, getSkillMeta } from '../data/seedData'
import { speak } from '../utils/voiceParser'

const SKILL_ICONS = { Plumber: '🪠', Electrician: '💡', Mason: '🧱', Carpenter: '🔨' }

export default function PublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [worker, setWorker] = useState(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [toast, setToast] = useState(null)
  const profileUrl = `${window.location.origin}/profile/${id}`

  // Verification form state
  const [verifyPhone, setVerifyPhone] = useState('')
  const [verifyRating, setVerifyRating] = useState(5)
  const [verifyText, setVerifyText] = useState('')
  const [verifyRecording, setVerifyRecording] = useState(false)
  const verifyRecRef = useRef(null)

  // Booking form state
  const [bookingType, setBookingType] = useState('small')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingArea, setBookingArea] = useState('')
  const [bookingNote, setBookingNote] = useState('')
  const [bookingSent, setBookingSent] = useState(false)

  useEffect(() => {
    const w = getWorker(id)
    if (!w) navigate('/directory')
    else setWorker(w)
  }, [id])

  function refreshWorker() {
    setWorker(getWorker(id))
  }

  function handleVerify() {
    if (!verifyPhone || verifyPhone.length < 10) {
      showToast(lang === 'hi' ? 'Valid phone number daliye' : 'Enter a valid phone number', 'error')
      return
    }
    const result = addVerification(id, verifyPhone, verifyRating, verifyText)
    if (result.reason === 'duplicate') {
      showToast(t('alreadyVerified'), 'error')
      return
    }
    setShowVerifyModal(false)
    refreshWorker()
    showToast(t('verifiedSuccess'))
    speak(t('verifiedSuccess'), lang)
  }

  function handleBooking() {
    if (!bookingDate || !bookingArea) {
      showToast(lang === 'hi' ? 'Date aur area zaroori hai' : 'Date and area are required', 'error')
      return
    }
    addBooking(id, {
      type: bookingType,
      date: bookingDate,
      area: bookingArea,
      note: bookingNote,
    })
    setBookingSent(true)
    showToast(t('bookingSent'))
  }

  function handleVerifyVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (verifyRecording) {
      verifyRecRef.current?.stop()
      setVerifyRecording(false)
      return
    }
    const rec = new SR()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.onresult = e => {
      setVerifyText(Array.from(e.results).map(r => r[0].transcript).join(''))
    }
    rec.onend = () => setVerifyRecording(false)
    verifyRecRef.current = rec
    rec.start()
    setVerifyRecording(true)
  }

  function playReview(review) {
    speak(review.audioText || review.text, lang)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-500">{lang === 'hi' ? 'Load ho raha hai...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  const isVerified = worker.verificationCount > 0
  const isPro = worker.verificationCount >= 5
  const whatsappMsg = encodeURIComponent(
    lang === 'hi'
      ? `Namaste ${worker.name} ji, maine aapka HunarCard dekha, mujhe ${worker.skill} ke kaam ke liye baat karni hai`
      : `Hello ${worker.name} ji, I saw your HunarCard, I need your ${worker.skill} services`
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <LangToggle />

      {/* Header banner */}
      <div className="bg-gradient-to-b from-hunar-blue to-teal-600 px-5 py-8 pb-14">
        <button onClick={() => navigate(-1)} className="text-white/70 text-sm mb-4 flex items-center gap-1">
          ← {lang === 'hi' ? 'Wapas' : 'Back'}
        </button>

        {/* Worker info */}
        <div className="flex items-center gap-4">
          {worker.avatar
            ? <img src={worker.avatar} alt={worker.name} className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg" />
            : <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/60 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                {worker.name[0]}
              </div>
          }
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white font-black text-2xl">{worker.name}</h1>
              {isPro && <span className="text-yellow-300 text-sm font-bold">🏅 Pro</span>}
            </div>
            <p className="text-blue-200 font-semibold text-sm">
              {SKILL_ICONS[worker.skill]} {worker.skill} • {worker.experience} {t('years')}
            </p>
            <p className="text-blue-100 text-sm">📍 {worker.area}</p>
            <div className="mt-2">
              <VerificationBadge count={worker.verificationCount} />
            </div>
          </div>
        </div>
      </div>

      {/* White card floating over the banner */}
      <div className="px-4 -mt-6">

        {/* Main card */}
        <div className="card shadow-xl border border-slate-100 mb-4">
          {/* Rate */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t('fairWage')}</p>
              <p className="text-2xl font-black text-hunar-green">{worker.rate}</p>
            </div>
            {isPro
              ? <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">🏅 Verified Pro</span>
              : <ProBadgeLocked label={t('proLocked')} />
            }
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-4 border-t border-b border-slate-100 mb-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">
              {lang === 'hi' ? 'Scan karke portfolio dekhein' : 'Scan to view portfolio'}
            </p>
            <QRCodeSVG
              value={profileUrl}
              size={160}
              bgColor="#ffffff"
              fgColor="#0F4C81"
              level="M"
              includeMargin={true}
            />
            <p className="text-xs text-slate-400 mt-2 font-mono">{profileUrl.replace('https://', '')}</p>
          </div>

          {/* Sponsored by */}
          {worker.sponsoredBy && (
            <p className="text-center text-xs text-slate-400 mb-4">
              🏪 {t('sponsored')} <span className="font-semibold text-slate-600">{worker.sponsoredBy}</span>
            </p>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <a href={`tel:${worker.phone}`} className="flex flex-col items-center gap-1.5 bg-hunar-blue text-white py-3 rounded-2xl active:scale-95 transition-transform">
              <span className="text-2xl">📞</span>
              <span className="text-xs font-semibold">{t('callBtn')}</span>
            </a>
            <a href={`https://wa.me/${worker.phone}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-1.5 bg-green-500 text-white py-3 rounded-2xl active:scale-95 transition-transform">
              <span className="text-2xl">💬</span>
              <span className="text-xs font-semibold">{t('whatsappBtn')}</span>
            </a>
            <button onClick={() => setShowBookingModal(true)}
              className="flex flex-col items-center gap-1.5 bg-hunar-teal text-white py-3 rounded-2xl active:scale-95 transition-transform">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-semibold">{t('bookBtn')}</span>
            </button>
          </div>
        </div>

        {/* Simulate Verify Button (for demo/judges) */}
        <button
          onClick={() => setShowVerifyModal(true)}
          className="w-full bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold py-4 rounded-2xl text-sm active:scale-95 transition-transform mb-4 flex items-center justify-center gap-2"
        >
          {t('simulateVerify')}
        </button>

        {/* Reviews */}
        {worker.reviews && worker.reviews.length > 0 && (
          <div className="card mb-4">
            <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              ⭐ {t('reviewsTitle')}
            </h2>
            <div className="space-y-4">
              {worker.reviews.map(review => (
                <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-hunar-blue flex items-center justify-center text-white text-sm font-bold">
                        {(review.name || 'C')[0]}
                      </div>
                      <span className="font-semibold text-sm text-slate-700">{review.name}</span>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-slate-600 text-sm mb-2">{review.text}</p>
                  <button
                    onClick={() => playReview(review)}
                    className="inline-flex items-center gap-1.5 text-hunar-teal text-xs font-semibold bg-teal-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    🔊 {lang === 'hi' ? 'Voice Review Sunein' : 'Play Voice Review'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Grid */}
        {worker.workMedia && worker.workMedia.length > 0 && (
          <div className="card mb-4">
            <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              📸 {t('workGrid')}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {worker.workMedia.map(media => (
                <div key={media.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                  {media.type === 'image'
                    ? <img
                        src={media.url}
                        alt={media.caption}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'https://via.placeholder.com/200x200/e2e8f0/94a3b8?text=Photo' }}
                      />
                    : <video src={media.url} className="w-full h-full object-cover" muted playsInline />
                  }
                  {/* Verification tick or pending badge */}
                  <div className="absolute top-1 right-1">
                    {media.verified
                      ? <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✓</span>
                      : <span className="bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">⏳</span>
                    }
                  </div>
                  {media.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] p-1 leading-tight">
                      {media.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share again */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            lang === 'hi'
              ? `Dekho ye HunarCard: ${profileUrl}`
              : `Check out this HunarCard: ${profileUrl}`
          )}`}
          target="_blank" rel="noreferrer"
          className="btn-whatsapp"
        >
          💬 {lang === 'hi' ? 'Share karein' : 'Share this card'}
        </a>

      </div>

      {/* ===== VERIFY MODAL ===== */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowVerifyModal(false)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-black text-slate-800 mb-1">{t('verifyTitle')}</h2>
            <p className="text-slate-500 text-sm mb-5">
              {lang === 'hi'
                ? `Kya ${worker.name} ne aapka kaam kiya hai? Confirm karein.`
                : `Did ${worker.name} do work for you? Confirm below.`}
            </p>

            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('verifyPhone')}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-hunar-blue text-slate-800"
                  placeholder="10-digit mobile number"
                  value={verifyPhone}
                  onChange={e => setVerifyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">{t('verifyRating')}</label>
                <StarPicker value={verifyRating} onChange={setVerifyRating} />
              </div>

              {/* Voice review */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">
                  {t('verifyReview')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleVerifyVoice}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${
                      verifyRecording ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-hunar-blue'
                    }`}
                  >
                    {verifyRecording ? '⏹ Stop' : '🎤 Record'}
                  </button>
                </div>
                {verifyText && (
                  <p className="text-sm text-slate-600 italic mt-2 bg-slate-50 p-3 rounded-xl">{verifyText}</p>
                )}
              </div>

              <button onClick={handleVerify} className="btn-green">
                ✅ {t('verifyConfirm')}
              </button>
              <button onClick={() => setShowVerifyModal(false)} className="w-full text-center text-slate-400 py-2 font-medium text-sm">
                {lang === 'hi' ? 'Cancel' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOOKING MODAL ===== */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-black text-slate-800 mb-1">{t('bookingTitle')}</h2>
            <p className="text-slate-500 text-sm mb-5">{worker.name} ji ke liye request bhejo</p>

            {bookingSent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-hunar-green font-bold text-lg">{t('bookingSent')}</p>
                <button onClick={() => setShowBookingModal(false)} className="mt-4 text-slate-500 underline text-sm">
                  {lang === 'hi' ? 'Band karein' : 'Close'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">{t('bookingType')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'small', label: t('smallJob'), icon: '🔧' },
                      { value: 'multi', label: t('multiDay'), icon: '🏗️' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setBookingType(opt.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm ${bookingType === opt.value ? 'border-hunar-blue bg-hunar-light text-hunar-blue' : 'border-slate-200 text-slate-700'}`}
                      >
                        <span>{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('bookingDate')}</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-hunar-blue font-semibold"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('bookingArea')}</label>
                  <input
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-hunar-blue font-semibold"
                    placeholder={lang === 'hi' ? 'Apna area daliye' : 'Enter your area'}
                    value={bookingArea}
                    onChange={e => setBookingArea(e.target.value)}
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('bookingNote')}</label>
                  <textarea
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-hunar-blue text-sm"
                    rows={2}
                    placeholder={lang === 'hi' ? 'Kuch baat add karein...' : 'Add a note...'}
                    value={bookingNote}
                    onChange={e => setBookingNote(e.target.value)}
                  />
                </div>

                {/* Platform fee note */}
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">ℹ️ {t('bookingFee')}</p>

                <button onClick={handleBooking} className="btn-primary">
                  📅 {t('bookingSubmit')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
