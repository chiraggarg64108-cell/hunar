import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import AadhaarSkillCard from '../components/AadhaarSkillCard'
import { getWorker, getWorkers } from '../data/seedData'
import { Mic, ArrowRight, ShieldCheck } from 'lucide-react'

export default function MyCardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { t, lang } = useLanguage()
  const [worker, setWorker] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    if (currentUser.workerId) {
      const found = getWorker(currentUser.workerId)
      if (found) {
        setWorker(found)
        return
      }
    }

    const all = getWorkers()
    const match = all.find(w => w.phone === currentUser.phone || w.name.toLowerCase() === currentUser.name.toLowerCase())
    setWorker(match || null)
  }, [currentUser, navigate])

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 transition-colors">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            {t('navCard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'hi' ? 'Aadhaar-jaisa verified digital skill pehchaan patra' : 'Official scannable digital skill identity card'}
          </p>
        </div>

        {worker ? (
          <div className="space-y-4">
            <AadhaarSkillCard worker={worker} showActions={true} />

            <div className="app-card space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Card Details & Actions
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ye card aapke phone mein image ki tarah download ho sakta hai ya WhatsApp par kisi bhi customer ko bhej sakte hain.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => navigate('/builder?mode=edit')}
                  className="btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <span>✏️ Edit Card by Voice</span>
                </button>
                <button
                  onClick={() => navigate(`/profile/${worker.id}`)}
                  className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <span>Public Profile 👁️</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-card text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-3xl mx-auto">
              🪪
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {t('ctaNoCardTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                {t('ctaNoCardSub')}
              </p>
            </div>
            <button
              onClick={() => navigate('/builder')}
              className="btn-primary text-sm py-3.5 max-w-xs mx-auto"
            >
              <Mic size={18} />
              <span>{t('startVoiceBtn')}</span>
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
