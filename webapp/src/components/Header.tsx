import { Calculator, BookOpen } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import LangSwitcher from './LangSwitcher'
import WarehouseSwitcher from './WarehouseSwitcher'

interface Props {
  onOpenHelp: () => void
  children?: React.ReactNode
}

export default function Header({ onOpenHelp, children }: Props) {
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Calculator size={18} strokeWidth={2.5} />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{t('app.title')}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 truncate">{t('app.subtitle')}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm hover:bg-slate-100 transition"
            aria-label="Help"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline text-slate-700">{t('upload.guide')}</span>
          </button>
          <WarehouseSwitcher />
          <LangSwitcher />
          {children}
        </div>
      </div>
    </header>
  )
}
