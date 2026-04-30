import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import type { WorkerSummary } from '../payroll/types'
import { fmtTHB, fmtNum } from '../utils/format'
import { useI18n } from '../i18n/I18n'

interface Props {
  workers: WorkerSummary[]
  onSelect: (w: WorkerSummary) => void
}

export default function WorkerTable({ workers, onSelect }: Props) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState<string>('ALL')

  const departments = useMemo(() => {
    const s = new Set<string>()
    workers.forEach(w => w.department && s.add(w.department))
    return ['ALL', ...Array.from(s).sort()]
  }, [workers])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return workers.filter(w => {
      if (dept !== 'ALL' && w.department !== dept) return false
      if (!ql) return true
      return w.fullName.toLowerCase().includes(ql) ||
        (w.nickname || '').toLowerCase().includes(ql) ||
        (w.bankAccount || '').includes(ql)
    })
  }, [workers, q, dept])

  return (
    <div className="card overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">{t('wt.title')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.length} {t('wt.count')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('wt.search')}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select
            value={dept}
            onChange={e => setDept(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 max-w-[40%] sm:max-w-none"
          >
            {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? t('wt.allDept') : d}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60">
            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-2.5">{t('wt.fullName')}</th>
              <th className="px-4 py-2.5">{t('wt.dept')}</th>
              <th className="px-4 py-2.5 text-right">{t('wt.shifts')}</th>
              <th className="px-4 py-2.5 text-right">{t('wt.deductLateEarly')}</th>
              <th className="px-4 py-2.5 text-right">{t('wt.damage')}</th>
              <th className="px-4 py-2.5 text-right">{t('wt.ot')}</th>
              <th className="px-4 py-2.5 text-right">{t('wt.totalGross')}</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.fullName} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => onSelect(w)}>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900">{w.fullName}</div>
                  <div className="text-xs text-slate-500">{w.nickname || '—'}</div>
                </td>
                <td className="px-4 py-2.5"><span className="pill bg-slate-100 text-slate-700">{w.department || '—'}</span></td>
                <td className="px-4 py-2.5 text-right tabular-nums">{w.shifts}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-rose-600">{fmtTHB(w.totalLate + w.totalEarlyOut)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-rose-600">{fmtTHB(w.totalDamage)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{fmtTHB(w.totalOt)}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtTHB(w.totalGross)}</td>
                <td className="px-4 py-2.5 text-slate-400"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map(w => (
          <button key={w.fullName} onClick={() => onSelect(w)} className="w-full text-left p-3.5 hover:bg-slate-50 active:bg-slate-100 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{w.fullName}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="pill bg-slate-100 text-slate-700">{w.department || '—'}</span>
                  <span>· {w.nickname || '—'}</span>
                  <span>· {fmtNum(w.shifts)} {t('wt.shifts')}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-slate-900 tabular-nums">{fmtTHB(w.totalGross)}</div>
                {w.totalOt > 0 && <div className="text-xs text-emerald-600 tabular-nums mt-0.5">+{fmtTHB(w.totalOt)} OT</div>}
                {(w.totalLate + w.totalEarlyOut + w.totalDamage) > 0 && (
                  <div className="text-xs text-rose-600 tabular-nums mt-0.5">−{fmtTHB(w.totalLate + w.totalEarlyOut + w.totalDamage)}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-sm text-slate-500">{t('wt.empty')}</div>
      )}
    </div>
  )
}
