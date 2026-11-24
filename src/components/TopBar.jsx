import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { Settings, Sun, Moon, MapPin } from 'lucide-react'

export default function TopBar({ title, onOpenSettings = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, toggleLang, t } = useLanguage()
  const { isDark, toggleTheme } = useTheme()

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings()
    } else {
      navigate('/settings')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors px-4 py-3">
      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Left: App Logo & Name */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-hunar-blue to-hunar-teal flex items-center justify-center text-white text-base shadow-sm">
            🛠️
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-hunar-blue dark:text-white leading-none">
              HunarCard
            </h1>
            {/* Location always visible below or beside logo */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
              <MapPin size={11} className="text-hunar-teal flex-shrink-0" />
              <span>Sonipat, Haryana</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
            title="Toggle Dark / Light Theme"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="px-2.5 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-hunar-blue dark:text-teal-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-95 transition-all"
            title="Switch Language"
          >
            {lang === 'hi' ? 'EN' : 'हिन्दी'}
          </button>

          {/* Settings Gear */}
          <button
            onClick={handleSettingsClick}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
              location.pathname === '/settings'
                ? 'bg-hunar-blue text-white border-hunar-blue'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
