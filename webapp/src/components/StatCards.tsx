import { Users, Calendar, Banknote, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import type { PeriodSummary } from '../payroll/types'
import { fmtTHB, fmtNum } from '../utils/format'
import { useI18n } from '../i18n/I18n'

interface Props { summary: PeriodSummary }

export default function StatCards({ summary }: Props) {
  const { t } = useI18n()
  const items = [
    { icon: <Banknote size={18} />, label: t('stat.totalGross'), value: fmtTHB(summary.totalGrossThb), accent: 'from-emerald-500 to-emerald-600' },
    { icon: <Users size={18} />, label: t('stat.workers'), value: fmtNum(summary.totalWorkers), accent: 'from-blue-500 to-blue-600' },
    { icon: <Calendar size={18} />, label: t('stat.days'), value: fmtNum(summary.totalDays), accent: 'from-violet-500 to-violet-600' },
    { icon: <Clock size={18} />, label: t('stat.shifts'), value: fmtNum(summary.totalShifts), accent: 'from-amber-500 to-amber-600' },
    { icon: <TrendingUp size={18} />, label: t('stat.totalOt'), value: fmtTHB(summary.totalOtThb), accent: 'from-cyan-500 to-cyan-600' },
    { icon: <AlertTriangle size={18} />, label: t('stat.totalDeduction'), value: fmtTHB(summary.totalLateThb + summary.totalEarlyOutThb + summary.totalDamageThb), accent: 'from-rose-500 to-rose-600' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {items.map((it, i) => (
        <div key={i} className="stat-card relative overflow-hidden">
          <div className={`absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-br ${it.accent} opacity-10`} />
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${it.accent} text-white grid place-items-center mb-2 shadow-sm`}>
            {it.icon}
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">{it.label}</div>
          <div className="text-base sm:text-xl font-bold text-slate-900 mt-0.5 leading-tight">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
