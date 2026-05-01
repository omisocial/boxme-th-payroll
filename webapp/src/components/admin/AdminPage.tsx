import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, AlertTriangle, X, RefreshCw } from 'lucide-react'
import type { AuthUser } from '../../auth/useAuth'

interface Props {
  user: AuthUser
}

interface AppUser {
  id: string
  email: string
  role: string
  country_scope: string
  warehouse_id: string | null
  status: string
  created_at: string
}

interface RateConfig {
  id: string
  country_code: string
  department: string | null
  effective_from: string
  effective_to: string | null
  base_daily: number
  ot_multiplier: number
  meal_allowance: number
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; message?: string; tempPassword?: string }> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  country_admin: 'Country Admin',
  hr: 'HR',
  supervisor: 'Supervisor',
  viewer: 'Viewer',
}

function UsersTab({ user }: { user: AuthUser }) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newUserResult, setNewUserResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [form, setForm] = useState({ email: '', role: 'hr', countryScope: user.country_scope === '*' ? 'TH' : user.country_scope })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    const json = await apiFetch<AppUser[]>('/api/admin/users')
    if (json.success && json.data) setUsers(json.data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json() as { success: boolean; data?: AppUser & { tempPassword?: string }; message?: string }
    setSaving(false)
    if (!json.success) { setErr(json.message ?? 'Failed'); return }
    setShowCreate(false)
    setNewUserResult({ email: form.email, tempPassword: json.data?.tempPassword ?? '' })
    refresh()
  }

  async function toggleStatus(u: AppUser) {
    const newStatus = u.status === 'active' ? 'suspended' : 'active'
    await apiFetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{users.length} users</span>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={refresh}><RefreshCw size={13} /></button>
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add User</button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-slate-400" /></div>}

      {newUserResult && (
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">User created: {newUserResult.email}</p>
              <p className="text-xs text-green-700 mt-1">Temporary password: <code className="font-mono bg-green-100 px-1 py-0.5 rounded">{newUserResult.tempPassword}</code></p>
              <p className="text-xs text-green-600 mt-1">Share this password securely. The user must change it on first login.</p>
            </div>
            <button onClick={() => setNewUserResult(null)} className="p-1 hover:bg-green-100 rounded"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-900">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="px-4 py-3 text-slate-600">{u.country_scope}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== user.id && (
                      <button
                        className="text-xs btn-secondary"
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add User</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={createUser} className="space-y-3">
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Email *</div>
                <input type="email" className="input w-full" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </label>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Role</div>
                <select className="input w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Country</div>
                <input className="input w-full" value={form.countryScope} onChange={e => setForm(f => ({ ...f, countryScope: e.target.value }))} placeholder="TH" />
              </label>
              {err && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function RateConfigsTab({ user }: { user: AuthUser }) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope
  const [configs, setConfigs] = useState<RateConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    effectiveFrom: '',
    effectiveTo: '',
    baseDailyThb: '',
    otMultiplier: '1.5',
    mealAllowanceThb: '0',
    department: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    const json = await apiFetch<RateConfig[]>('/api/admin/rate-configs')
    if (json.success && json.data) setConfigs(json.data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function createConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    const res = await apiFetch('/api/admin/rate-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country,
        department: form.department || undefined,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
        baseDailyThb: parseFloat(form.baseDailyThb),
        otMultiplier: parseFloat(form.otMultiplier),
        mealAllowanceThb: parseFloat(form.mealAllowanceThb),
      }),
    })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowCreate(false)
    refresh()
  }

  async function deleteConfig(id: string) {
    await apiFetch(`/api/admin/rate-configs/${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Rate configs for {country}</span>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={refresh}><RefreshCw size={13} /></button>
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Rate</button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-slate-400" /></div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Effective From</th>
                <th className="px-4 py-3 text-left">To</th>
                <th className="px-4 py-3 text-left">Dept</th>
                <th className="px-4 py-3 text-right">Daily Rate</th>
                <th className="px-4 py-3 text-right">OT Mul</th>
                <th className="px-4 py-3 text-right">Meal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {configs.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-900">{c.effective_from}</td>
                  <td className="px-4 py-3 text-slate-500">{c.effective_to ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.department ?? 'All'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">฿{c.base_daily.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.ot_multiplier}×</td>
                  <td className="px-4 py-3 text-right tabular-nums">฿{c.meal_allowance}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 hover:bg-rose-50 rounded text-rose-400" onClick={() => deleteConfig(c.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {configs.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">No rate configs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add Rate Config</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={createConfig} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Effective From *</div>
                  <input type="date" className="input w-full" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} required />
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Effective To</div>
                  <input type="date" className="input w-full" value={form.effectiveTo} onChange={e => setForm(f => ({ ...f, effectiveTo: e.target.value }))} />
                </label>
              </div>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Department (leave blank for all)</div>
                <input className="input w-full" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. PICK, PACK" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block col-span-1">
                  <div className="text-xs text-slate-500 mb-1">Daily Rate (THB) *</div>
                  <input type="number" className="input w-full" value={form.baseDailyThb} onChange={e => setForm(f => ({ ...f, baseDailyThb: e.target.value }))} required min="0" />
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">OT Multiplier</div>
                  <input type="number" step="0.1" className="input w-full" value={form.otMultiplier} onChange={e => setForm(f => ({ ...f, otMultiplier: e.target.value }))} />
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Meal Allowance</div>
                  <input type="number" className="input w-full" value={form.mealAllowanceThb} onChange={e => setForm(f => ({ ...f, mealAllowanceThb: e.target.value }))} />
                </label>
              </div>
              {err && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage({ user }: Props) {
  const [tab, setTab] = useState<'users' | 'rates'>('users')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Admin</h2>
      <div className="flex gap-1 border-b border-slate-200">
        {(['users', 'rates'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'users' ? 'Users' : 'Rate Configs'}
          </button>
        ))}
      </div>
      {tab === 'users' ? <UsersTab user={user} /> : <RateConfigsTab user={user} />}
    </div>
  )
}
