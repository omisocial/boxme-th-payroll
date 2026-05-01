import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Save } from 'lucide-react'
import { useLegalLimits, type LegalLimit } from '../../../api/useSettings'
import type { AuthUser } from '../../../auth/useAuth'

interface Props { user: AuthUser }

function LegalLimitForm({ limit, onSave }: { limit: LegalLimit; onSave: (data: Omit<LegalLimit, 'id' | 'country_code' | 'updated_at'>) => Promise<{ success: boolean; message?: string }> }) {
  const [form, setForm] = useState({
    max_daily_hours: limit.max_daily_hours,
    max_weekly_hours: limit.max_weekly_hours,
    max_consecutive_days: limit.max_consecutive_days,
    ot_threshold_daily: limit.ot_threshold_daily,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      max_daily_hours: limit.max_daily_hours,
      max_weekly_hours: limit.max_weekly_hours,
      max_consecutive_days: limit.max_consecutive_days,
      ot_threshold_daily: limit.ot_threshold_daily,
    })
  }, [limit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null)
    const res = await onSave(form)
    setSaving(false)
    if (!res.success) { setErr(res.message ?? 'Failed'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{limit.country_code}</h3>
        <span className="text-xs text-slate-400">Updated: {new Date(limit.updated_at).toLocaleDateString()}</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Max Daily Hours</div>
            <input
              type="number" step="0.5" min="1" max="24"
              className="input w-full"
              value={form.max_daily_hours}
              onChange={e => setForm(f => ({ ...f, max_daily_hours: parseFloat(e.target.value) || 8 }))}
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">OT Threshold (hrs/day)</div>
            <input
              type="number" step="0.5" min="1" max="24"
              className="input w-full"
              value={form.ot_threshold_daily}
              onChange={e => setForm(f => ({ ...f, ot_threshold_daily: parseFloat(e.target.value) || 8 }))}
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Max Weekly Hours</div>
            <input
              type="number" step="1" min="1" max="168"
              className="input w-full"
              value={form.max_weekly_hours}
              onChange={e => setForm(f => ({ ...f, max_weekly_hours: parseFloat(e.target.value) || 48 }))}
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Max Consecutive Days</div>
            <input
              type="number" step="1" min="1" max="30"
              className="input w-full"
              value={form.max_consecutive_days}
              onChange={e => setForm(f => ({ ...f, max_consecutive_days: parseInt(e.target.value) || 6 }))}
            />
          </label>
        </div>
        {err && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={`btn-primary text-sm gap-1.5 ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function LegalLimitsTab({ user }: Props) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope
  const { limits, loading, save } = useLegalLimits(country)

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-slate-400" /></div>

  if (limits.length === 0) return (
    <div className="card p-8 text-center text-slate-500 text-sm">
      No legal limits configured. Contact your administrator.
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Configure legal working hour limits per country. These are used to flag potential violations in attendance records.
      </p>
      {limits.map(l => (
        <LegalLimitForm
          key={l.id}
          limit={l}
          onSave={(data) => save(l.country_code, data)}
        />
      ))}
    </div>
  )
}
