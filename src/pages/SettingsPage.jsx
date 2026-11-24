import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { getGeminiApiKey, setGeminiApiKey, isGeminiKeyConfigured, testGeminiApiKey } from '../utils/voiceAgent'
import {
  Sun, Moon, Globe, User, Phone, ShieldCheck,
  LogOut, Heart, HelpCircle, Layers, Sparkles, Key, CheckCircle2, AlertCircle, ExternalLink, Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const { isDark, toggleTheme } = useTheme()

  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey())
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')
  const isConnected = isGeminiKeyConfigured()

  const handleSaveApiKey = async () => {
    const trimmed = (apiKeyInput || '').trim()
    if (!trimmed) {
      setTestStatus('error')
      setTestMessage('Please paste your Gemini API key')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testing connection to Gemini...')

    const res = await testGeminiApiKey(trimmed)
    if (res.success) {
      setGeminiApiKey(trimmed)
      setTestStatus('success')
      setTestMessage('✅ Connected! Voice AI ready.')
      setTimeout(() => {
        setTestStatus(null)
      }, 3500)
    } else {
      setTestStatus('error')
      setTestMessage(res.error || 'Connection failed')
    }
  }

  const handleClearApiKey = () => {
    setGeminiApiKey('')
    setApiKeyInput('')
    setTestStatus('success')
    setTestMessage('Key cleared.')
    setTimeout(() => {
      setTestStatus(null)
      setTestMessage('')
    }, 2000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 transition-colors">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            {t('settingsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            App preferences, Gemini AI Live Audio & account
          </p>
        </div>

        {/* 0. Gemini Live Multimodal Audio Key Configuration */}
        <div className="app-card space-y-3 border-2 border-teal-500/30 dark:border-teal-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Gemini Multimodal Voice AI</span>
                  {isConnected ? (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </p>
                <div className="mt-0.5">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} />
                      <span>Gemini Live Audio Connected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      <AlertCircle size={12} />
                      <span>Add Gemini API Key in Settings</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Gemini 2.5 Flash powers real conversational multimodal audio listening for Hindi, English & Haryanvi without Web Speech bugs.
          </p>

          <div className="space-y-2 pt-1">
            <div className="relative">
              <input
                type="password"
                className="input-field text-xs py-2.5 font-mono pr-20"
                placeholder="Paste AI Studio API Key (AIzaSy...)"
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value)
                  if (testStatus) setTestStatus(null)
                }}
              />
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="absolute right-2 top-2.5 text-[10px] text-slate-400 hover:text-red-500 font-bold px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>

            {testMessage && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : testStatus === 'testing'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {testStatus === 'testing' && <Loader2 size={14} className="animate-spin text-blue-600 flex-shrink-0" />}
                {testStatus === 'success' && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
                {testStatus === 'error' && <AlertCircle size={14} className="text-red-600 flex-shrink-0" />}
                <span className="font-semibold leading-tight">{testMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={testStatus === 'testing'}
                className="btn-primary text-xs py-2.5 flex-1 disabled:opacity-60"
              >
                {testStatus === 'testing' ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Connecting...</span>
                  </span>
                ) : (
                  <span>{testStatus === 'success' ? '✅ Connected!' : 'Save & Connect'}</span>
                )}
              </button>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-2.5 px-3 flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300 w-auto"
                title="Get free API Key from Google AI Studio"
              >
                <span>Get Free Key</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* 1. Theme Setting (Dark / Light Mode) */}
        <div className="app-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-slate-800 text-amber-500 flex items-center justify-center">
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {t('appearanceTheme')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isDark ? t('themeDark') : t('themeLight')}
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                isDark ? 'bg-teal-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle dark mode"
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform flex items-center justify-center text-[11px] ${
                  isDark ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {isDark ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>

        {/* 2. Language Setting */}
        <div className="app-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {t('languageSection')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi' ? 'हिन्दी (Hindi) सक्रिय है' : 'English is active'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleLang}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-slate-800 text-hunar-blue dark:text-teal-300 border border-teal-200 dark:border-slate-700 text-xs font-bold active:scale-95 transition-all"
            >
              {lang === 'hi' ? 'Switch to EN' : 'Switch to हिन्दी'}
            </button>
          </div>
        </div>

        {/* 3. Account Information */}
        <div className="app-card space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {t('accountInfo')}
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Name</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {currentUser?.name || 'Worker'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Phone</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
                +91 {currentUser?.phone || '9876543210'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Why Is HunarCard Free? & Revenue Model */}
        <div className="app-card space-y-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-teal-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t('whyFreeSection')}
            </h3>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60">
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-200 leading-relaxed italic">
              "{t('whyFreeExplanation')}"
            </p>
          </div>

          {/* Freemium Trust Ladder */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-green-600 font-bold">L1</span>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Free Forever</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Voice profile, QR card, basic portfolio, customer verifications. Zero commission.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-amber-500 font-bold">L2</span>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Verified Pro Badge (₹49/mo)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Unlocks after 5+ customer verifications. Gold badge, unlimited uploads, directory boost.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-blue-500 font-bold">L3</span>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Micro-Booking Fee (₹15–19)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Charged only on new cold directory customer bookings. Existing relationships always free!
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-purple-500 font-bold">L4</span>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Local Shop Sponsorship (₹199/mo)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  "Powered by [Hardware Shop]" tag under the card connecting local ecosystem.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          <LogOut size={16} />
          <span>{t('logoutBtn')}</span>
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
