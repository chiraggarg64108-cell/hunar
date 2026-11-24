// Shared UI components

import { useLanguage } from '../context/LanguageContext'
import { speak } from '../utils/voiceParser'

// Language toggle — persistent top-right switch
export function LangToggle() {
  const { lang, toggleLang } = useLanguage()
  return (
    <button
      onClick={toggleLang}
      className="fixed top-4 right-4 z-50 bg-white shadow-md rounded-full px-3 py-2 text-sm font-semibold text-hunar-blue border border-blue-100 active:scale-95 transition-transform"
      aria-label="Toggle Language"
    >
      {lang === 'hi' ? 'EN' : 'हिं'}
    </button>
  )
}

// Audio guide button — plays a spoken explanation
export function AudioGuideBtn({ text }) {
  const { lang } = useLanguage()
  return (
    <button
      onClick={() => speak(text, lang)}
      className="inline-flex items-center gap-1.5 text-hunar-teal text-sm font-medium active:scale-95 transition-transform"
      title="Audio Guide"
    >
      <span className="text-xl">🔊</span>
      <span className="underline underline-offset-2">Audio Guide</span>
    </button>
  )
}

// Star rating display
export function StarRating({ rating, max = 5, size = 'md' }) {
  const cls = size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`${cls} ${i < rating ? 'star-filled' : 'star-empty'}`}>★</span>
      ))}
    </span>
  )
}

// Interactive star picker
export function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`text-3xl transition-transform active:scale-110 ${n <= value ? 'star-filled' : 'star-empty'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// Verification badge
export function VerificationBadge({ count }) {
  if (count === 0) {
    return (
      <span className="pending-badge">
        <span>⏳</span> Pending Verification
      </span>
    )
  }
  const label = count >= 5 ? 'Verified by 5+ Customers' : `Verified by ${count} Customer${count > 1 ? 's' : ''}`
  return (
    <span className="verified-badge">
      <span>✅</span> {label}
    </span>
  )
}

// Skill icon pill
export function SkillPill({ skill }) {
  const icons = { Plumber: '🪠', Electrician: '💡', Mason: '🧱', Carpenter: '🔨' }
  return (
    <span className="inline-flex items-center gap-1.5 bg-hunar-light text-hunar-blue px-3 py-1.5 rounded-full text-sm font-semibold">
      <span>{icons[skill] || '🛠️'}</span>
      <span>{skill}</span>
    </span>
  )
}

// Loading spinner
export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
  return (
    <div className={`${sz} border-4 border-blue-100 border-t-hunar-blue rounded-full animate-spin`} />
  )
}

// Toast notification
export function Toast({ message, type = 'success', onClose }) {
  const bg = type === 'success' ? 'bg-hunar-green' : type === 'error' ? 'bg-red-500' : 'bg-hunar-blue'
  return (
    <div className={`fixed bottom-6 left-4 right-4 max-w-md mx-auto ${bg} text-white px-5 py-4 rounded-2xl shadow-xl z-50 flex items-center justify-between gap-3`}>
      <span className="font-semibold text-sm">{message}</span>
      <button onClick={onClose} className="text-white/80 text-lg leading-none">✕</button>
    </div>
  )
}

// Avatar circle
export function Avatar({ src, name, size = 'lg' }) {
  const sz = size === 'xl' ? 'w-24 h-24' : size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10'
  const textSz = size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-2xl' : 'text-lg'
  if (src) {
    return <img src={src} alt={name} className={`${sz} rounded-full object-cover border-3 border-white shadow-md`} />
  }
  const initials = (name || 'W').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`${sz} rounded-full bg-hunar-blue flex items-center justify-center ${textSz} font-bold text-white shadow-md`}>
      {initials}
    </div>
  )
}

// Back button
export function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 text-hunar-blue font-semibold py-2 active:scale-95 transition-transform">
      <span className="text-xl">←</span> Back
    </button>
  )
}

// Section header
export function SectionHeader({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {action}
    </div>
  )
}

// Pro badge (locked)
export function ProBadgeLocked({ label }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full text-sm font-semibold opacity-70 cursor-not-allowed" title={label}>
      <span>🏅</span> Pro Badge
      <span className="absolute -top-1 -right-1 text-xs bg-gray-300 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">🔒</span>
    </div>
  )
}
