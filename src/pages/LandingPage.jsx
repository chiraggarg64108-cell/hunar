// Landing Page — the first screen a user sees
// Big mic button, 1-1-1 promise strip, two entry points

import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { LangToggle, AudioGuideBtn } from '../components/SharedComponents'
import { speak } from '../utils/voiceParser'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-b from-hunar-blue to-teal-700 flex flex-col">
      <LangToggle />

      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <div className="text-5xl mb-3">🛠️</div>
        <h1 className="text-4xl font-black text-white tracking-tight">HunarCard</h1>
        <p className="text-blue-200 text-sm mt-1 font-medium">LinkedIn + UPI QR for Bharat's Workers</p>
      </div>

      {/* Main card */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] px-6 py-8 flex flex-col">
        {/* Tagline */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-hunar-blue mb-2">{t('tagline')}</h2>
          <p className="text-slate-500 text-sm">{t('taglineSub')}</p>
        </div>

        {/* Audio guide */}
        <div className="flex justify-center mb-6">
          <AudioGuideBtn text={t('audioGuide')} />
        </div>

        {/* 1-1-1 Promise strip */}
        <div className="flex gap-2 mb-8">
          {[
            { icon: '⏱️', label: t('promise1') },
            { icon: '📱', label: t('promise2') },
            { icon: '👆', label: t('promise3') },
          ].map(({ icon, label }) => (
            <div key={label} className="flex-1 bg-hunar-light rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xs font-semibold text-hunar-blue leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Skill icons strip */}
        <div className="flex justify-center gap-6 mb-8">
          {[
            { icon: '🪠', label: lang === 'hi' ? 'Plumber' : 'Plumber' },
            { icon: '💡', label: lang === 'hi' ? 'Electrician' : 'Electrician' },
            { icon: '🧱', label: lang === 'hi' ? 'Mason' : 'Mason' },
            { icon: '🔨', label: lang === 'hi' ? 'Carpenter' : 'Carpenter' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-3xl">{icon}</span>
              <span className="text-xs text-slate-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 mt-auto">
          <button
            onClick={() => navigate('/onboard')}
            className="btn-primary text-xl py-5"
          >
            <span className="text-2xl">🎤</span>
            {t('workerBtn')}
          </button>

          <button
            onClick={() => navigate('/directory')}
            className="btn-secondary"
          >
            <span className="text-xl">🔍</span>
            {t('directoryBtn')}
          </button>
        </div>

        {/* Revenue model micro-copy */}
        <p className="text-center text-xs text-slate-400 mt-5 leading-relaxed">
          {lang === 'hi'
            ? 'Worker se free, trust ban jaane ke baad optional upgrade; naye customer se chhota lead fee'
            : 'Free for workers, optional upgrade after trust; small lead fee from new customers only'}
        </p>
      </div>
    </div>
  )
}
