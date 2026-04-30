import { useState } from 'react'
import { X, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { WorkerSummary, Flag, PayrollResult } from '../payroll/types'
import { fmtTHB } from '../utils/format'
import { useI18n } from '../i18n/I18n'

interface Props {
  worker: WorkerSummary
  onClose: () => void
}

const FLAG_TONES: Record<Flag, string> = {
  ABSENT: 'bg-slate-100 text-slate-700',
  NO_CHECKIN: 'bg-amber-50 text-amber-700',
  NO_CHECKOUT: 'bg-amber-50 text-amber-700',
  NEGATIVE_FLOORED: 'bg-rose-50 text-rose-700',
  DAMAGE_OFFSETS_WAGE: 'bg-rose-50 text-rose-700',
  INTERN_EXEMPT: 'bg-blue-50 text-blue-700',
  HOUSEKEEPER_EXEMPT: 'bg-blue-50 text-blue-700',
  MANUAL_CHECKIN: 'bg-violet-50 text-violet-700',
  SICK_LEAVE: 'bg-orange-50 text-orange-700',
  PERSONAL_LEAVE: 'bg-orange-50 text-orange-700',
  UNKNOWN_SHIFT: 'bg-rose-50 text-rose-700',
}

export default function WorkerDetail({ worker, onClose }: Props) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wide">{t('wd.title')}</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{worker.fullName}</h3>
            <div className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
              {worker.nickname && <span>{worker.nickname} · </span>}
              {worker.department || '—'}
              {worker.bankCode && <span> · {worker.bankCode} {worker.bankAccount}</span>}
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100">
          <Mini label={t('wd.shifts')} value={String(worker.shifts)} />
          <Mini label={t('wd.totalOt')} value={fmtTHB(worker.totalOt)} tone="text-emerald-600" />
          <Mini label={t('wd.totalDeduct')} value={fmtTHB(worker.totalLate + worker.totalEarlyOut + worker.totalDamage)} tone="text-rose-600" />
          <Mini label={t('wd.totalNet')} value={fmtTHB(worker.totalGross)} tone="text-slate-900 font-bold" />
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 flex-1">
          <h4 className="font-semibold text-sm text-slate-900 mb-3">{t('wd.daily')} ({worker.rows.length})</h4>
          <div className="space-y-2">
            {worker.rows.map((r, i) => <DayRow key={i} r={r} />)}
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-100 text-[11px] sm:text-xs text-slate-500 flex items-start gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>{t('wd.footer')}</span>
        </div>
      </div>
    </div>
  )
}

function DayRow({ r }: { r: PayrollResult }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50/40 transition">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-medium text-sm text-slate-900">{r.workDate} · <span className="text-slate-500 font-normal">{r.sheet}</span></div>
          <div className="text-xs text-slate-500 mt-0.5">
            {t('wd.shift')} {r.shiftCode || '?'} ({r.checkin || '—'} → {r.checkout || '—'})
          </div>
          {r.manualNote && <div className="text-xs text-amber-700 mt-1 italic break-words">"{r.manualNote}"</div>}
        </div>
        <div className="text-right">
          <div className="font-bold text-sm tabular-nums text-slate-900">{fmtTHB(r.grossWageThb)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {r.lateMinutesDeducted > 0 && <span className="text-rose-600">{t('wd.late')} {r.lateMinutesDeducted.toFixed(1)}{t('wd.minShort')} · </span>}
            {r.earlyOutMinutes > 0 && <span className="text-rose-600">{t('wd.early')} {r.earlyOutMinutes.toFixed(0)}{t('wd.minShort')} · </span>}
            {r.otTotalHours > 0 && <span className="text-emerald-600">OT {r.otTotalHours}h</span>}
            {r.damageThb > 0 && <span className="text-rose-600"> · damage {fmtTHB(r.damageThb)}</span>}
          </div>
        </div>
      </div>

      {r.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.flags.map(f => <span key={f} className={`pill ${FLAG_TONES[f] || 'bg-slate-100'}`}>{f.replace(/_/g, ' ').toLowerCase()}</span>)}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? t('wd.hide') : t('wd.formula')}
      </button>

      {expanded && (
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5 font-mono">
          <Calc label="U (hours bucket)" value={String(r.hoursBucketU)} />
          <Calc label="wage_per_minute" value={`${r.dailyRateThb} ÷ (${r.hoursBucketU} × 60) = ${r.wagePerMinute.toFixed(4)} ฿`} />
          {r.lateMinutesRaw > 0 && (
            <Calc label="late_deduction" value={`${r.wagePerMinute.toFixed(4)} × ${r.lateMinutesDeducted.toFixed(2)} min = ${r.lateDeductionThb.toFixed(2)} ฿${r.lateMinutesDeducted === 0 ? ' (exempt)' : ''}`} />
          )}
          {r.earlyOutMinutes > 0 && (
            <Calc label="early_out" value={`${r.wagePerMinute.toFixed(4)} × ${r.earlyOutMinutes.toFixed(0)} min = ${r.earlyOutDeductionThb.toFixed(2)} ฿`} />
          )}
          {r.otTotalHours > 0 && (
            <Calc label="OT pay" value={`(${r.dailyRateThb}/${r.hoursBucketU}) × 1.5 × ${r.otTotalHours} = ${r.otPayThb.toFixed(2)} ฿`} />
          )}
          {r.damageThb > 0 && <Calc label="damage" value={`${r.damageThb.toFixed(2)} ฿`} />}
          {r.otherDeductionThb > 0 && <Calc label="other" value={`${r.otherDeductionThb.toFixed(2)} ฿`} />}
          <div className="border-t border-slate-200 pt-1.5 mt-1.5">
            <Calc label="GROSS" value={`${r.dailyRateThb} − ${r.lateDeductionThb.toFixed(2)} − ${r.earlyOutDeductionThb.toFixed(2)} − ${r.damageThb.toFixed(2)} − ${r.otherDeductionThb.toFixed(2)} + ${r.otPayThb.toFixed(2)} = ${r.grossWageRaw.toFixed(2)} → ${r.grossWageThb.toFixed(2)} ฿`} bold />
          </div>
        </div>
      )}
    </div>
  )
}

function Calc({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-300">=</span>
      <span className="break-all">{value}</span>
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-sm sm:text-base mt-0.5 tabular-nums ${tone || 'text-slate-900 font-semibold'}`}>{value}</div>
    </div>
  )
}
