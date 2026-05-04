import { useMemo, useState } from 'react'
import { apiFetch } from '../../utils/apiFetch'
import { X, Save, Loader2, CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react'
import { useWarehouse } from '../../context/WarehouseContext'
import { useI18n } from '../../i18n/I18n'

interface Props {
  pendingNames: string[]
  onClose: () => void
  onSaved: (createdCount: number) => void
}

interface DraftRow {
  fullName: string
  code: string
  nickname: string
  phone: string
  bankCode: string
  bankAccount: string
  departmentCode: string
  jobType: 'SEASONAL' | 'REGULAR'
  error?: string
  saved?: boolean
}

function slugCode(name: string, idx: number): string {
  const slug = name.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '')
  return slug ? slug.slice(0, 24) : `EMP-${String(idx + 1).padStart(4, '0')}`
}

export default function BulkFixWorkersModal({ pendingNames, onClose, onSaved }: Props) {
  const { t } = useI18n()
  const { current } = useWarehouse()
  const [rows, setRows] = useState<DraftRow[]>(() =>
    pendingNames.map((name, i) => ({
      fullName: name,
      code: slugCode(name, i),
      nickname: '',
      phone: '',
      bankCode: '',
      bankAccount: '',
      departmentCode: '',
      jobType: 'SEASONAL' as const,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [bulkDept, setBulkDept] = useState('')
  const [bulkJobType, setBulkJobType] = useState<'SEASONAL' | 'REGULAR'>('SEASONAL')

  const remaining = useMemo(() => rows.filter(r => !r.saved).length, [rows])

  function update(idx: number, patch: Partial<DraftRow>) {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function applyBulk() {
    setRows(prev =>
      prev.map(r =>
        r.saved
          ? r
          : {
              ...r,
              departmentCode: bulkDept || r.departmentCode,
              jobType: bulkJobType,
            }
      )
    )
  }

  async function saveAll() {
    if (!current) return
    setSaving(true)
    let createdCount = 0
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        if (r.saved) continue
        const payload: Record<string, unknown> = {
          warehouseId: current.id,
          code: r.code,
          nameLocal: r.fullName,
          jobTypeCode: r.jobType,
        }
        if (r.phone) payload.phone = r.phone
        if (r.bankAccount) payload.bankAccount = r.bankAccount
        if (r.bankCode) payload.bankCode = r.bankCode
        if (r.departmentCode) payload.departmentCode = r.departmentCode
        if (r.nickname) payload.notes = `Nickname: ${r.nickname}`
        try {
          const res = await apiFetch('/api/workers', {
            method: 'POST',
            body: JSON.stringify(payload),
          })
          const json = await res.json()
          if (json.success) {
            update(i, { saved: true, error: undefined })
            createdCount++
          } else {
            update(i, { error: json.message || 'Failed' })
          }
        } catch (e) {
          update(i, { error: (e as Error).message })
        }
      }
      onSaved(createdCount)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="text-blue-600" size={18} />
            <div>
              <h2 className="font-semibold text-slate-900">{t('bulk.title')}</h2>
              <p className="text-xs text-slate-500">
                {t('bulk.desc').replace('{n}', String(pendingNames.length))}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b bg-slate-50 flex items-center gap-3 flex-wrap text-xs">
          <span className="text-slate-600 font-medium">{t('bulk.bulkDefault')}</span>
          <input
            value={bulkDept}
            onChange={e => setBulkDept(e.target.value)}
            placeholder={t('workers.form.dept')}
            className="px-2 py-1 border border-slate-200 rounded-md w-32"
          />
          <select
            value={bulkJobType}
            onChange={e => setBulkJobType(e.target.value as 'SEASONAL' | 'REGULAR')}
            className="px-2 py-1 border border-slate-200 rounded-md"
          >
            <option value="SEASONAL">{t('pay.typeSeasonal')}</option>
            <option value="REGULAR">{t('pay.typeRegular')}</option>
          </select>
          <button onClick={applyBulk} className="btn-secondary text-xs">
            {t('bulk.applyToAll')}
          </button>
          <span className="text-slate-400 ml-auto">
            {t('bulk.warehouseLabel')} <strong>{current?.code ?? '—'}</strong>
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-xs text-slate-600">
                <th className="text-left px-3 py-2 font-medium">{t('workers.col.status')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.col.name')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.col.code')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('bulk.colNickname')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.form.phone')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.form.bankCode')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.form.bankAccount')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.col.dept')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('workers.form.jobType')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={`border-t ${r.saved ? 'bg-emerald-50/40' : r.error ? 'bg-rose-50/40' : ''}`}>
                  <td className="px-3 py-1.5 align-middle">
                    {r.saved ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : r.error ? (
                      <span title={r.error}>
                        <AlertTriangle size={14} className="text-rose-600" />
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.fullName} onChange={e => update(i, { fullName: e.target.value })} className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.code} onChange={e => update(i, { code: e.target.value })} className="w-28 px-2 py-1 border border-slate-200 rounded-md text-sm font-mono" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.nickname} onChange={e => update(i, { nickname: e.target.value })} className="w-24 px-2 py-1 border border-slate-200 rounded-md text-sm" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.phone} onChange={e => update(i, { phone: e.target.value })} className="w-28 px-2 py-1 border border-slate-200 rounded-md text-sm" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.bankCode} onChange={e => update(i, { bankCode: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded-md text-sm" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.bankAccount} onChange={e => update(i, { bankAccount: e.target.value })} className="w-32 px-2 py-1 border border-slate-200 rounded-md text-sm font-mono" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={r.departmentCode} onChange={e => update(i, { departmentCode: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded-md text-sm" disabled={r.saved} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select value={r.jobType} onChange={e => update(i, { jobType: e.target.value as 'SEASONAL' | 'REGULAR' })} className="px-2 py-1 border border-slate-200 rounded-md text-sm" disabled={r.saved}>
                      <option value="SEASONAL">{t('pay.typeSeasonal')}</option>
                      <option value="REGULAR">{t('pay.typeRegular')}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {remaining > 0 ? t('bulk.unsaved').replace('{n}', String(remaining)) : t('bulk.allSaved')}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">
              {t('common.close')}
            </button>
            <button
              onClick={saveAll}
              disabled={saving || remaining === 0 || !current}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? t('bulk.saving') : t('bulk.saveN').replace('{n}', String(remaining))}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
