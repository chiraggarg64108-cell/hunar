import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Home, CreditCard, Users, Settings } from 'lucide-react'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  const tabs = [
    { path: '/dashboard', label: t('navHome'), icon: Home },
    { path: '/my-card', label: t('navCard'), icon: CreditCard },
    { path: '/directory', label: t('navDirectory'), icon: Users },
    { path: '/settings', label: t('navSettings'), icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors py-2 px-3">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-95 ${
                isActive
                  ? 'text-hunar-blue dark:text-teal-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-teal-50 dark:bg-teal-950/60' : 'bg-transparent'
                }`}
              >
                <Icon size={20} />
              </div>
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
