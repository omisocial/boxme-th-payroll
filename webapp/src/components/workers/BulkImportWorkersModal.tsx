import { useRef, useState } from 'react'
import { apiFetch } from '../../utils/apiFetch'
import * as XLSX from 'xlsx'
import { X, Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useWarehouses } from '../../api/usePeriods'

interface Props {
  country: string
  onClose: () => void
  onSuccess: () => void
}

interface ParsedRow {
  index: number
  code: string
  nameLocal: string
  nickname: string | undefined
  phone: string | undefined
  bankAccount: string | undefined
  bankCode: string | undefined
  departmentCode: string | undefined
  startDate: string | undefined
}

function str(v: unknown): string | undefined {
  if (v == null || v === '') return undefined
  return String(v).trim() || undefined
}

function generateCode(nickname: string | undefined, index: number): string {
  if (nickname) {
    const slug = nickname.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/g, '')
    if (slug) return slug
  }
  return `EMP-${String(index + 1).padStart(4, '0')}`
}

function parseMembers(buf: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })
  if (!wb.SheetNames.includes('Members')) {
    throw new Error('Sheet "Members" not found in this file.')
  }
  const ws = wb.Sheets['Members']
  const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null })
  const rows: ParsedRow[] = []
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[]
    if (!row) continue
    const nameLocal = str(row[1])
    if (!nameLocal) continue
    const nickname = str(row[2])
    rows.push({
      index: i,
      code: generateCode(nickname, rows.length),
      nameLocal,
      nickname,
      phone: str(row[3]),
      bankAccount: str(row[4]),
      bankCode: str(row[5]),
      departmentCode: str(row[7]),
      startDate: str(row[8]),
    })
  }
  return rows
}

type Stage = 'idle' | 'preview' | 'importing' | 'done'

export default function BulkImportWorkersModal({ country, onClose, onSuccess }: Props) {
  const warehouses = useWarehouses(country)
  const fileRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [warehouseId, setWarehouseId] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseErr, setParseErr] = useState<string | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 })
  const [rowErrors, setRowErrors] = useState<Map<number, string>>(new Map())

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseErr(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseMembers(ev.target!.result as ArrayBuffer)
        if (parsed.length === 0) {
          setParseErr('No valid rows found in Members sheet.')
          return
        }
        setRows(parsed)
        setStage('preview')
      } catch (err) {
        setParseErr((err as Error).message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    if (!warehouseId) return
    setStage('importing')
    setProgress({ done: 0, total: rows.length, errors: 0 })
    const errs = new Map<number, string>()
    let errorCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const res = await apiFetch('/api/workers', {
          method: 'POST',
          body: JSON.stringify({
            warehouseId,
            code: row.code,
            nameLocal: row.nameLocal,
            phone: row.phone,
            bankCode: row.bankCode,
            bankAccount: row.bankAccount,
            departmentCode: row.departmentCode,
            startDate: row.startDate,
          }),
        })
        const json = await res.json() as { success: boolean; message?: string }
        if (!json.success) {
          errs.set(row.index, json.message ?? 'Failed')
          errorCount++
        }
      } catch {
        errs.set(row.index, 'Network error')
        errorCount++
      }
      setProgress({ done: i + 1, total: rows.length, errors: errorCount })
      setRowErrors(new Map(errs))
    }

    setStage('done')
  }

  const imported = progress.done - progress.errors

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Bulk Import Workers</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
        </div>

        {/* Warehouse selector */}
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">Warehouse *</label>
          <select
            className="input w-full"
            value={warehouseId}
            onChange={e => setWarehouseId(e.target.value)}
            disabled={stage === 'importing'}
          >
            <option value="">Select warehouse</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {stage === 'idle' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Upload <code className="bg-slate-100 px-1 rounded text-xs">Thailand_Sessonal_Payment.xlsx</code> to
              import all workers from the <strong>Members</strong> sheet.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!warehouseId}
              className="btn-primary w-full disabled:opacity-50"
            >
              <Upload size={14} /> Choose .xlsx file
            </button>
            {!warehouseId && <p className="text-xs text-amber-600">Select a warehouse first.</p>}
            {parseErr && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {parseErr}
              </p>
            )}
          </div>
        )}

        {stage === 'preview' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Found <strong>{rows.length}</strong> workers to import.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Bank</th>
                    <th className="px-3 py-2 text-left">Dept</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 10).map(r => (
                    <tr key={r.index}>
                      <td className="px-3 py-2 font-mono text-slate-600">{r.code}</td>
                      <td className="px-3 py-2 text-slate-900">{r.nameLocal}</td>
                      <td className="px-3 py-2 text-slate-500">{r.bankCode ? `${r.bankCode} ${r.bankAccount ?? ''}`.trim() : '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{r.departmentCode ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <div className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
                  + {rows.length - 10} more rows not shown
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => { setStage('idle'); setRows([]) }}>Back</button>
              <button className="btn-primary flex-1" onClick={handleImport}>
                Import All ({rows.length})
              </button>
            </div>
          </div>
        )}

        {(stage === 'importing' || stage === 'done') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {stage === 'importing' ? (
                  <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Importing…</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /> Done</span>
                )}
              </span>
              <span className="text-slate-500 text-xs">
                {progress.done} / {progress.total} · {imported} imported · {progress.errors} errors
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>

            {rowErrors.size > 0 && (
              <div className="text-xs text-rose-600 space-y-0.5 max-h-32 overflow-y-auto bg-rose-50 rounded-lg p-2">
                {Array.from(rowErrors.entries()).map(([idx, msg]) => (
                  <div key={idx}>Row {idx}: {msg}</div>
                ))}
              </div>
            )}

            {stage === 'done' && (
              <button
                className="btn-primary w-full"
                onClick={imported > 0 ? onSuccess : onClose}
              >
                {imported > 0 ? `Done — ${imported} workers imported` : 'Close'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
