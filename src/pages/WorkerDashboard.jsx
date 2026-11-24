// Worker Dashboard — the worker's own management screen
// Shows: their card, QR, work gallery, incoming bookings, nudge to share

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useLanguage } from '../context/LanguageContext'
import { LangToggle, VerificationBadge, StarRating, ProBadgeLocked, Toast, SectionHeader } from '../components/SharedComponents'
import { getWorker, addWorkMedia, saveWorker, getSkillMeta } from '../data/seedData'
import { isLikelyWorkPhoto, speak } from '../utils/voiceParser'

const SKILL_ICONS = { Plumber: '🪠', Electrician: '💡', Mason: '🧱', Carpenter: '🔨' }

export default function WorkerDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [worker, setWorker] = useState(null)
  const [activeTab, setActiveTab] = useState('card')
  const [toast, setToast] = useState(null)
  const [irrelevantWarning, setIrrelevantWarning] = useState(null)
  const workInputRef = useRef(null)

  const profileUrl = `${window.location.origin}/profile/${id}`

  useEffect(() => {
    const w = getWorker(id)
    if (!w) {
      navigate('/')
    } else {
      setWorker(w)
    }
  }, [id])

  function refresh() {
    setWorker(getWorker(id))
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleWorkUpload(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (!isLikelyWorkPhoto(file)) {
        setIrrelevantWarning(file)
        return
      }
      processFile(file)
    })
  }

  function processFile(file) {
    const reader = new FileReader()
    reader.onload = ev => {
      const media = {
        id: `m${Date.now()}`,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: ev.target.result,
        verified: false,
        caption: '',
      }
      addWorkMedia(id, media)
      refresh()
      showToast(lang === 'hi' ? 'Media add ho gayi!' : 'Media added!')
    }
    reader.readAsDataURL(file)
  }

  function getShareText() {
    if (!worker) return ''
    if (lang === 'hi') {
      return `Namaste! Main ${worker.name} hoon, ${worker.skill} ka kaam karta hoon Sonipat mein. Mera HunarCard dekhiye: ${profileUrl}`
    }
    return `Hello! I'm ${worker.name}, a ${worker.skill} in ${worker.area}. View my HunarCard: ${profileUrl}`
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-center">⏳ {lang === 'hi' ? 'Load ho raha hai...' : 'Loading...'}</p>
      </div>
    )
  }

  const isPro = worker.verificationCount >= 5

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <LangToggle />

      {/* Header */}
      <div className="bg-gradient-to-r from-hunar-blue to-teal-600 px-5 py-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="text-white/70 text-xl">←</button>
          <h1 className="text-white font-black text-xl">{t('dashboardTitle')}</h1>
        </div>
        <div className="flex items-center gap-3">
          {worker.avatar
            ? <img src={worker.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white" alt={worker.name} />
            : <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center text-2xl font-black text-white">
                {worker.name[0]}
              </div>
          }
          <div>
            <p className="text-white font-black text-lg">{worker.name}</p>
            <p className="text-blue-200 text-sm">{SKILL_ICONS[worker.skill]} {worker.skill} • {worker.area}</p>
            <VerificationBadge count={worker.verificationCount} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
        {[
          { key: 'card', icon: '🪪', label: t('myCard') },
          { key: 'work', icon: '📸', label: t('myWork') },
          { key: 'bookings', icon: '📅', label: t('bookings') },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3.5 text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${
              activeTab === tab.key ? 'text-hunar-blue border-b-2 border-hunar-blue bg-blue-50' : 'text-slate-400'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 px-4 py-5">

        {/* ===== MY CARD TAB ===== */}
        {activeTab === 'card' && (
          <div>
            {/* Skill Card */}
            <div className="card border-2 border-blue-100 mb-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-3xl">{SKILL_ICONS[worker.skill] || '🛠️'}</span>
                  <h2 className="text-xl font-black text-slate-800 mt-1">{worker.name}</h2>
                  <p className="text-hunar-teal font-semibold text-sm">{worker.skill}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{worker.experience} {t('years')} • {worker.area}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isPro
                    ? <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">🏅 Pro</span>
                    : <ProBadgeLocked label={t('proLocked')} />
                  }
                  <VerificationBadge count={worker.verificationCount} />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Rate</p>
                  <p className="text-hunar-green font-black text-lg">{worker.rate}</p>
                </div>
                <QRCodeSVG
                  value={profileUrl}
                  size={80}
                  bgColor="#ffffff"
                  fgColor="#0F4C81"
                  level="M"
                  includeMargin={true}
                />
              </div>

              {worker.sponsoredBy && (
                <p className="text-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
                  🏪 {t('sponsored')} {worker.sponsoredBy}
                </p>
              )}
            </div>

            {/* Cold-start nudge */}
            {worker.verificationCount === 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5">
                <p className="text-amber-800 font-semibold text-sm mb-3">👆 {t('nudgeMsg')}</p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
                  target="_blank" rel="noreferrer"
                  className="btn-whatsapp py-3 text-sm"
                >
                  💬 {t('nudgeBtn')}
                </a>
              </div>
            )}

            {/* Share buttons */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
                target="_blank" rel="noreferrer"
                className="btn-whatsapp"
              >
                💬 {t('shareCard')}
              </a>
              <button
                onClick={() => navigate(`/profile/${id}`)}
                className="btn-secondary"
              >
                👁️ {lang === 'hi' ? 'Public Profile Dekho' : 'View Public Profile'}
              </button>
            </div>

            {/* Revenue model info */}
            <div className="mt-5 bg-blue-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-hunar-blue mb-1">
                {lang === 'hi' ? 'HunarCard kyun free hai?' : 'Why is HunarCard free?'}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'hi'
                  ? 'Worker se free, trust ban jaane ke baad optional upgrade; naye customer se chhota lead fee; existing relationship pe zero charge.'
                  : 'Free for workers, optional upgrade after trust builds; small lead fee from new customers; zero charge on existing relationships.'}
              </p>
            </div>
          </div>
        )}

        {/* ===== WORK GALLERY TAB ===== */}
        {activeTab === 'work' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800">📸 {t('myWork')}</h2>
              <button
                onClick={() => workInputRef.current?.click()}
                className="text-sm bg-hunar-blue text-white px-4 py-2 rounded-xl font-semibold active:scale-95 transition-transform"
              >
                + {lang === 'hi' ? 'Add Karein' : 'Add'}
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

            {worker.workMedia && worker.workMedia.length > 0 ? (
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
                    <div className="absolute top-1 right-1">
                      {media.verified
                        ? <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✓</span>
                        : <span className="bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">⏳</span>
                      }
                    </div>
                  </div>
                ))}

                {/* Upload tile */}
                <button
                  onClick={() => workInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center gap-1 bg-blue-50 active:scale-95 transition-transform"
                >
                  <span className="text-2xl text-hunar-blue">+</span>
                  <span className="text-xs text-hunar-blue font-semibold">
                    {lang === 'hi' ? 'Add' : 'Add'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-slate-500 font-semibold mb-4">
                  {lang === 'hi' ? 'Abhi koi kaam ki photo nahi hai' : 'No work photos yet'}
                </p>
                <button onClick={() => workInputRef.current?.click()} className="btn-primary w-auto px-8">
                  📸 {t('addWorkBtn')}
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-4">
              ⏳ {lang === 'hi' ? 'Customer verify karne ke baad photo ka status update hoga.' : 'Photo status updates after customer verification.'}
            </p>

            {/* Irrelevant photo warning */}
            {irrelevantWarning && (
              <div className="fixed inset-0 bg-black/50 flex items-end z-40">
                <div className="bg-white w-full rounded-t-3xl p-6">
                  <p className="text-slate-700 font-semibold text-center mb-4">⚠️ {t('irrelevantPhoto')}</p>
                  <div className="space-y-3">
                    <button onClick={() => { processFile(irrelevantWarning); setIrrelevantWarning(null) }} className="btn-primary">
                      {t('addAnyway')}
                    </button>
                    <button onClick={() => setIrrelevantWarning(null)} className="btn-secondary">
                      {t('skipPhoto')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== BOOKINGS TAB ===== */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-lg font-black text-slate-800 mb-4">📅 {t('bookings')}</h2>
            {worker.bookings && worker.bookings.length > 0 ? (
              <div className="space-y-4">
                {[...worker.bookings].reverse().map(booking => (
                  <div key={booking.id} className="card border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        booking.type === 'multi' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.type === 'multi' ? '🏗️ Multi-day' : '🔧 Small Job'}
                      </span>
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-full">
                        ⏳ Pending
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 space-y-1">
                      <p>📅 <span className="font-semibold">{booking.date}</span></p>
                      <p>📍 {booking.area}</p>
                      {booking.note && <p className="text-slate-500 italic">"{booking.note}"</p>}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(booking.createdAt).toLocaleDateString('hi-IN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-slate-500 text-sm mb-5">{t('noBookings')}</p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
                  target="_blank" rel="noreferrer"
                  className="btn-whatsapp"
                >
                  💬 {t('nudgeBtn')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
