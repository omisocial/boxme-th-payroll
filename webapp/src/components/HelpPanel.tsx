import { X, BookOpen, Calculator } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

interface Props {
  tab: 'guide' | 'formula'
  onClose: () => void
}

export default function HelpPanel({ tab, onClose }: Props) {
  const { t } = useI18n()
  const isGuide = tab === 'guide'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 grid place-items-center text-blue-600">
              {isGuide ? <BookOpen size={20} /> : <Calculator size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{isGuide ? t('help.title') : t('fx.title')}</h3>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {isGuide ? <GuideContent /> : <FormulaContent />}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="btn-primary text-sm">{t('common.close')}</button>
        </div>
      </div>
    </div>
  )
}

function GuideContent() {
  const { t } = useI18n()
  const steps: { title: string; body: string }[] = [
    { title: t('help.s1.title'), body: t('help.s1.body') },
    { title: t('help.s2.title'), body: t('help.s2.body') },
    { title: t('help.s3.title'), body: t('help.s3.body') },
    { title: t('help.s4.title'), body: t('help.s4.body') },
    { title: t('help.s5.title'), body: t('help.s5.body') },
  ]
  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <div key={i} className="border-l-4 border-blue-500 pl-4 py-1">
          <h4 className="font-semibold text-slate-900 text-sm">{s.title}</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  )
}

function FormulaContent() {
  const { t } = useI18n()
  const steps: { title: string; body: string }[] = [
    { title: t('fx.step1'), body: t('fx.step1.body') },
    { title: t('fx.step2'), body: t('fx.step2.body') },
    { title: t('fx.step3'), body: t('fx.step3.body') },
    { title: t('fx.step4'), body: t('fx.step4.body') },
    { title: t('fx.step5'), body: t('fx.step5.body') },
    { title: t('fx.step6'), body: t('fx.step6.body') },
    { title: t('fx.step7'), body: t('fx.step7.body') },
  ]
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 leading-relaxed">{t('fx.intro')}</p>

      <div className="card border border-blue-100 bg-blue-50/40 p-4">
        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Excel formula (canonical)</div>
        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">{`U  = IF(shift_hours <= 6, 5, 8)
W  = (rate / U / 60) × late_min   [BM/DW only]
Z  = (rate / U / 60) × early_min
AG = (rate / U) × 1.5 × OT_hours
AH = (rate − W − Z − damage − other) + AG
gross = MAX(0, AH)`}</pre>
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-3.5">
            <div className="text-sm font-semibold text-slate-900">{s.title}</div>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="card border border-amber-100 bg-amber-50/40 p-4">
        <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">{t('fx.glossary')}</div>
        <p className="text-sm text-slate-700 leading-relaxed">{t('fx.glossary.body')}</p>
      </div>

      <div className="card border border-emerald-100 bg-emerald-50/40 p-4">
        <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">{t('fx.checks')}</div>
        <p className="text-sm text-slate-700 leading-relaxed">{t('fx.checks.body')}</p>
      </div>
    </div>
  )
}
