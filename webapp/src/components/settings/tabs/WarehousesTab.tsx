import { useState } from 'react'
import { Plus, Trash2, Loader2, X, AlertTriangle, RefreshCw, Pencil } from 'lucide-react'
import { useWarehouses, type Warehouse } from '../../../api/useSettings'
import type { AuthUser } from '../../../auth/useAuth'

interface Props { user: AuthUser }

export default function WarehousesTab({ user }: Props) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope
  const { warehouses, loading, refresh, create, update, remove } = useWarehouses(country)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [form, setForm] = useState({ code: '', name: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name) { setErr('Code and name required'); return }
    setSaving(true); setErr(null)
    const res = await create({ code: form.code, name: form.name })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowCreate(false); setForm({ code: '', name: '' })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !form.name) { setErr('Name required'); return }
    setSaving(true); setErr(null)
    const res = await update(editing.id, { name: form.name, code: form.code })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setEditing(null); setForm({ code: '', name: '' })
  }

  function startEdit(w: Warehouse) {
    setEditing(w); setForm({ code: w.code, name: w.name }); setErr(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{warehouses.length} warehouses</span>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={refresh}><RefreshCw size={13} /></button>
          <button className="btn-primary text-sm" onClick={() => { setShowCreate(true); setErr(null); setForm({ code: '', name: '' }) }}>
            <Plus size={14} /> Add Warehouse
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-slate-400" /></div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map(w => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{w.code}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{w.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${w.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {w.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400" onClick={() => startEdit(w)}><Pencil size={13} /></button>
                    <button className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400" onClick={() => remove(w.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {warehouses.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">No warehouses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">{editing ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
              <button onClick={() => { setShowCreate(false); setEditing(null) }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-3">
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Code *</div>
                <input className="input w-full" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="TH-BKK-3" />
              </label>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Name *</div>
                <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bangkhen Warehouse 3" />
              </label>
              {err && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : (editing ? 'Save' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
