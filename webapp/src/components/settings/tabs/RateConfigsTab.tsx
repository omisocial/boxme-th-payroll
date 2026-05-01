import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Loader2, X, AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { usePayComponents, usePayRules, type PayComponent } from '../../../api/useSettings'
import type { AuthUser } from '../../../auth/useAuth'

interface Props { user: AuthUser }

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

interface RateConfig {
  id: string
  country_code: string
  department_code: string | null
  grade_code: string | null
  base_daily: number
  ot_multiplier: number
  effective_from: string
  created_by: string | null
  created_at: string
}

function RateConfigsSection({ country }: { country: string }) {
  const [configs, setConfigs] = useState<RateConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ effectiveFrom: '', departmentCode: '', baseDailyThb: '', otMultiplier: '1.5' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const json = await apiFetch<RateConfig[]>(`/api/admin/rate-configs?country=${country}`)
    if (json.success && json.data) setConfigs(json.data)
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.effectiveFrom || !form.baseDailyThb) { setErr('Effective from and daily rate required'); return }
    setSaving(true); setErr(null)
    const res = await apiFetch('/api/admin/rate-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country,
        department: form.departmentCode || undefined,
        effectiveFrom: form.effectiveFrom,
        baseDailyThb: parseFloat(form.baseDailyThb),
        otMultiplier: parseFloat(form.otMultiplier),
        mealAllowanceThb: 0,
      }),
    })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowCreate(false); refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Rate Configs</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={refresh}><RefreshCw size={12} /></button>
          <button className="btn-primary text-xs" onClick={() => { setShowCreate(true); setErr(null) }}>
            <Plus size={13} /> Add Rate
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-400" /></div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-3 py-2.5 text-left">Effective From</th>
              <th className="px-3 py-2.5 text-left">Dept</th>
              <th className="px-3 py-2.5 text-right">Daily Rate</th>
              <th className="px-3 py-2.5 text-right">OT ×</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {configs.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-900">{c.effective_from}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.department_code ?? 'All'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium">฿{c.base_daily.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{c.ot_multiplier}×</td>
                <td className="px-3 py-2.5 text-right">
                  <button className="p-1 hover:bg-rose-50 rounded text-rose-400" onClick={async () => { await apiFetch(`/api/admin/rate-configs/${c.id}`, { method: 'DELETE' }); refresh() }}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {configs.length === 0 && !loading && <tr><td colSpan={5} className="px-3 py-5 text-center text-slate-400 text-sm">No rate configs yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add Rate Config</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Effective From *</div>
                <input type="date" className="input w-full" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} required />
              </label>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Department (blank = all depts)</div>
                <input className="input w-full" value={form.departmentCode} onChange={e => setForm(f => ({ ...f, departmentCode: e.target.value }))} placeholder="BM1" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Daily Rate (THB) *</div>
                  <input type="number" min="0" className="input w-full" value={form.baseDailyThb} onChange={e => setForm(f => ({ ...f, baseDailyThb: e.target.value }))} required />
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">OT Multiplier</div>
                  <input type="number" step="0.1" min="1" className="input w-full" value={form.otMultiplier} onChange={e => setForm(f => ({ ...f, otMultiplier: e.target.value }))} />
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

function PayRulesSection({ componentId, componentName }: { componentId: string; componentName: string }) {
  const { rules, loading, create, remove } = usePayRules(componentId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ condition_field: 'job_type_code', condition_op: '=', condition_value: '', priority: '0' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.condition_value) { setErr('Condition value required'); return }
    setSaving(true); setErr(null)
    const res = await create({
      component_id: componentId,
      condition_field: form.condition_field,
      condition_op: form.condition_op,
      condition_value: form.condition_value,
      priority: parseInt(form.priority) || 0,
    })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowForm(false); setForm({ condition_field: 'job_type_code', condition_op: '=', condition_value: '', priority: '0' })
  }

  if (loading) return null

  return (
    <div className="pl-4 border-l-2 border-slate-100 space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Rules for {componentName}</span>
        <button className="text-xs text-blue-600 hover:underline" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {rules.map(r => (
        <div key={r.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
          <span className="text-slate-700 font-mono">
            {r.condition_field} {r.condition_op} <strong>{r.condition_value}</strong>
            {r.priority > 0 && <span className="ml-2 text-slate-400">priority:{r.priority}</span>}
          </span>
          <button className="p-1 hover:bg-rose-50 rounded text-rose-400" onClick={() => remove(r.id)}><Trash2 size={11} /></button>
        </div>
      ))}

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-2 bg-blue-50/50 rounded-lg p-3">
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Field</div>
              <select className="input w-full text-xs" value={form.condition_field} onChange={e => setForm(f => ({ ...f, condition_field: e.target.value }))}>
                <option value="job_type_code">Job Type</option>
                <option value="department_code">Department</option>
                <option value="shift_code">Shift</option>
                <option value="day_type">Day Type</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Op</div>
              <select className="input w-full text-xs" value={form.condition_op} onChange={e => setForm(f => ({ ...f, condition_op: e.target.value }))}>
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value="IN">IN</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-slate-500 mb-1">Value</div>
              <input className="input w-full text-xs" value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))} placeholder="SEASONAL" />
            </label>
          </div>
          {err && <p className="text-xs text-rose-600">{err}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-xs">
            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Add Rule'}
          </button>
        </form>
      )}
    </div>
  )
}

function PayComponentsSection({ country }: { country: string }) {
  const { components, loading, refresh, create, update, remove } = usePayComponents(country)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', formula_type: 'fixed' as PayComponent['formula_type'], formula_value: '0', applies_to: 'gross' as PayComponent['applies_to'], effective_from: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name || !form.effective_from) { setErr('Code, name, and effective from required'); return }
    setSaving(true); setErr(null)
    const res = await create({ ...form, active: true })
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setShowCreate(false)
  }

  const gross = components.filter(c => c.applies_to === 'gross')
  const deductions = components.filter(c => c.applies_to === 'deduction')

  function ComponentRow({ c }: { c: PayComponent }) {
    const isExpanded = expanded === c.id
    return (
      <div>
        <div className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <button className="text-slate-400" onClick={() => setExpanded(isExpanded ? null : c.id)}>
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <div>
              <div className="text-sm font-medium text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-400 font-mono">{c.code} · {c.formula_type}: {c.formula_value} · from {c.effective_from}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {c.active ? 'active' : 'inactive'}
            </span>
            <button className="p-1 hover:bg-amber-50 rounded text-amber-500" onClick={() => update(c.id, { active: !c.active })}>
              {c.active ? 'Deactivate' : 'Activate'}
            </button>
            <button className="p-1 hover:bg-rose-50 rounded text-rose-400" onClick={() => remove(c.id)}><Trash2 size={12} /></button>
          </div>
        </div>
        {isExpanded && <PayRulesSection componentId={c.id} componentName={c.name} />}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Pay Components</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={refresh}><RefreshCw size={12} /></button>
          <button className="btn-primary text-xs" onClick={() => { setShowCreate(true); setErr(null) }}>
            <Plus size={13} /> Add Component
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-400" /></div>}

      {(gross.length > 0 || deductions.length > 0) && (
        <div className="card p-3 space-y-3">
          {gross.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">Allowances / Gross</div>
              <div className="space-y-0.5">
                {gross.map(c => <ComponentRow key={c.id} c={c} />)}
              </div>
            </div>
          )}
          {deductions.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">Deductions</div>
              <div className="space-y-0.5">
                {deductions.map(c => <ComponentRow key={c.id} c={c} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && components.length === 0 && (
        <div className="card p-6 text-center text-slate-400 text-sm">No pay components configured.</div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add Pay Component</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Code *</div>
                  <input className="input w-full" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="meal_allowance" />
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Applies To</div>
                  <select className="input w-full" value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value as PayComponent['applies_to'] }))}>
                    <option value="gross">Gross (Allowance)</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Name *</div>
                <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Meal Allowance" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Formula Type</div>
                  <select className="input w-full" value={form.formula_type} onChange={e => setForm(f => ({ ...f, formula_type: e.target.value as PayComponent['formula_type'] }))}>
                    <option value="fixed">Fixed</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="multiplier">Multiplier</option>
                    <option value="expression">Expression</option>
                  </select>
                </label>
                <label className="block">
                  <div className="text-xs text-slate-500 mb-1">Formula Value</div>
                  <input className="input w-full" value={form.formula_value} onChange={e => setForm(f => ({ ...f, formula_value: e.target.value }))} placeholder="50" />
                </label>
              </div>
              <label className="block">
                <div className="text-xs text-slate-500 mb-1">Effective From *</div>
                <input type="date" className="input w-full" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} required />
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

export default function RateConfigsTab({ user }: Props) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope

  return (
    <div className="space-y-6">
      <RateConfigsSection country={country} />
      <PayComponentsSection country={country} />
    </div>
  )
}
