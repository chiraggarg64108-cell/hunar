import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { getWorkers, SKILL_METAS } from '../data/seedData'
import { Search, MapPin, Star, Filter, ShieldCheck, ArrowRight } from 'lucide-react'

export default function DirectoryPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  const [workers, setWorkers] = useState([])
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setWorkers(getWorkers())
  }, [])

  const skillsList = ['Plumber', 'Electrician', 'Mason', 'Carpenter']
  const areasList = ['Sonipat', 'Bahalgarh', 'Gohana', 'Kundli', 'Delhi NCR']

  const filteredWorkers = workers.filter(w => {
    const matchesSkill = !selectedSkill || w.skill === selectedSkill
    const matchesArea = !selectedArea || w.area.toLowerCase().includes(selectedArea.toLowerCase())
    const matchesSearch = !searchQuery ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.area.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSkill && matchesArea && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 transition-colors">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            {t('dirTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('dirSub')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input-field pl-11 text-sm py-3"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Skill Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <button
            onClick={() => setSelectedSkill('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              !selectedSkill
                ? 'bg-hunar-blue text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterAll')}
          </button>
          {skillsList.map((skill) => {
            const meta = SKILL_METAS[skill]
            const isSelected = selectedSkill === skill
            return (
              <button
                key={skill}
                onClick={() => setSelectedSkill(isSelected ? '' : skill)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-hunar-blue text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{meta?.icon}</span>
                <span>{skill}</span>
              </button>
            )
          })}
        </div>

        {/* Area Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
            Area:
          </span>
          {areasList.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(selectedArea === area ? '' : area)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                selectedArea === area
                  ? 'bg-hunar-teal text-white'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Workers List */}
        <div className="space-y-3 pt-1">
          {filteredWorkers.length > 0 ? (
            filteredWorkers.map((worker) => {
              const meta = SKILL_METAS[worker.skill] || { icon: '🛠️' }
              const isVerified = worker.verificationCount > 0
              const isPro = worker.verificationCount >= 5

              return (
                <div
                  key={worker.id}
                  onClick={() => navigate(`/profile/${worker.id}`)}
                  className="app-card hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all cursor-pointer group active:scale-99 p-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Worker Avatar / Photo */}
                    <div className="w-16 h-18 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative">
                      {worker.avatar ? (
                        <img
                          src={worker.avatar}
                          alt={worker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-400">
                          {worker.name[0]}
                        </div>
                      )}
                      {isVerified && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-[9px] font-black border border-white">
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Worker Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white truncate group-hover:text-hunar-teal transition-colors">
                          {worker.name}
                        </h3>
                        {isPro && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300">
                            🏅 PRO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-hunar-teal">
                          {meta.icon} {worker.skill}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {worker.experience} {t('years')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                        <span>{worker.area}</span>
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Status Badge */}
                        {isVerified ? (
                          <span className="badge-verified text-[10px]">
                            ✅ {t('workerCardVerified', { n: worker.verificationCount })}
                          </span>
                        ) : (
                          <span className="badge-pending text-[10px]">
                            ⏳ {t('workerCardPending')}
                          </span>
                        )}

                        {/* Rate */}
                        <span className="text-xs font-black text-hunar-green">
                          {worker.rate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="app-card text-center py-8 text-slate-400">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs font-medium">{t('noWorkersFound')}</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
