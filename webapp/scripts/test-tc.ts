import { readFileSync } from 'fs'
import { parseWorkbook } from '../src/payroll/parser'
import { computePayroll } from '../src/payroll/engine'

interface TC {
  id: string
  sheet: string
  row: number
  expectedGross: number
  desc: string
}

const TCS: TC[] = [
  { id: 'TC01', sheet: 'วันที่ 1',  row: 11, expectedGross: 499.32, desc: 'Standard, marginally late' },
  { id: 'TC02', sheet: 'วันที่ 1',  row: 9,  expectedGross: 419.20, desc: 'Late ~77 min' },
  { id: 'TC03', sheet: 'วันที่ 9',  row: 40, expectedGross: 218.75, desc: 'Early-out 13:00' },
  { id: 'TC04', sheet: 'วันที่ 3 กะดึก', row: 9, expectedGross: 498.33, desc: 'Night shift' },
  { id: 'TC05', sheet: 'วันที่ 7',  row: 38, expectedGross: 640.62, desc: 'OT before 1.5h' },
  { id: 'TC06', sheet: 'วันที่ 16', row: 9,  expectedGross: 594.79, desc: 'OT after 2h, late' },
  { id: 'TC07', sheet: 'วันที่ 7',  row: 45, expectedGross: 72.43,  desc: 'Sick leave' },
  { id: 'TC08', sheet: 'วันที่ 9',  row: 40, expectedGross: 218.75, desc: 'Half-day afternoon (=TC03)' },
  { id: 'TC09', sheet: 'วันที่ 1',  row: 74, expectedGross: 0.00,   desc: 'Damage 500' },
  { id: 'TC10', sheet: 'วันที่ 28', row: 90, expectedGross: 500.00, desc: 'Intern exempt' },
  { id: 'TC11', sheet: 'วันที่ 28', row: 88, expectedGross: 500.00, desc: 'Housekeeper exempt' },
  { id: 'TC12', sheet: 'วันที่ 2',  row: 35, expectedGross: 500.00, desc: 'Manual checkin' },
]

const filePath = '/Volumes/Data/Boxme/micro_tools/Session_Payment/Thailand_Sessonal_Payment.xlsx'
const buf = readFileSync(filePath)
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
const wb = parseWorkbook(ab, 'Thailand_Sessonal_Payment.xlsx')

console.log(`\nParsed: ${wb.attendance.length} attendance rows · ${wb.members.length} members · ${wb.daysFound.length} day sheets · ${wb.damages.length} damages`)
console.log(`Days: ${wb.daysFound.join(', ')}\n`)

let pass = 0
let fail = 0

for (const tc of TCS) {
  const att = wb.attendance.find(a => a.sheet === tc.sheet && a.rowIndex === tc.row)
  if (!att) {
    console.log(`❌ ${tc.id} — row not found (sheet=${tc.sheet}, row=${tc.row})`)
    fail++
    continue
  }

  // For TC09: damage 500 isn't in the daily sheet (it's in สินค้าเสียหาย). Inject manually.
  if (tc.id === 'TC09' && !att.damageDeduction) {
    att.damageDeduction = 500
  }

  const result = computePayroll(att)
  const diff = Math.abs(result.grossWageThb - tc.expectedGross)
  const ok = diff <= 0.02
  const mark = ok ? '✅' : '❌'
  if (ok) pass++; else fail++

  console.log(`${mark} ${tc.id} [${tc.desc}]`)
  console.log(`     worker=${att.fullName.slice(0, 28).padEnd(28)} dept=${att.note} shift=${att.shiftCode}`)
  console.log(`     checkin=${att.checkin} checkout=${att.checkout}`)
  console.log(`     U=${result.hoursBucketU} late_raw=${result.lateMinutesRaw} late_ded=${result.lateMinutesDeducted} early=${result.earlyOutMinutes} OT=${result.otTotalHours}h`)
  console.log(`     late=฿${result.lateDeductionThb} early=฿${result.earlyOutDeductionThb} ot=฿${result.otPayThb} damage=฿${result.damageThb}`)
  console.log(`     GROSS = ฿${result.grossWageThb}  (expected ฿${tc.expectedGross}, diff ${diff.toFixed(3)})`)
  if (result.flags.length) console.log(`     flags: ${result.flags.join(', ')}`)
  console.log('')
}

console.log(`\n=== Result: ${pass}/${TCS.length} pass · ${fail} fail ===\n`)
process.exit(fail === 0 ? 0 : 1)
