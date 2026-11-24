import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { INITIAL_WORKERS } from '../data/seedData'
import { Sun, Moon, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const { isDark, toggleTheme } = useTheme()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(lang === 'hi' ? 'Kripya apna naam daliye' : 'Please enter your name')
      return
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError(lang === 'hi' ? 'Kripya 10-digit mobile number daliye' : 'Please enter a valid 10-digit phone number')
      return
    }

    login(name.trim(), phone)
    navigate('/dashboard')
  }

  // Quick fill helper for hackathon judges
  const handleQuickSeedLogin = (worker) => {
    setName(worker.name)
    setPhone(worker.phone)
    login(worker.name, worker.phone)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/40 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header bar */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pt-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-hunar-blue to-hunar-teal flex items-center justify-center text-white text-lg shadow-md">
            🛠️
          </div>
          <div>
            <span className="font-black text-lg text-hunar-blue dark:text-white leading-none block">
              HunarCard
            </span>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold block">
              📍 Sonipat, Haryana
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
          <button
            onClick={toggleLang}
            className="px-3 h-9 rounded-xl bg-white dark:bg-slate-800 text-hunar-blue dark:text-teal-300 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
          >
            {lang === 'hi' ? 'EN' : 'हिन्दी'}
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 transition-colors">
          {/* Badge & Friendly Worker Art */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 mb-3">
              <Sparkles size={13} className="text-amber-500" />
              <span>{lang === 'hi' ? 'Voice-First Skill Identity' : 'Voice-First Skill Identity'}</span>
            </div>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-hunar-blue via-teal-700 to-hunar-teal flex items-center justify-center text-4xl shadow-xl shadow-teal-700/20 mb-3">
              👷🏽‍♂️
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('appTagline')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {t('loginSub')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {t('inputNameLabel')}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={t('inputNamePlaceholder')}
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {t('inputPhoneLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  className="input-field pl-14"
                  placeholder={t('inputPhonePlaceholder')}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                ⚠️ {error}
              </p>
            )}

            <button type="submit" className="btn-primary text-lg py-4 mt-2">
              <span>{t('loginBtn')}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* 1-1-1 Compact Value Strip */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-2.5">
              <span className="text-base block">⏱️</span>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">1 Minute</span>
              <span className="text-[9px] text-slate-400 block">Voice Profile</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-2.5">
              <span className="text-base block">📱</span>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">1 Scan</span>
              <span className="text-[9px] text-slate-400 block">Aadhaar QR</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-2.5">
              <span className="text-base block">👆</span>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">1 Tap</span>
              <span className="text-[9px] text-slate-400 block">Direct Booking</span>
            </div>
          </div>

          {/* Quick Demo Selector for Judges */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              ⚡ Quick Demo Login (Judges & Evaluation)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSeedLogin(INITIAL_WORKERS[0])}
                className="text-left p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-xs text-hunar-blue dark:text-blue-300 font-semibold border border-blue-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
              >
                <span>🪠</span>
                <span className="truncate">Ramesh (5★ Plumber)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSeedLogin(INITIAL_WORKERS[1])}
                className="text-left p-2.5 rounded-xl bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 text-xs text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
              >
                <span>💡</span>
                <span className="truncate">Suresh (Electrician)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-hunar-green" />
          <span>Zero Commission • Direct Customer Payments</span>
        </p>
      </div>
    </div>
  )
}
