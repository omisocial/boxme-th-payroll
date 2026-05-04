import { useState, useMemo } from 'react'
import { X, Loader2, CheckCircle2, AlertTriangle, Database } from 'lucide-react'
import { useWarehouses } from '../api/usePeriods'
import type { AuthUser } from '../auth/useAuth'
import { useI18n } from '../i18n/I18n'

interface Props {
  user: AuthUser
  fileBuffer: ArrayBuffer
  fileName: string
  onClose: () => void
}

interface PreviewRow {
  rowIndex: number
  sheet: string
  workDate: string
  fullName: string
  checkin?: string
  checkout?: string
  shiftCode?: string
  note?: string
}

interface ImportPreview {
  importSessionId: string
  rows: PreviewRow[]
  totalRows: number
}

type Stage = 'setup' | 'uploading' | 'preview' | 'committing' | 'done'

function ValidationSummary({ rows, totalRows }: { rows: PreviewRow[]; totalRows: number }) {
  const { t } = useI18n()
  const counts = useMemo(() => {
    let missingCheckin = 0, missingCheckout = 0, missingShift = 0
    for (const r of rows) {
      if (!r.checkin) missingCheckin++
      if (!r.checkout) missingCheckout++
      if (!r.shiftCode) missingShift++
    }
    // Extrapolate to totalRows if we only have a sample
    const factor = rows.length > 0 ? totalRows / rows.length : 1
    return {
      ready: totalRows - Math.round((missingCheckin || missingCheckout || missingShift ? 1 : 0) * factor),
      missingCheckin: Math.round(missingCheckin * factor),
      missingCheckout: Math.round(missingCheckout * factor),
      missingShift: Math.round(missingShift * factor),
    }
  }, [rows, totalRows])

  const hasWarnings = counts.missingCheckin > 0 || counts.missingCheckout > 0 || counts.missingShift > 0

  return (
    <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${hasWarnings ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'}`}>
      <div className="flex items-center gap-1.5 font-medium text-slate-700">
        {hasWarnings ? <AlertTriangle size={12} className="text-amber-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
        {t('import.validationSummary')}
      </div>
      <div className="flex items-center gap-1.5 text-emerald-700">
        <CheckCircle2 size={10} />
        <span>{t('import.rowsWillImport').replace('{n}', String(totalRows))}</span>
      </div>
      {counts.missingCheckin > 0 && (
        <div className="flex items-center gap-1.5 text-amber-700">
          <AlertTriangle size={10} />
          <span>{t('import.missingCheckin').replace('{n}', String(counts.missingCheckin))}</span>
        </div>
      )}
      {counts.missingCheckout > 0 && (
        <div className="flex items-center gap-1.5 text-amber-700">
          <AlertTriangle size={10} />
          <span>{t('import.missingCheckout').replace('{n}', String(counts.missingCheckout))}</span>
        </div>
      )}
      {counts.missingShift > 0 && (
        <div className="flex items-center gap-1.5 text-amber-700">
          <AlertTriangle size={10} />
          <span>{t('import.missingShift').replace('{n}', String(counts.missingShift))}</span>
        </div>
      )}
    </div>
  )
}

export default function ServerImportDialog({ user, fileBuffer, fileName, onClose }: Props) {
  const { t } = useI18n()
  const country = user.country_scope === '*' ? 'TH' : user.country_scope
  const warehouses = useWarehouses(country)

  const [stage, setStage] = useState<Stage>('setup')
  const [warehouseId, setWarehouseId] = useState('')
  const [yearMonth, setYearMonth] = useState('2026-04')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function handleUpload() {
    if (!warehouseId) return
    setStage('uploading')
    setErr(null)
    try {
      const form = new FormData()
      form.append('file', new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName)
      const res = await fetch(
        `/api/attendance/import?warehouse=${encodeURIComponent(warehouseId)}&yearMonth=${encodeURIComponent(yearMonth)}`,
        { method: 'POST', body: form, credentials: 'include' }
      )
      const json = await res.json() as { success: boolean; data?: ImportPreview; message?: string }
      if (!json.success || !json.data) {
        setErr(json.message ?? 'Upload failed')
        setStage('setup')
        return
      }
      setPreview(json.data)
      setStage('preview')
    } catch (e) {
      setErr((e as Error).message)
      setStage('setup')
    }
  }

  async function handleCommit() {
    if (!preview) return
    setStage('committing')
    setErr(null)
    try {
      const res = await fetch('/api/attendance/import/commit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importSessionId: preview.importSessionId }),
      })
      const json = await res.json() as { success: boolean; data?: { imported: number; skipped: number; errors: string[] }; message?: string }
      if (!json.success || !json.data) {
        setErr(json.message ?? 'Commit failed')
        setStage('preview')
        return
      }
      setResult(json.data)
      setStage('done')
    } catch (e) {
      setErr((e as Error).message)
      setStage('preview')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">{t('import.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
        </div>

        <p className="text-xs text-slate-500 mb-4 truncate">File: <span className="font-mono">{fileName}</span></p>

        {/* Setup */}
        {(stage === 'setup' || stage === 'uploading') && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('import.warehouseLabel')}</label>
              <select
                className="input w-full"
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                disabled={stage === 'uploading'}
              >
                <option value="">{t('import.selectWarehouse')}</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('import.yearMonthLabel')}</label>
              <input
                type="month"
                className="input w-full"
                value={yearMonth}
                onChange={e => setYearMonth(e.target.value)}
                disabled={stage === 'uploading'}
              />
            </div>
            {err && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {err}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={onClose} disabled={stage === 'uploading'}>{t('common.cancel')}</button>
              <button
                className="btn-primary flex-1 disabled:opacity-50"
                onClick={handleUpload}
                disabled={!warehouseId || stage === 'uploading'}
              >
                {stage === 'uploading'
                  ? <><Loader2 size={14} className="animate-spin" /> {t('import.uploading')}</>
                  : t('import.uploadPreview')}
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {stage === 'preview' && preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700 font-medium">{t('import.preview')}</span>
              <span className="text-slate-500 text-xs">{preview.totalRows} rows total</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">{t('import.colSheet')}</th>
                    <th className="px-3 py-2 text-left">{t('import.colDate')}</th>
                    <th className="px-3 py-2 text-left">{t('import.colName')}</th>
                    <th className="px-3 py-2 text-left">{t('import.colInOut')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-slate-500 font-mono">{r.sheet}</td>
                      <td className="px-3 py-2 text-slate-700">{r.workDate || <span className="text-amber-500">—</span>}</td>
                      <td className="px-3 py-2 text-slate-900">{r.fullName}</td>
                      <td className="px-3 py-2 text-slate-500">{[r.checkin, r.checkout].filter(Boolean).join(' / ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.totalRows > 5 && (
                <div className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
                  {t('import.moreRows').replace('{count}', String(preview.totalRows - 5))}
                </div>
              )}
            </div>

            <ValidationSummary rows={preview.rows} totalRows={preview.totalRows} />

            {err && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {err}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setStage('setup')}>{t('common.back')}</button>
              <button className="btn-primary flex-1" onClick={handleCommit}>
                {t('import.commit').replace('{count}', String(preview.totalRows))}
              </button>
            </div>
          </div>
        )}

        {/* Committing */}
        {stage === 'committing' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-sm text-slate-600">{t('import.saving')}</p>
          </div>
        )}

        {/* Done */}
        {stage === 'done' && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={18} />
              <span className="font-medium text-sm">{t('import.complete')}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">{t('import.imported')}</span>
                <span className="font-semibold text-slate-900">{result.imported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{t('import.skipped')}</span>
                <span className="font-semibold text-slate-900">{result.skipped}</span>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-rose-600 bg-rose-50 rounded-lg p-2 space-y-0.5 max-h-24 overflow-y-auto">
                {result.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <button className="btn-primary w-full" onClick={onClose}>{t('common.close')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
