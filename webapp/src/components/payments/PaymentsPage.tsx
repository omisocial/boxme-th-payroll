import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Search, Wallet, Users, AlertTriangle, Undo2 } from 'lucide-react'
import { usePeriods } from '../../api/usePeriods'
import { usePayments, type PaymentLine } from '../../api/usePayments'
import { useWarehouse } from '../../context/WarehouseContext'
import type { AuthUser } from '../../auth/useAuth'
import { useI18n } from '../../i18n/I18n'

interface Props {
  user: AuthUser
}

function fmtMoney(n: number, sym: string) {
  return `${sym} ${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function PaymentsPage({ user }: Props) {
  const { t } = useI18n()
  const { current } = useWarehouse()
  const country = current?.countryCode ?? 'TH'
  const sym = current?.currencySymbol ?? '฿'
  const { periods, loading: periodsLoading } = usePeriods(country)

  const [periodId, setPeriodId] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'SEASONAL' | 'REGULAR'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const effectivePeriodId = periodId || periods[0]?.id || ''
  const { lines, loading, statusFilter, setStatusFilter, q, setQ, setBulkStatus, setOneStatus } =
    usePayments(effectivePeriodId || null)

  const selectedPeriod = useMemo(
    () => periods.find(p => p.id === effectivePeriodId),
    [periods, effectivePeriodId]
  )

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return lines
    return lines.filter(l => (l.workers?.job_type_code ?? 'SEASONAL') === typeFilter)
  }, [lines, typeFilter])

  const totals = useMemo(() => {
    let gross = 0
    let net = 0
    let unpaid = 0
    let paid = 0
    let unpaidNet = 0
    for (const l of filtered) {
      gross += l.total_gross_thb || 0
      net += l.net_pay_thb || 0
      if (l.payment_status === 'paid') paid++
      else {
        unpaid++
        unpaidNet += l.net_pay_thb || 0
      }
    }
    return { gross, net, unpaid, paid, unpaidNet, count: filtered.length }
  }, [filtered])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(l => l.id)))
  }

  async function bulk(status: 'unpaid' | 'paid') {
    if (selected.size === 0) return
    setBusy(true)
    const res = await setBulkStatus(Array.from(selected), status)
    setBusy(false)
    if (res.success) {
      setToast(`${t('pay.selected').replace('{n}', String(selected.size))}: ${status === 'paid' ? t('pay.statusPaid') : t('pay.statusUnpaid')}`)
      setSelected(new Set())
      setTimeout(() => setToast(null), 3000)
    } else {
      setToast(`${res.message ?? 'failed'}`)
      setTimeout(() => setToast(null), 4000)
    }
  }

  async function toggleOne(line: PaymentLine) {
    setBusy(true)
    const next = line.payment_status === 'paid' ? 'unpaid' : 'paid'
    await setOneStatus(line.id, next)
    setBusy(false)
  }

  const isHr = user.role === 'super_admin' || user.role === 'country_admin' || user.role === 'hr'

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={18} /> {t('pay.loading')}
      </div>
    )
  }

  if (periods.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Wallet className="mx-auto text-slate-300" size={36} />
        <h3 className="mt-3 font-semibold text-slate-700">{t('pay.noPeriod')}</h3>
        <p className="text-sm text-slate-500 mt-1">{t('pay.noPeriodHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <select
          value={effectivePeriodId}
          onChange={e => {
            setPeriodId(e.target.value)
            setSelected(new Set())
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          {periods.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.from_date} → {p.to_date} · {p.status}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value as 'all' | 'unpaid' | 'paid')
            setSelected(new Set())
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="all">{t('pay.statusAll')}</option>
          <option value="unpaid">{t('pay.statusUnpaid')}</option>
          <option value="paid">{t('pay.statusPaid')}</option>
        </select>

        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value as typeof typeFilter)
            setSelected(new Set())
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="all">{t('pay.typeAll')}</option>
          <option value="SEASONAL">{t('pay.typeSeasonal')}</option>
          <option value="REGULAR">{t('pay.typeRegular')}</option>
        </select>

        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('pay.search')}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="text-xs text-slate-500 ml-auto">
          {selectedPeriod?.status === 'open' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700">
              <AlertTriangle size={12} /> {t('pay.openWarning')}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label={t('pay.statCount')} value={String(totals.count)} icon={<Users size={14} />} />
        <StatBox label={t('pay.statNet')} value={fmtMoney(totals.net, sym)} />
        <StatBox label={t('pay.statPaid')} value={String(totals.paid)} tone="emerald" />
        <StatBox label={t('pay.statUnpaid')} value={`${totals.unpaid} · ${fmtMoney(totals.unpaidNet, sym)}`} tone="amber" />
      </div>

      {/* Bulk toolbar */}
      {isHr && selected.size > 0 && (
        <div className="card p-3 bg-blue-50/60 border-blue-200 flex items-center gap-3 sticky top-[125px] z-10">
          <span className="text-sm text-blue-900 font-medium">{t('pay.selected').replace('{n}', String(selected.size))}</span>
          <button
            onClick={() => bulk('paid')}
            disabled={busy}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {t('pay.markPaid')}
          </button>
          <button
            onClick={() => bulk('unpaid')}
            disabled={busy}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Undo2 size={14} /> {t('pay.markUnpaid')}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-600 ml-auto">
            {t('pay.deselect')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={18} /> {t('common.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">{t('pay.noRows')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs text-slate-600">
                {isHr && (
                  <th className="px-3 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                <th className="text-left px-3 py-2 font-medium">{t('pay.colName')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('pay.colType')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('pay.colShifts')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('pay.colGross')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('pay.colDeduct')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('pay.colNet')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('pay.colStatus')}</th>
                {isHr && <th className="text-right px-3 py-2 font-medium">{t('pay.colAction')}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const deduct = (l.total_late_thb || 0) + (l.total_damage_thb || 0)
                const isPaid = l.payment_status === 'paid'
                const jobType = l.workers?.job_type_code ?? 'SEASONAL'
                return (
                  <tr key={l.id} className={`border-t hover:bg-slate-50/60 ${isPaid ? 'bg-emerald-50/30' : ''}`}>
                    {isHr && (
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(l.id)}
                          onChange={() => toggle(l.id)}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 font-medium text-slate-800">{l.full_name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        jobType === 'SEASONAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {jobType === 'SEASONAL' ? t('pay.typeSeasonal') : t('pay.typeRegular')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.shifts}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(l.total_gross_thb, sym)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-rose-600">{deduct > 0 ? `-${fmtMoney(deduct, sym)}` : '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtMoney(l.net_pay_thb, sym)}</td>
                    <td className="px-3 py-2">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                          <CheckCircle2 size={12} />
                          {t('pay.statusPaid')}
                          {l.paid_at && <span className="text-slate-400 ml-1">{new Date(l.paid_at).toLocaleDateString()}</span>}
                        </span>
                      ) : (
                        <span className="text-amber-700 text-xs">{t('pay.statusUnpaid')}</span>
                      )}
                    </td>
                    {isHr && (
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => toggleOne(l)}
                          disabled={busy}
                          className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-600"
                        >
                          {isPaid ? t('pay.toggleUnpaid') : t('pay.togglePaid')}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, icon, tone }: { label: string; value: string; icon?: React.ReactNode; tone?: 'emerald' | 'amber' }) {
  const toneClass = tone === 'emerald'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : tone === 'amber'
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-white border-slate-200 text-slate-800'
  return (
    <div className={`card p-3 border ${toneClass}`}>
      <div className="text-xs opacity-70 flex items-center gap-1">{icon} {label}</div>
      <div className="text-xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  )
}
