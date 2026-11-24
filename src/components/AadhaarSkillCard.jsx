import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import { SKILL_METAS } from '../data/seedData'
import { useLanguage } from '../context/LanguageContext'

export default function AadhaarSkillCard({ worker, showActions = true, onShare = null }) {
  const { t, lang } = useLanguage()
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  if (!worker) return null

  const meta = SKILL_METAS[worker.skill] || { icon: '🛠️', color: '#0F4C81', label: worker.skill }
  const profileUrl = `${window.location.origin}/profile/${worker.id}`
  const isVerified = worker.verificationCount > 0
  const isPro = worker.verificationCount >= 5

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      setDownloading(true)
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      })
      const link = document.createElement('a')
      link.download = `HunarCard-${worker.name.replace(/\s+/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Failed to download card', e)
    } finally {
      setDownloading(false)
    }
  }

  const handleWhatsAppShare = () => {
    if (onShare) {
      onShare()
      return
    }
    const text = lang === 'hi'
      ? `Namaste! Mera official HunarCard (Digital Skill ID) dekhiye aur direct book karein: ${profileUrl}`
      : `Hello! View my official HunarCard (Digital Skill ID) and book directly: ${profileUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="w-full">
      {/* THE AADHAAR-STYLE SKILL CARD CONTAINER */}
      <div
        ref={cardRef}
        className="relative bg-gradient-to-br from-white via-slate-50 to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden p-0 text-slate-800 dark:text-slate-100 select-none"
      >
        {/* Top Official Header Strip (Aadhaar Inspired) */}
        <div className="bg-gradient-to-r from-hunar-blue via-teal-800 to-hunar-blue text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-amber-500/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-black border border-white/40">
              🇮🇳
            </div>
            <div>
              <p className="text-[11px] font-black tracking-wider uppercase leading-none text-amber-300">
                {t('idCardHeaderGov')}
              </p>
              <p className="text-[9px] text-teal-100 font-medium tracking-widest uppercase">
                {t('idCardEmblem')}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white/15 px-2 py-0.5 rounded text-white border border-white/20">
            {worker.skillId || 'HC-IND-1001'}
          </span>
        </div>

        {/* Security Micro-Pattern Strip */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600 opacity-90" />

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Left: Passport Photo Slot */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl border-2 border-slate-400 dark:border-slate-600 overflow-hidden shadow-inner bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                {worker.avatar ? (
                  <img
                    src={worker.avatar}
                    alt={worker.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <span className="text-3xl">👤</span>
                    <span className="text-[10px] mt-1 font-bold">PHOTO</span>
                  </div>
                )}
                {/* Official Stamp Watermark */}
                {isVerified ? (
                  <div className="absolute -bottom-2 -right-2 bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter border-2 border-white shadow transform -rotate-12">
                    VERIFIED
                  </div>
                ) : (
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-white shadow">
                    PENDING
                  </div>
                )}
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-mono text-center">
                ID: {worker.id ? worker.id.slice(0, 10) : 'PRO-01'}
              </p>
            </div>

            {/* Right: Key Credentials */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {worker.name}
                </h3>
                {isPro && (
                  <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 flex items-center gap-0.5">
                    🏅 PRO
                  </span>
                )}
              </div>

              {/* Trade with icon */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold text-xs mt-1 border border-teal-200 dark:border-teal-800">
                <span>{meta.icon}</span>
                <span>{worker.skill}</span>
              </div>

              {/* Grid of Attributes */}
              <div className="mt-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">{t('idCardExpLabel')}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {worker.experience} {t('years')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">{t('idCardAreaLabel')}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate ml-2">
                    {worker.area}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">{t('idCardRateLabel')}:</span>
                  <span className="font-black text-hunar-green text-sm">
                    {worker.rate}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-2.5">
                {isVerified ? (
                  <span className="badge-verified text-[11px]">
                    <span>✅</span> Verified by {worker.verificationCount} Customer{worker.verificationCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="badge-pending text-[11px]">
                    <span>⏳</span> {t('pendingStamp')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lower Section: QR + Aadhaar Verification Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                AUTHENTICITY SCAN
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {t('scanToVerify')}
              </p>
              {worker.sponsoredBy && (
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1 truncate">
                  🏪 Sponsored by {worker.sponsoredBy}
                </p>
              )}
            </div>

            {/* Prominent Corner QR Code */}
            <div className="bg-white p-2 rounded-xl shadow-md border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
              <QRCodeSVG
                value={profileUrl}
                size={78}
                bgColor="#ffffff"
                fgColor="#0A3A60"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <span className="font-mono">HUNARCARD SECURE IDENTITY</span>
          <span>100% Commission-Free</span>
        </div>
      </div>

      {/* Action Buttons Below the Card (if enabled) */}
      {showActions && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleWhatsAppShare}
            className="btn-whatsapp text-sm py-3"
          >
            <span>💬</span> {t('actionShareWhatsapp')}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-secondary text-sm py-3"
          >
            <span>📥</span> {downloading ? 'Downloading...' : t('actionDownloadCard')}
          </button>
        </div>
      )}
    </div>
  )
}
