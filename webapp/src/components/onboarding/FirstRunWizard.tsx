import { useState } from 'react'
import { X, ArrowRight, Check, Upload, Users, Calculator, Wallet, BarChart3, Download } from 'lucide-react'
import { useWarehouse } from '../../context/WarehouseContext'
import { downloadTemplate } from '../../payroll/template'
import { useI18n } from '../../i18n/I18n'

const STORAGE_KEY = 'boxme-payroll.onboarding_completed_at'

export function shouldShowOnboarding(): boolean {
  if (typeof localStorage === 'undefined') return false
  return !localStorage.getItem(STORAGE_KEY)
}

export function markOnboardingDone() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  }
}

interface Props {
  onClose: () => void
}

export default function FirstRunWizard({ onClose }: Props) {
  const { t } = useI18n()
  const { current } = useWarehouse()
  const [idx, setIdx] = useState(0)

  const STEPS = [
    {
      title: t('onboard.title'),
      desc: t('onboard.desc'),
      icon: <Upload className="text-blue-600" size={28} />,
    },
    {
      title: t('onboard.step1.title'),
      desc: t('onboard.step1.desc'),
      icon: <Upload className="text-blue-600" size={28} />,
    },
    {
      title: t('onboard.step2.title'),
      desc: t('onboard.step2.desc'),
      icon: <Users className="text-amber-600" size={28} />,
    },
    {
      title: t('onboard.step3.title'),
      desc: t('onboard.step3.desc'),
      icon: <Calculator className="text-emerald-600" size={28} />,
    },
    {
      title: t('onboard.step4.title'),
      desc: t('onboard.step4.desc'),
      icon: <BarChart3 className="text-purple-600" size={28} />,
    },
  ]

  const isLast = idx === STEPS.length - 1
  const step = STEPS[idx]

  function finish() {
    markOnboardingDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="text-xs text-slate-400 font-mono">
            {idx + 1} / {STEPS.length}
          </div>
          <button onClick={finish} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 sm:px-8 py-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
            {step.icon}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>

          {idx === 1 && current && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 text-left">
              <div className="font-medium mb-1">{t('bulk.warehouseLabel')}</div>
              <div>
                <strong>{current.code}</strong> — {current.name}
              </div>
              <button
                onClick={() => downloadTemplate()}
                className="mt-2 inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-medium"
              >
                <Download size={12} /> {t('upload.template')}
              </button>
            </div>
          )}

          {idx === 3 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 text-left flex items-start gap-2">
              <Wallet size={14} className="shrink-0 mt-0.5" />
              <span>{t('onboard.step3.desc')}</span>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-6 bg-blue-600' : i < idx ? 'w-1.5 bg-emerald-400' : 'w-1.5 bg-slate-200'
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="px-5 py-4 border-t bg-slate-50 flex items-center justify-between">
          <button onClick={finish} className="text-xs text-slate-500 hover:text-slate-700">
            {t('onboard.skip')}
          </button>
          <div className="flex gap-2">
            {idx > 0 && (
              <button onClick={() => setIdx(idx - 1)} className="btn-secondary text-sm">
                {t('onboard.back')}
              </button>
            )}
            {isLast ? (
              <button onClick={finish} className="btn-primary text-sm flex items-center gap-1.5">
                <Check size={14} /> {t('onboard.start')}
              </button>
            ) : (
              <button onClick={() => setIdx(idx + 1)} className="btn-primary text-sm flex items-center gap-1.5">
                {t('onboard.next')} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
