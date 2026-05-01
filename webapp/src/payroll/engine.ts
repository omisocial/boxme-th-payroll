import type { AttendanceRow, DeptCategory, EngineConfig, Flag, PayrollResult } from './types'
export type { EngineConfig } from './types'
export { DEFAULT_ENGINE_CONFIG as DEFAULT_CONFIG } from './types'

import { DEFAULT_ENGINE_CONFIG } from './types'

function buildPrefixRegex(prefixes: string[]): RegExp | null {
  if (!prefixes.length) return null
  const escaped = prefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp('^(' + escaped.join('|') + ')', 'i')
}

export function classifyDept(noteRaw?: string, config: EngineConfig = DEFAULT_ENGINE_CONFIG): DeptCategory {
  if (!noteRaw) return 'OTHER'
  const note = noteRaw.trim()
  const bmRe = buildPrefixRegex(config.bmPrefixes)
  const dwRe = buildPrefixRegex(config.dwPrefixes)
  if (bmRe && bmRe.test(note)) return 'BM'
  if (dwRe && dwRe.test(note)) return 'DW'
  if (config.internKeywords.some(k => note.includes(k))) return 'INTERN'
  if (config.housekeeperKeywords.some(k => note.includes(k))) return 'HOUSEKEEPER'
  return 'OTHER'
}

// Parse "HH:mm" to minutes-of-day
function parseHHmm(s?: string): number | null {
  if (!s) return null
  const m = String(s).trim().match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

function parseShift(shiftCode?: string): { start: number; end: number; startStr: string; endStr: string } | null {
  if (!shiftCode) return null
  // expected "08:30 - 17:30" — tolerant of dashes/spaces
  const parts = String(shiftCode).split(/[-–—]/).map(s => s.trim())
  if (parts.length < 2) return null
  const start = parseHHmm(parts[0])
  const end = parseHHmm(parts[1])
  if (start == null || end == null) return null
  return {
    start, end,
    startStr: parts[0].slice(0, 5),
    endStr: parts[1].slice(0, 5),
  }
}

// Parse a checkin/checkout to minutes-of-day. Accepts "HH:mm:ss", ISO, or Excel date string.
function parseTimeMinutes(s?: string): number | null {
  if (!s) return null
  const str = String(s).trim()
  // ISO with T
  if (str.includes('T')) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  }
  // "YYYY-MM-DD HH:mm:ss"
  const dt = str.match(/(\d{1,2}):(\d{2}):(\d{2})/) || str.match(/(\d{1,2}):(\d{2})/)
  if (dt) {
    const h = parseInt(dt[1], 10)
    const m = parseInt(dt[2], 10)
    const sec = dt[3] ? parseInt(dt[3], 10) : 0
    return h * 60 + m + sec / 60
  }
  return null
}

function detectFlagsFromNote(note: string | undefined, config: EngineConfig): Flag[] {
  if (!note) return []
  const flags: Flag[] = []
  if (config.sickLeaveKeywords.some(k => note.includes(k))) flags.push('SICK_LEAVE')
  if (config.personalLeaveKeywords.some(k => note.includes(k))) flags.push('PERSONAL_LEAVE')
  if (config.manualCheckinKeywords.some(k => note.includes(k))) flags.push('MANUAL_CHECKIN')
  return flags
}

export function computePayroll(
  row: AttendanceRow,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG
): PayrollResult {
  const flags: Flag[] = [...detectFlagsFromNote(row.manualNote, config)]
  const deptCategory = classifyDept(row.note, config)
  const shift = parseShift(row.shiftCode)

  if (deptCategory === 'INTERN') flags.push('INTERN_EXEMPT')
  if (deptCategory === 'HOUSEKEEPER') flags.push('HOUSEKEEPER_EXEMPT')

  let crossesMidnight = false
  let shiftDurationHours = 0
  let U = 8

  if (shift) {
    const rawDur = shift.end >= shift.start ? (shift.end - shift.start) / 60 : ((24 * 60 - shift.start) + shift.end) / 60
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

  // late minutes
  let lateMinutesRaw = 0
  if (shift && checkinMin != null) {
    if (crossesMidnight && checkinMin < shift.end) {
      // night shift checkin past midnight — treat as 0 late (Q-24 default)
      lateMinutesRaw = 0
    } else {
      lateMinutesRaw = Math.max(0, checkinMin - shift.start)
    }
  }
  let lateAfterBuffer = Math.max(0, lateMinutesRaw - config.lateBufferMinutes)
  if (config.lateRoundingUnit > 1) {
    lateAfterBuffer = Math.ceil(lateAfterBuffer / config.lateRoundingUnit) * config.lateRoundingUnit
  }

  // Late penalty applies only to BM / DW (per Excel V column)
  const lateMinutesDeducted = (deptCategory === 'BM' || deptCategory === 'DW') ? lateAfterBuffer : 0
  const lateDeductionThb = round2(wagePerMinute * lateMinutesDeducted)

  // early-out
  let earlyOutMinutes = 0
  if (shift && checkoutMin != null) {
    if (crossesMidnight && checkoutMin > shift.start) {
      // checkout before midnight on a night shift => big early-out
      earlyOutMinutes = Math.max(0, (24 * 60 + shift.end) - checkoutMin)
    } else {
      earlyOutMinutes = Math.max(0, shift.end - checkoutMin)
    }
  }

  // paid leave skip early-out (configurable, default off per Excel)
  let earlyOutDeductionThb = round2(wagePerMinute * earlyOutMinutes)
  const noteLeave = row.manualNote || ''
  if (config.paidLeaveClassifications.some(k => noteLeave.includes(k))) {
    earlyOutDeductionThb = 0
  }

  // OT
  const otTotal = (row.otBeforeHours || 0) + (row.otAfterHours || 0)
  const otPayThb = round2((dailyRate / U) * config.otMultiplier * otTotal)

  const damage = row.damageDeduction || 0
  const other = row.otherDeduction || 0
  if (damage >= dailyRate && damage > 0) flags.push('DAMAGE_OFFSETS_WAGE')

  const grossRaw = dailyRate - lateDeductionThb - earlyOutDeductionThb - damage - other + otPayThb
  let gross = round2(Math.max(0, grossRaw))
  if (grossRaw < 0) flags.push('NEGATIVE_FLOORED')

  // No checkin and no checkout → treat as absent (gross = 0)
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

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}
