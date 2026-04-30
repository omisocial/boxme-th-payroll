// Payroll engine — ported from webapp/src/payroll/engine.ts
// Pure functions, no IO. Source of truth for all payroll computation.

export type DeptCategory = 'BM' | 'DW' | 'INTERN' | 'HOUSEKEEPER' | 'OTHER'

export type Flag =
  | 'NO_CHECKIN' | 'NO_CHECKOUT' | 'ABSENT' | 'NEGATIVE_FLOORED'
  | 'DAMAGE_OFFSETS_WAGE' | 'INTERN_EXEMPT' | 'HOUSEKEEPER_EXEMPT'
  | 'MANUAL_CHECKIN' | 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNKNOWN_SHIFT'

export interface AttendanceRow {
  sheet: string
  rowIndex: number
  workDate: string
  fullName: string
  nickname?: string
  checkin?: string
  checkout?: string
  note?: string
  shiftCode?: string
  manualNote?: string
  otBeforeHours?: number
  otAfterHours?: number
  damageDeduction?: number
  otherDeduction?: number
}

export interface PayrollResult extends AttendanceRow {
  deptCategory: DeptCategory
  shiftStart?: string
  shiftEnd?: string
  crossesMidnight: boolean
  shiftDurationHours: number
  hoursBucketU: number
  wagePerMinute: number
  lateMinutesRaw: number
  lateMinutesDeducted: number
  earlyOutMinutes: number
  dailyRateThb: number
  lateDeductionThb: number
  earlyOutDeductionThb: number
  otTotalHours: number
  otPayThb: number
  damageThb: number
  otherDeductionThb: number
  grossWageRaw: number
  grossWageThb: number
  flags: Flag[]
}

export interface EngineConfig {
  defaultDailyRate: number
  otMultiplier: number
  lateBufferMinutes: number
  lateRoundingUnit: number
  paidLeaveClassifications: string[]
}

export const DEFAULT_CONFIG: EngineConfig = {
  defaultDailyRate: 500,
  otMultiplier: 1.5,
  lateBufferMinutes: 0,
  lateRoundingUnit: 0,
  paidLeaveClassifications: [],
}

const BM_PREFIX = /^bm/i
const DW_PREFIX = /^dw/i
const INTERN_KEYWORDS = ['นักศึกษา', 'นศ.']
const HOUSEKEEPER_KEYWORDS = ['แม่บ้าน', 'แมบ้าน']

export function classifyDept(noteRaw?: string): DeptCategory {
  if (!noteRaw) return 'OTHER'
  const note = noteRaw.trim()
  if (BM_PREFIX.test(note)) return 'BM'
  if (DW_PREFIX.test(note)) return 'DW'
  if (INTERN_KEYWORDS.some(k => note.includes(k))) return 'INTERN'
  if (HOUSEKEEPER_KEYWORDS.some(k => note.includes(k))) return 'HOUSEKEEPER'
  return 'OTHER'
}

function parseHHmm(s?: string): number | null {
  if (!s) return null
  const m = String(s).trim().match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

function parseShift(shiftCode?: string): { start: number; end: number; startStr: string; endStr: string } | null {
  if (!shiftCode) return null
  const parts = String(shiftCode).split(/[-–—]/).map(s => s.trim())
  if (parts.length < 2) return null
  const start = parseHHmm(parts[0])
  const end = parseHHmm(parts[1])
  if (start == null || end == null) return null
  return { start, end, startStr: parts[0].slice(0, 5), endStr: parts[1].slice(0, 5) }
}

function parseTimeMinutes(s?: string): number | null {
  if (!s) return null
  const str = String(s).trim()
  if (str.includes('T')) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  }
  const dt = str.match(/(\d{1,2}):(\d{2}):(\d{2})/) || str.match(/(\d{1,2}):(\d{2})/)
  if (dt) {
    return parseInt(dt[1], 10) * 60 + parseInt(dt[2], 10) + (dt[3] ? parseInt(dt[3], 10) / 60 : 0)
  }
  return null
}

const SICK_KEYWORDS = ['ลาป่วย', 'ลาไปหาหมอ', 'หาหมอ']
const PERSONAL_LEAVE_KEYWORDS = ['ลากิจ', 'ลาบ่าย', 'ลางานช่วงบ่าย', 'แจ้งลา', 'ลากลับ']
const MANUAL_CHECKIN_KEYWORDS = ['โทรศัพท์เข้าแอป', 'ไม่ได้เช็คอิน', 'แอปไม่ได้']

function detectFlagsFromNote(note?: string): Flag[] {
  if (!note) return []
  const flags: Flag[] = []
  if (SICK_KEYWORDS.some(k => note.includes(k))) flags.push('SICK_LEAVE')
  if (PERSONAL_LEAVE_KEYWORDS.some(k => note.includes(k))) flags.push('PERSONAL_LEAVE')
  if (MANUAL_CHECKIN_KEYWORDS.some(k => note.includes(k))) flags.push('MANUAL_CHECKIN')
  return flags
}

function round2(n: number): number { return Math.round(n * 100) / 100 }
function round4(n: number): number { return Math.round(n * 10000) / 10000 }

export function computePayroll(row: AttendanceRow, config: EngineConfig = DEFAULT_CONFIG): PayrollResult {
  const flags: Flag[] = [...detectFlagsFromNote(row.manualNote)]
  const deptCategory = classifyDept(row.note)
  const shift = parseShift(row.shiftCode)

  if (deptCategory === 'INTERN') flags.push('INTERN_EXEMPT')
  if (deptCategory === 'HOUSEKEEPER') flags.push('HOUSEKEEPER_EXEMPT')

  let crossesMidnight = false
  let shiftDurationHours = 0
  let U = 8

  if (shift) {
    const rawDur = shift.end >= shift.start
      ? (shift.end - shift.start) / 60
      : ((24 * 60 - shift.start) + shift.end) / 60
    crossesMidnight = shift.end < shift.start
    shiftDurationHours = rawDur
    U = rawDur <= 6 ? 5 : 8
  } else {
    flags.push('UNKNOWN_SHIFT')
  }

  const dailyRate = config.defaultDailyRate
  const wagePerMinute = dailyRate / (U * 60)

  const checkinMin = parseTimeMinutes(row.checkin)
  const checkoutMin = parseTimeMinutes(row.checkout)

  if (checkinMin == null) flags.push('NO_CHECKIN')
  if (checkoutMin == null) flags.push('NO_CHECKOUT')

  let lateMinutesRaw = 0
  if (shift && checkinMin != null) {
    if (crossesMidnight && checkinMin < shift.end) {
      lateMinutesRaw = 0
    } else {
      lateMinutesRaw = Math.max(0, checkinMin - shift.start)
    }
  }
  let lateAfterBuffer = Math.max(0, lateMinutesRaw - config.lateBufferMinutes)
  if (config.lateRoundingUnit > 1) {
    lateAfterBuffer = Math.ceil(lateAfterBuffer / config.lateRoundingUnit) * config.lateRoundingUnit
  }

  const lateMinutesDeducted = (deptCategory === 'BM' || deptCategory === 'DW') ? lateAfterBuffer : 0
  const lateDeductionThb = round2(wagePerMinute * lateMinutesDeducted)

  let earlyOutMinutes = 0
  if (shift && checkoutMin != null) {
    if (crossesMidnight && checkoutMin > shift.start) {
      earlyOutMinutes = Math.max(0, (24 * 60 + shift.end) - checkoutMin)
    } else {
      earlyOutMinutes = Math.max(0, shift.end - checkoutMin)
    }
  }

  let earlyOutDeductionThb = round2(wagePerMinute * earlyOutMinutes)
  const noteLeave = row.manualNote || ''
  if (config.paidLeaveClassifications.some(k => noteLeave.includes(k))) {
    earlyOutDeductionThb = 0
  }

  const otTotal = (row.otBeforeHours || 0) + (row.otAfterHours || 0)
  const otPayThb = round2((dailyRate / U) * config.otMultiplier * otTotal)

  const damage = row.damageDeduction || 0
  const other = row.otherDeduction || 0
  if (damage >= dailyRate && damage > 0) flags.push('DAMAGE_OFFSETS_WAGE')

  const grossRaw = dailyRate - lateDeductionThb - earlyOutDeductionThb - damage - other + otPayThb
  let gross = round2(Math.max(0, grossRaw))
  if (grossRaw < 0) flags.push('NEGATIVE_FLOORED')

  if (checkinMin == null && checkoutMin == null && otTotal === 0) {
    gross = 0
    flags.push('ABSENT')
  }

  return {
    ...row,
    deptCategory,
    shiftStart: shift?.startStr,
    shiftEnd: shift?.endStr,
    crossesMidnight,
    shiftDurationHours: round2(shiftDurationHours),
    hoursBucketU: U,
    wagePerMinute: round4(wagePerMinute),
    lateMinutesRaw: round2(lateMinutesRaw),
    lateMinutesDeducted: round2(lateMinutesDeducted),
    earlyOutMinutes: round2(earlyOutMinutes),
    dailyRateThb: dailyRate,
    lateDeductionThb,
    earlyOutDeductionThb,
    otTotalHours: round2(otTotal),
    otPayThb,
    damageThb: damage,
    otherDeductionThb: other,
    grossWageRaw: round2(grossRaw),
    grossWageThb: gross,
    flags,
  }
}
