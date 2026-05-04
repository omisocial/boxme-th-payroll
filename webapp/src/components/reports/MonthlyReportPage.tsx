import { useMemo, useState } from 'react'
import { Loader2, Download, BarChart3, FileSpreadsheet, Calendar } from 'lucide-react'
import { useMonthlyReport } from '../../api/useMonthlyReport'
import { useWarehouse } from '../../context/WarehouseContext'
import { useI18n } from '../../i18n/I18n'

function fmtMoney(n: number, sym: string) {
  return `${sym} ${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function downloadCsv(filename: string, rows: string[][]) {
  // Escape Excel formula-injection: prefix cells starting with =,+,-,@ with a single quote.
  const escapeCell = (v: string) => {
    const safe = (v ?? '').toString()
    return /^[=+\-@]/.test(safe) ? `'${safe}` : safe
  }
  const csv = rows.map(r => r.map(v => `"${escapeCell(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthlyReportPage() {
  const { t } = useI18n()
  const { current } = useWarehouse()
  const sym = current?.currencySymbol ?? '฿'

  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth())
  const [scope, setScope] = useState<'all' | 'current'>('all')

  const warehouseId = scope === 'current' ? current?.id ?? null : null
  const { report, loading } = useMonthlyReport(yearMonth, warehouseId)

  const maxDeptNet = useMemo(
    () => Math.max(1, ...((report?.byDepartment ?? []).map(d => d.net))),
    [report]
  )

  function exportLinesCsv() {
    if (!report) return
    const header = ['Period', 'Worker', 'Type', 'Dept', 'Shifts', 'Gross', 'Net', 'Status']
    const periodMap = new Map(report.periods.map(p => [p.id, p.name]))
    const rows = [
      header,
      ...report.lines.map(l => [
        periodMap.get(l.period_id) ?? l.period_id,
        l.full_name,
        l.workers?.job_type_code ?? '',
        l.workers?.department_code ?? '',
        String(l.shifts),
        String(l.total_gross_thb),
        String(l.net_pay_thb),
        l.payment_status,
      ]),
    ]
    downloadCsv(`monthly-report-${yearMonth}.csv`, rows)
  }

  return (
    <div className="space-y-4">
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
          <Calendar size={14} /> {t('report.title')}
        </div>
        <input
          type="month"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        />
        <select
          value={scope}
          onChange={e => setScope(e.target.value as 'all' | 'current')}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="all">{t('report.allWarehouses')}</option>
          <option value="current">{current?.code ?? 'Current'}</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button onClick={exportLinesCsv} disabled={!report || report.lines.length === 0} className="btn-secondary text-xs flex items-center gap-1.5">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={18} /> {t('report.loading')}
        </div>
      )}

      {!loading && report && (
        <>
          {report.periods.length === 0 ? (
            <div className="card p-8 text-center">
              <BarChart3 className="mx-auto text-slate-300" size={36} />
              <h3 className="mt-3 font-semibold text-slate-700">{t('report.noData').replace('{month}', yearMonth)}</h3>
              <p className="text-sm text-slate-500 mt-1">{t('report.noDataHint')}</p>
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <Kpi label={t('report.kpiNet')} value={fmtMoney(report.kpi.netTotal, sym)} tone="primary" />
                <Kpi label={t('report.kpiWorkers')} value={String(report.kpi.workerCount)} />
                <Kpi label={t('report.kpiShifts')} value={String(report.kpi.shifts)} />
                <Kpi label={t('report.kpiOt')} value={fmtMoney(report.kpi.otTotal, sym)} />
                <Kpi label={t('report.kpiDeduct')} value={fmtMoney(report.kpi.deductTotal, sym)} tone="rose" />
                <Kpi
                  label={t('report.kpiPaidRatio')}
                  value={`${report.kpi.paidCount} / ${report.kpi.unpaidCount}`}
                  tone={report.kpi.unpaidCount === 0 ? 'emerald' : 'amber'}
                />
              </div>

              {/* By department bar chart */}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <BarChart3 size={14} /> {t('report.byDept')}
                </h3>
                {report.byDepartment.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('report.noDeptData')}</p>
                ) : (
                  <div className="space-y-2">
                    {report.byDepartment.map(d => (
                      <div key={d.dept} className="text-xs">
                        <div className="flex justify-between mb-0.5">
                          <span className="font-medium text-slate-700">{d.dept}</span>
                          <span className="tabular-nums text-slate-600">
                            {fmtMoney(d.net, sym)} · {d.count} CTV
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(d.net / maxDeptNet) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Periods table */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-slate-800 text-sm">{t('report.periodsInMonth').replace('{n}', String(report.periods.length))}</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs text-slate-600">
                      <th className="text-left px-3 py-2 font-medium">Kỳ</th>
                      <th className="text-left px-3 py-2 font-medium">Khoảng</th>
                      <th className="text-left px-3 py-2 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.periods.map(p => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2 text-slate-600">{p.from_date} → {p.to_date}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bank exports audit */}
              {report.bankExports.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-slate-600" />
                    <h3 className="font-semibold text-slate-800 text-sm">Bank export audit</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-xs text-slate-600">
                        <th className="text-left px-3 py-2 font-medium">File</th>
                        <th className="text-left px-3 py-2 font-medium">Bank</th>
                        <th className="text-right px-3 py-2 font-medium">Rows</th>
                        <th className="text-right px-3 py-2 font-medium">Total</th>
                        <th className="text-left px-3 py-2 font-medium">By</th>
                        <th className="text-left px-3 py-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.bankExports.map(e => (
                        <tr key={e.id} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">{e.filename}</td>
                          <td className="px-3 py-2">{e.bank_code}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{e.row_count}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(e.total_thb, sym)}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{e.created_by}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'primary' | 'rose' | 'emerald' | 'amber' }) {
  const cls = tone === 'primary'
    ? 'bg-blue-50 border-blue-200 text-blue-900'
    : tone === 'rose'
    ? 'bg-rose-50 border-rose-200 text-rose-900'
    : tone === 'emerald'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
    : tone === 'amber'
    ? 'bg-amber-50 border-amber-200 text-amber-900'
    : 'bg-white border-slate-200 text-slate-900'
  return (
    <div className={`card p-3 border ${cls}`}>
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="text-lg sm:text-xl font-semibold tabular-nums mt-1 truncate">{value}</div>
    </div>
  )
}
