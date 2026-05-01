import { useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X, Trash2 } from 'lucide-react'
import { useWorkers, type Worker } from '../../api/useWorkers'
import { useWarehouses } from '../../api/usePeriods'
import { useWarehouse } from '../../context/WarehouseContext'
import type { AuthUser } from '../../auth/useAuth'

interface Props {
  user: AuthUser
}

function WorkerModal({
  worker,
  country,
  onClose,
  onSave,
}: {
  worker: Partial<Worker> | null
  country: string
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
}) {
  const warehouses = useWarehouses(country)
  const isNew = !worker?.id
  const [form, setForm] = useState<Record<string, string>>({
    code: worker?.code ?? '',
    name_local: worker?.name_local ?? '',
    name_en: worker?.name_en ?? '',
    department_code: worker?.department_code ?? '',
    shift_code: worker?.shift_code ?? '',
    job_type_code: worker?.job_type_code ?? 'GENERAL',
    bank_code: worker?.bank_code ?? '',
    bank_account: worker?.bank_account ?? '',
    phone: worker?.phone ?? '',
    start_date: worker?.start_date ?? '',
    status: worker?.status ?? 'active',
    warehouse_id: worker?.warehouse_id ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name_local) { setErr('Code and name are required'); return }
    if (isNew && !form.warehouse_id) { setErr('Warehouse is required'); return }
    setSaving(true)
    const payload: Record<string, unknown> = { ...form }
    if (isNew) {
      payload.warehouseId = form.warehouse_id
      payload.nameLocal = form.name_local
    }
    const res = await onSave(payload)
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">{isNew ? 'Add Worker' : 'Edit Worker'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Employee Code *</div>
              <input className="input w-full" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="EMP001" />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <select className="input w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </select>
            </label>
          </div>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Full Name (Thai) *</div>
            <input className="input w-full" value={form.name_local} onChange={e => setForm(f => ({ ...f, name_local: e.target.value }))} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Full Name (English)</div>
            <input className="input w-full" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
          </label>
          {isNew && warehouses.length > 0 && (
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Warehouse *</div>
              <select className="input w-full" value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Department</div>
              <input className="input w-full" value={form.department_code} onChange={e => setForm(f => ({ ...f, department_code: e.target.value }))} />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Job Type</div>
              <select className="input w-full" value={form.job_type_code} onChange={e => setForm(f => ({ ...f, job_type_code: e.target.value }))}>
                <option value="GENERAL">GENERAL</option>
                <option value="SEASONAL">SEASONAL</option>
                <option value="PART_TIME">PART_TIME</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Bank Code</div>
              <input className="input w-full" value={form.bank_code} onChange={e => setForm(f => ({ ...f, bank_code: e.target.value }))} placeholder="K-BANK" />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Bank Account</div>
              <input className="input w-full" value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Phone</div>
              <input className="input w-full" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Start Date</div>
              <input type="date" className="input w-full" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </label>
          </div>
          {err && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : (isNew ? 'Add Worker' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WorkersPage({ user }: Props) {
  const { current: warehouse } = useWarehouse()
  const country = warehouse?.countryCode ?? (user.country_scope === '*' ? 'TH' : user.country_scope)
  const { workers, total, loading, q, setQ, status, setStatus, page, setPage, createWorker, updateWorker, deleteWorker } = useWorkers(country, warehouse?.id)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; worker: Partial<Worker> | null } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Worker | null>(null)

  const canHr = ['super_admin', 'country_admin', 'hr'].includes(user.role)
  const limit = 50

  async function handleSave(data: Record<string, unknown>) {
    if (modal?.mode === 'create') {
      return createWorker(data as Parameters<typeof createWorker>[0])
    } else if (modal?.worker?.id) {
      return updateWorker(modal.worker.id, data)
    }
    return { success: false, message: 'Unknown mode' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Workers</h2>
        {canHr && (
          <button className="btn-primary text-sm" onClick={() => setModal({ mode: 'create', worker: null })}>
            <Plus size={14} /> Add Worker
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'all', label: 'All' },
          { id: 'pending_update', label: 'Chờ cập nhật', tone: 'amber' as const },
          { id: 'active', label: 'Active' },
          { id: 'resigned', label: 'Resigned' },
          { id: 'inactive', label: 'Inactive' },
        ]).map(chip => {
          const active = status === chip.id
          const amber = chip.tone === 'amber'
          return (
            <button
              key={chip.id}
              onClick={() => { setStatus(chip.id); setPage(1) }}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                active
                  ? amber
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-blue-600 border-blue-600 text-white'
                  : amber
                    ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {chip.label}
              {chip.id === 'pending_update' && status === 'pending_update' && total > 0 ? ` (${total})` : ''}
            </button>
          )
        })}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8 w-56 text-sm"
            placeholder="Search name / code..."
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>}

      {!loading && workers.length === 0 && (
        <div className="card p-8 text-center text-slate-500 text-sm">No workers found.</div>
      )}

      {workers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Dept</th>
                  <th className="px-4 py-3 text-left">Bank</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {canHr && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{w.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{w.name_local}</div>
                      {w.name_en && <div className="text-xs text-slate-400">{w.name_en}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.department_code ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {w.bank_code ? `${w.bank_code} ${w.bank_account ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        w.status === 'active' ? 'bg-green-100 text-green-700'
                          : w.status === 'pending_update' ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {w.status === 'pending_update' ? 'Chờ cập nhật' : w.status}
                      </span>
                    </td>
                    {canHr && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                            onClick={() => setModal({ mode: 'edit', worker: w })}
                          >Edit</button>
                          <button
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400"
                            onClick={() => setConfirmDelete(w)}
                          ><Trash2 size={13} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{total} workers</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <span>Page {page} of {Math.ceil(total / limit)}</span>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <WorkerModal
          worker={modal.mode === 'edit' ? modal.worker : null}
          country={country}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2">Remove Worker?</h2>
            <p className="text-sm text-slate-600 mb-4">
              This will soft-delete <strong>{confirmDelete.name_local}</strong> and mark them as resigned. The record is preserved for payroll history.
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition flex items-center justify-center gap-1.5"
                onClick={async () => {
                  await deleteWorker(confirmDelete.id)
                  setConfirmDelete(null)
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
