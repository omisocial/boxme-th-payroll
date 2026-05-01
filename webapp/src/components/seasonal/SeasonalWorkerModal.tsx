import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { useWarehouses } from '../../api/usePeriods'
import type { Worker } from '../../api/useWorkers'

interface Props {
  worker: Partial<Worker> | null
  country: string
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
}

export default function SeasonalWorkerModal({ worker, country, onClose, onSave }: Props) {
  const warehouses = useWarehouses(country)
  const isNew = !worker?.id

  const [form, setForm] = useState({
    code: worker?.code ?? '',
    name_local: worker?.name_local ?? '',
    name_en: worker?.name_en ?? '',
    department_code: worker?.department_code ?? '',
    shift_code: worker?.shift_code ?? '',
    bank_code: worker?.bank_code ?? '',
    bank_account: worker?.bank_account ?? '',
    phone: worker?.phone ?? '',
    start_date: worker?.start_date ?? '',
    end_date: worker?.end_date ?? '',
    status: worker?.status ?? 'active',
    warehouse_id: worker?.warehouse_id ?? '',
    notes: worker?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.name_local.trim()) { setErr('Code and name are required'); return }
    if (isNew && !form.warehouse_id) { setErr('Warehouse is required'); return }
    if (form.end_date && form.start_date && form.end_date <= form.start_date) {
      setErr('End date must be after start date')
      return
    }

    setSaving(true)
    setErr(null)

    const payload: Record<string, unknown> = {
      code: form.code,
      name_local: form.name_local,
      name_en: form.name_en || undefined,
      department_code: form.department_code || undefined,
      shift_code: form.shift_code || undefined,
      bank_code: form.bank_code || undefined,
      bank_account: form.bank_account || undefined,
      phone: form.phone || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      status: form.status,
      notes: form.notes || undefined,
    }

    if (isNew) {
      payload.warehouseId = form.warehouse_id
      payload.nameLocal = form.name_local
    }

    const res = await onSave(payload)
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed to save'); return }
    onClose()
  }

  function field(val: string, key: keyof typeof form) {
    setForm(f => ({ ...f, [key]: val }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            {isNew ? 'Add Seasonal Worker' : 'Edit Seasonal Worker'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Employee Code *</div>
              <input className="input w-full" value={form.code} onChange={e => field(e.target.value, 'code')} placeholder="SV001" />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <select className="input w-full" value={form.status} onChange={e => field(e.target.value, 'status')}>
                <option value="active">Active</option>
                <option value="resigned">Resigned</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>

          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Full Name (Thai) *</div>
            <input className="input w-full" value={form.name_local} onChange={e => field(e.target.value, 'name_local')} />
          </label>

          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Full Name (English)</div>
            <input className="input w-full" value={form.name_en} onChange={e => field(e.target.value, 'name_en')} />
          </label>

          {isNew && warehouses.length > 0 && (
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Warehouse *</div>
              <select className="input w-full" value={form.warehouse_id} onChange={e => field(e.target.value, 'warehouse_id')}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Department</div>
              <input className="input w-full" value={form.department_code} onChange={e => field(e.target.value, 'department_code')} placeholder="BM1" />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Shift</div>
              <input className="input w-full" value={form.shift_code} onChange={e => field(e.target.value, 'shift_code')} placeholder="MORNING" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Start Date</div>
              <input type="date" className="input w-full" value={form.start_date} onChange={e => field(e.target.value, 'start_date')} />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">End Date (Contract)</div>
              <input type="date" className="input w-full" value={form.end_date} onChange={e => field(e.target.value, 'end_date')} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Bank Code</div>
              <input className="input w-full" value={form.bank_code} onChange={e => field(e.target.value, 'bank_code')} placeholder="K-BANK" />
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Bank Account</div>
              <input className="input w-full" value={form.bank_account} onChange={e => field(e.target.value, 'bank_account')} />
            </label>
          </div>

          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Phone</div>
            <input className="input w-full" value={form.phone} onChange={e => field(e.target.value, 'phone')} />
          </label>

          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Notes</div>
            <textarea className="input w-full text-sm" rows={2} value={form.notes} onChange={e => field(e.target.value, 'notes')} />
          </label>

          {err && (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <AlertTriangle size={12} /> {err}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : (isNew ? 'Add Worker' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
