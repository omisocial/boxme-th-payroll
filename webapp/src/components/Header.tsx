import { useState, useRef, useEffect } from 'react'
import { Calculator, Settings, BookOpen, BookOpenText, Shield, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import LangSwitcher from './LangSwitcher'
import WarehouseSwitcher from './WarehouseSwitcher'

interface Props {
  onOpenHelp: () => void
  onOpenGuide?: () => void
  canAdmin?: boolean
  onOpenSettings?: () => void
  onOpenAdmin?: () => void
  children?: React.ReactNode
}

export default function Header({ onOpenHelp, onOpenGuide, canAdmin, onOpenSettings, onOpenAdmin, children }: Props) {
  const { t } = useI18n()
  const [gearOpen, setGearOpen] = useState(false)
  const gearRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        setGearOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">

        {/* Left: logo + title + warehouse */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Calculator size={16} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-900 text-sm truncate">{t('app.title')}</span>
            <span className="text-slate-300 text-sm hidden sm:inline">·</span>
            <WarehouseSwitcher />
          </div>
        </div>

        {/* Right: gear + user slot */}
        <div className="flex items-center gap-1">

          {/* Gear dropdown */}
          <div ref={gearRef} className="relative">
            <button
              onClick={() => setGearOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-0.5"
              aria-label={t('nav.settings')}
            >
              <Settings size={16} />
              <ChevronDown size={12} className={`transition-transform ${gearOpen ? 'rotate-180' : ''}`} />
            </button>

            {gearOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={() => { onOpenHelp(); setGearOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <BookOpen size={14} className="text-slate-400" />
                  {t('upload.guide')}
                </button>
                <button
                  onClick={() => { onOpenGuide?.(); setGearOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <BookOpenText size={14} className="text-blue-500" />
                  {t('nav.guide')}
                </button>

                <div className="px-3 py-1.5">
                  <LangSwitcher inline />
                </div>

                {canAdmin && (
                  <>
                    <div className="mx-3 my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { onOpenSettings?.(); setGearOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <SlidersHorizontal size={14} className="text-slate-400" />
                      {t('nav.settings')}
                    </button>
                    <button
                      onClick={() => { onOpenAdmin?.(); setGearOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Shield size={14} className="text-slate-400" />
                      {t('nav.admin')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </header>
  )
}
