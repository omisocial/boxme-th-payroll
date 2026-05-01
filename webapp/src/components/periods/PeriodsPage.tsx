import { useState } from 'react'
import { Plus, Lock, CheckCircle2, Download, RefreshCw, ChevronRight, X, AlertTriangle, Loader2 } from 'lucide-react'
import { usePeriods, usePeriodSummary, usePeriodExports, useWarehouses, type Period } from '../../api/usePeriods'
import type { AuthUser } from '../../auth/useAuth'

interface Props {
  user: AuthUser
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open:     { label: 'Open',     cls: 'bg-blue-100 text-blue-700' },
  locked:   { label: 'Locked',   cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  exported: { label: 'Exported', cls: 'bg-slate-100 text-slate-600' },
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
  )
}

function CreatePeriodModal({ onClose, onCreated, country }: { onClose: () => void; onCreated: () => void; country: string }) {
  const warehouses = useWarehouses(country)
  const { createPeriod } = usePeriods(country)
  const [form, setForm] = useState({
    name: '',
    fromDate: '',
    toDate: '',
    warehouseId: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.fromDate || !form.toDate) { setErr('Name, start date, and end date are required'); return }
    setSaving(true)
    const res = await createPeriod({
      name: form.name,
      fromDate: form.fromDate,
      toDate: form.toDate,
      warehouseId: form.warehouseId || undefined,
      country,
    })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Create Payroll Period</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Period Name *</div>
            <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. April 2026" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Start Date *</div>
              <input type="date" className="input w-full" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">End Date *</div>
              <input type="date" className="input w-full" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
            </label>
          </div>
          {warehouses.length > 0 && (
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Warehouse (optional)</div>
              <select className="input w-full" value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}>
                <option value="">All warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
          )}
          {err && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PeriodDetail({ period, user, onBack, onRefresh }: { period: Period; user: AuthUser; onBack: () => void; onRefresh: () => void }) {
  const { stats, loading: statsLoading, refresh: refreshStats } = usePeriodSummary(period.id)
  const { exports, refresh: refreshExports } = usePeriodExports(period.id)
  const { lockPeriod, approvePeriod, exportPeriod } = usePeriods(period.country_code)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const canAdmin = user.role === 'super_admin' || user.role === 'country_admin'
  const canHr = canAdmin || user.role === 'hr'

  async function doAction(label: string, fn: () => Promise<{ success: boolean; message?: string }>) {
    setBusy(label)
    setErr(null)
    const res = await fn()
    if (!res.success) setErr(res.message ?? `${label} failed`)
    else { onRefresh(); refreshStats(); refreshExports() }
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="btn-secondary text-xs">← Back</button>
        <h2 className="text-base font-semibold text-slate-900">{period.name}</h2>
        <StatusBadge status={period.status} />
      </div>

      <div className="card p-4 text-sm text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><div className="text-xs text-slate-400 mb-0.5">Period</div>{period.from_date} – {period.to_date}</div>
        <div><div className="text-xs text-slate-400 mb-0.5">Country</div>{period.country_code}</div>
        {period.locked_by && <div><div className="text-xs text-slate-400 mb-0.5">Locked by</div>{period.locked_by}</div>}
        {period.approved_by && <div><div className="text-xs text-slate-400 mb-0.5">Approved by</div>{period.approved_by}</div>}
      </div>

      {/* Stats */}
      {statsLoading && <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-slate-400" /></div>}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Workers', value: String(stats.worker_count) },
            { label: 'Total Shifts', value: String(stats.total_shifts) },
            { label: 'Gross Pay', value: `฿${fmt(stats.total_gross)}` },
            { label: 'Net Pay', value: `฿${fmt(stats.total_net)}` },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-lg font-semibold text-slate-900 mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {err && (
        <div className="card p-3 bg-rose-50 border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle size={14} />{err}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {period.status === 'open' && canHr && (
          <button
            className="btn-primary text-sm"
            disabled={busy !== null}
            onClick={() => doAction('Lock', () => lockPeriod(period.id))}
          >
            {busy === 'Lock' ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Lock Period
          </button>
        )}
        {period.status === 'locked' && canAdmin && (
          <button
            className="btn-primary text-sm"
            disabled={busy !== null}
            onClick={() => doAction('Approve', () => approvePeriod(period.id))}
          >
            {busy === 'Approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve
          </button>
        )}
        {period.status === 'approved' && canHr && (
          <button
            className="btn-primary text-sm"
            disabled={busy !== null}
            onClick={() => doAction('Export', () => exportPeriod(period.id))}
          >
            {busy === 'Export' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export Bank CSV
          </button>
        )}
        <button className="btn-secondary text-sm" onClick={() => { refreshStats(); refreshExports() }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Exports list */}
      {exports.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-xs font-medium text-slate-600 uppercase tracking-wide">Exports</div>
          <div className="divide-y divide-slate-100">
            {exports.map(exp => (
              <div key={exp.id} className="px-4 py-3 flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium text-slate-800">{exp.filename}</div>
                  <div className="text-xs text-slate-400">{exp.bank_code} · {exp.row_count} rows · ฿{fmt(exp.total_thb)} · {exp.created_at.slice(0, 10)}</div>
                </div>
                <a
                  href={`/api/periods/exports/${exp.id}/download`}
                  className="btn-secondary text-xs shrink-0"
                >
                  <Download size={12} /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PeriodsPage({ user }: Props) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope
  const { periods, loading, error, refresh } = usePeriods(country)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Period | null>(null)

  const canHr = ['super_admin', 'country_admin', 'hr'].includes(user.role)

  if (selected) {
    return (
      <PeriodDetail
        period={selected}
        user={user}
        onBack={() => setSelected(null)}
        onRefresh={refresh}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Payroll Periods</h2>
        {canHr && (
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Period
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
      )}

      {error && (
        <div className="card p-4 bg-rose-50 border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle size={14} />{error}
        </div>
      )}

      {!loading && periods.length === 0 && !error && (
        <div className="card p-8 text-center text-slate-500">
          <div className="text-slate-300 mb-2"><RefreshCw size={32} className="mx-auto" /></div>
          <p className="text-sm">No payroll periods yet. Create one to get started.</p>
        </div>
      )}

      {periods.length > 0 && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {periods.map(p => (
              <button
                key={p.id}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
                onClick={() => setSelected(p)}
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.from_date} – {p.to_date} · {p.country_code}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={p.status} />
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreatePeriodModal
          country={country}
          onClose={() => setShowCreate(false)}
          onCreated={refresh}
        />
      )}
    </div>
  )
}
