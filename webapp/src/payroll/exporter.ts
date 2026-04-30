import * as XLSX from 'xlsx'
import type { PayrollResult, WorkerSummary } from './types'

export function exportDailyXlsx(rows: PayrollResult[], fileName = 'payroll-daily.xlsx') {
  const data = rows.map(r => ({
    'Sheet': r.sheet,
    'Date': r.workDate,
    'Full Name': r.fullName,
    'Nickname': r.nickname || '',
    'Department': r.note || '',
    'Category': r.deptCategory,
    'Shift': r.shiftCode || '',
    'Bucket U': r.hoursBucketU,
    'Checkin': r.checkin || '',
    'Checkout': r.checkout || '',
    'Late (min)': r.lateMinutesRaw,
    'Late deducted (min)': r.lateMinutesDeducted,
    'Early-out (min)': r.earlyOutMinutes,
    'Daily Rate (THB)': r.dailyRateThb,
    'Late Deduction': r.lateDeductionThb,
    'Early-out Deduction': r.earlyOutDeductionThb,
    'OT Hours': r.otTotalHours,
    'OT Pay': r.otPayThb,
    'Damage': r.damageThb,
    'Other': r.otherDeductionThb,
    'GROSS WAGE (THB)': r.grossWageThb,
    'Flags': r.flags.join(', '),
    'Manual Note': r.manualNote || '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Payroll')
  XLSX.writeFile(wb, fileName)
}

export function exportWorkerSummaryXlsx(workers: WorkerSummary[], fileName = 'payroll-workers.xlsx') {
  const data = workers.map(w => ({
    'Full Name': w.fullName,
    'Nickname': w.nickname || '',
    'Department': w.department || '',
    'Shifts': w.shifts,
    'Bank Code': w.bankCode || '',
    'Bank Account': w.bankAccount || '',
    'Total Late': w.totalLate,
    'Total Early-out': w.totalEarlyOut,
    'Total Damage': w.totalDamage,
    'Total OT': w.totalOt,
    'TOTAL GROSS (THB)': w.totalGross,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Workers')
  XLSX.writeFile(wb, fileName)
}

export function exportBankCsv(workers: WorkerSummary[], bankCode: string, fileName = 'bank-export.csv') {
  // Generic CSV — bank-specific adapters will be added in Phase 1.1
  const filtered = bankCode === 'ALL' ? workers : workers.filter(w => (w.bankCode || '').toUpperCase() === bankCode.toUpperCase())
  const header = ['No', 'Account Number', 'Account Name', 'Amount THB', 'Bank Code', 'Note']
  const lines = [header.join(',')]
  filtered.forEach((w, i) => {
    if (!w.bankAccount || w.totalGross <= 0) return
    const safeName = (w.fullName || '').replace(/,/g, ' ')
    lines.push([
      i + 1,
      `"${w.bankAccount}"`,
      `"${safeName}"`,
      w.totalGross.toFixed(2),
      w.bankCode || '',
      'Boxme TH Payroll'
    ].join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
