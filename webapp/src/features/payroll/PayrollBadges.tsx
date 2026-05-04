import { AlertTriangle, UserPlus, Clock, CheckCircle2 } from 'lucide-react'
import type { PayrollResult, WorkerSummary, Member } from '../../payroll/types'
import { useI18n } from '../../i18n/I18n'

interface Props {
  rows: PayrollResult[]
  workers: WorkerSummary[]
  members: Member[]
  currencySymbol: string
  onOpenPendingWorkers?: () => void
  onOpenBulkFix?: (pendingNames: string[]) => void
}

const OT_OUTLIER_HOURS = 4

export default function PayrollBadges({ rows, workers, members, currencySymbol, onOpenPendingWorkers, onOpenBulkFix }: Props) {
  const { t } = useI18n()
  // 1. Workers seen in attendance but not in Members sheet → "pending update" (Phase 2 will sync to DB)
  const memberNames = new Set(members.map(m => m.fullName.trim().toLowerCase()).filter(Boolean))
  const pendingNames = new Set<string>()
  for (const w of workers) {
    const key = w.fullName.trim().toLowerCase()
    if (key && !memberNames.has(key)) pendingNames.add(w.fullName)
  }
  const pendingCount = pendingNames.size

  // 2. OT outliers
  const otOutlierCount = rows.filter(r => r.otTotalHours > OT_OUTLIER_HOURS).length

  // 3. Totals
  const totalGross = workers.reduce((s, w) => s + w.totalGross, 0)
  const totalShifts = workers.reduce((s, w) => s + w.shifts, 0)
  const grossText = `${currencySymbol} ${totalGross.toLocaleString()}`

  if (pendingCount === 0 && otOutlierCount === 0) {
    return (
      <div className="card p-3 bg-emerald-50/50 border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
        <CheckCircle2 size={16} className="shrink-0" />
        <span>{totalShifts} shifts computed · Total gross: <strong>{grossText}</strong></span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pendingCount > 0 && (
        <div className="card p-3 bg-amber-50/50 border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <UserPlus size={16} className="shrink-0" />
            <span>
              {t('badge.pendingWorkers').replace('{n}', String(pendingCount))}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {onOpenBulkFix && (
              <button
                onClick={() => onOpenBulkFix(Array.from(pendingNames))}
                className="btn-primary text-xs whitespace-nowrap"
              >
                {t('badge.bulkUpdate')}
              </button>
            )}
            {onOpenPendingWorkers && (
              <button onClick={onOpenPendingWorkers} className="btn-secondary text-xs whitespace-nowrap">
                {t('badge.openWorkers')}
              </button>
            )}
          </div>
        </div>
      )}
      {otOutlierCount > 0 && (
        <div className="card p-3 bg-orange-50/50 border-orange-200 flex items-center gap-2 text-orange-800 text-sm">
          <Clock size={16} className="shrink-0" />
          <span>
            {t('badge.otOutlier').replace('{n}', String(otOutlierCount))}
          </span>
        </div>
      )}
      <div className="card p-3 bg-slate-50 border-slate-200 flex items-center gap-2 text-slate-700 text-sm">
        <AlertTriangle size={16} className="shrink-0 text-slate-400" />
        <span>{totalShifts} shifts · Total gross: <strong>{grossText}</strong></span>
      </div>
    </div>
  )
}
