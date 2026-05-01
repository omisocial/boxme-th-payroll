import { useState } from 'react'
import { Plus, Trash2, Loader2, X, AlertTriangle, RefreshCw, Pencil } from 'lucide-react'
import { useShifts, useDepartments, type Shift, type Department } from '../../../api/useSettings'
import type { AuthUser } from '../../../auth/useAuth'

interface Props { user: AuthUser }

function ShiftsSection({ country }: { country: string }) {
  const { shifts, loading, refresh, create, update, remove } = useShifts(country)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [form, setForm] = useState({ code: '', name: '', time_range: '', is_overnight: false })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name || !form.time_range) { setErr('Code, name, and time range required'); return }
    setSaving(true); setErr(null)
    const res = editing
      ? await update(editing.id, { name: form.name, time_range: form.time_range, is_overnight: form.is_overnight })
      : await create(form)
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowCreate(false); setEditing(null); setForm({ code: '', name: '', time_range: '', is_overnight: false })
  }

  function startEdit(s: Shift) {
    setEditing(s); setForm({ code: s.code, name: s.name, time_range: s.time_range, is_overnight: s.is_overnight }); setErr(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Shifts</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={refresh}><RefreshCw size={12} /></button>
          <button className="btn-primary text-xs" onClick={() => { setShowCreate(true); setForm({ code: '', name: '', time_range: '', is_overnight: false }); setErr(null) }}>
            <Plus size={13} /> Add Shift
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-400" /></div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-3 py-2.5 text-left">Code</th>
              <th className="px-3 py-2.5 text-left">Name</th>
              <th className="px-3 py-2.5 text-left">Time Range</th>
              <th className="px-3 py-2.5 text-left">Overnight</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shifts.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{s.code}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">{s.name}</td>
                <td className="px-3 py-2.5 text-slate-600 text-xs">{s.time_range}</td>
                <td className="px-3 py-2.5">{s.is_overnight ? <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Yes</span> : <span className="text-xs text-slate-400">No</span>}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400" onClick={() => startEdit(s)}><Pencil size={12} /></button>
                    <button className="p-1 hover:bg-rose-50 rounded text-rose-400" onClick={() => remove(s.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && !loading && <tr><td colSpan={5} className="px-3 py-5 text-center text-slate-400 text-sm">No shifts yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">{editing ? 'Edit Shift' : 'Add Shift'}</h2>
              <button onClick={() => { setShowCreate(false); setEditing(null) }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Code *</div>
                  <input className="input w-full" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="MORNING" disabled={!!editing} />
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Name *</div>
                  <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Morning" />
                </label>
              </div>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Time Range *</div>
                <input className="input w-full" value={form.time_range} onChange={e => setForm(f => ({ ...f, time_range: e.target.value }))} placeholder="08:30 - 17:30" />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_overnight} onChange={e => setForm(f => ({ ...f, is_overnight: e.target.checked }))} />
                <span className="text-sm text-slate-700">Overnight shift</span>
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

function DepartmentsSection({ country }: { country: string }) {
  const { departments, loading, refresh, create, update, remove } = useDepartments(country)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState({ code: '', name_local: '', name_en: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name_local) { setErr('Code and local name required'); return }
    setSaving(true); setErr(null)
    const res = editing
      ? await update(editing.id, { name_local: form.name_local, name_en: form.name_en || undefined })
      : await create({ code: form.code, name_local: form.name_local, name_en: form.name_en || undefined })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowCreate(false); setEditing(null); setForm({ code: '', name_local: '', name_en: '' })
  }

  function startEdit(d: Department) {
    setEditing(d); setForm({ code: d.code, name_local: d.name_local, name_en: d.name_en ?? '' }); setErr(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Departments</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={refresh}><RefreshCw size={12} /></button>
          <button className="btn-primary text-xs" onClick={() => { setShowCreate(true); setForm({ code: '', name_local: '', name_en: '' }); setErr(null) }}>
            <Plus size={13} /> Add Dept
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-400" /></div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-3 py-2.5 text-left">Code</th>
              <th className="px-3 py-2.5 text-left">Name (Local)</th>
              <th className="px-3 py-2.5 text-left">Name (EN)</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{d.code}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">{d.name_local}</td>
                <td className="px-3 py-2.5 text-slate-600">{d.name_en ?? '—'}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400" onClick={() => startEdit(d)}><Pencil size={12} /></button>
                    <button className="p-1 hover:bg-rose-50 rounded text-rose-400" onClick={() => remove(d.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && !loading && <tr><td colSpan={4} className="px-3 py-5 text-center text-slate-400 text-sm">No departments yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">{editing ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => { setShowCreate(false); setEditing(null) }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Code *</div>
                <input className="input w-full" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="BM1" disabled={!!editing} />
              </label>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Local Name *</div>
                <input className="input w-full" value={form.name_local} onChange={e => setForm(f => ({ ...f, name_local: e.target.value }))} />
              </label>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">English Name</div>
                <input className="input w-full" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
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

export default function ShiftsTab({ user }: Props) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope

  return (
    <div className="space-y-6">
      <ShiftsSection country={country} />
      <DepartmentsSection country={country} />
    </div>
  )
}
