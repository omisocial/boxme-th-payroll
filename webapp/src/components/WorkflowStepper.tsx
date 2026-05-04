import { Check } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

export type StepKey = 'import' | 'fix' | 'calculate' | 'pay' | 'report'

interface StepDef {
  key: StepKey
  label: string
}

interface Props {
  current: StepKey
  done?: StepKey[]
  onJump?: (step: StepKey) => void
}

export default function WorkflowStepper({ current, done = [], onJump }: Props) {
  const { t } = useI18n()

  const STEPS: StepDef[] = [
    { key: 'import',    label: t('step.import') },
    { key: 'fix',       label: t('step.workers') },
    { key: 'calculate', label: t('step.calculate') },
    { key: 'pay',       label: t('step.pay') },
    { key: 'report',    label: t('step.report') },
  ]
  return (
    <div className="sticky top-[49px] z-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between sm:justify-start sm:gap-1">
        {STEPS.map((s, idx) => {
          const isCurrent = s.key === current
          const isDone = done.includes(s.key)

          return (
            <div key={s.key} className="flex items-center flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() => onJump?.(s.key)}
                className={`flex items-center gap-2 px-2 sm:px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start rounded-none sm:rounded-lg my-0 sm:my-1 border-b-2 sm:border-b-0 ${
                  isCurrent
                    ? 'border-blue-600 text-blue-700 sm:bg-blue-50 sm:border-transparent'
                    : isDone
                    ? 'border-transparent text-emerald-700 sm:hover:bg-emerald-50'
                    : 'border-transparent text-slate-400 sm:hover:bg-slate-50'
                }`}
              >
                {/* Number circle / checkmark */}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isDone && !isCurrent ? <Check size={10} strokeWidth={3} /> : idx + 1}
                </span>

                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden text-[10px]">{s.label}</span>
              </button>

              {/* Arrow divider — only on sm+ */}
              {idx < STEPS.length - 1 && (
                <span className="hidden sm:inline text-slate-300 text-base mx-0.5 select-none">›</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
