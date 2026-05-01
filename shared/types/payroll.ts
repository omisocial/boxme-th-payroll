// Shared payroll types — used by both FE and API

export type DeptCategory = 'BM' | 'DW' | 'INTERN' | 'HOUSEKEEPER' | 'OTHER'

export interface AttendanceRow {
  sheet: string
  rowIndex: number
  workDate: string // YYYY-MM-DD
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

export type Flag =
  | 'NO_CHECKIN'
  | 'NO_CHECKOUT'
  | 'ABSENT'
  | 'NEGATIVE_FLOORED'
  | 'DAMAGE_OFFSETS_WAGE'
  | 'INTERN_EXEMPT'
  | 'HOUSEKEEPER_EXEMPT'
  | 'MANUAL_CHECKIN'
  | 'SICK_LEAVE'
  | 'PERSONAL_LEAVE'
  | 'UNKNOWN_SHIFT'

export interface EngineConfig {
  defaultDailyRate: number
  otMultiplier: number
  lateBufferMinutes: number
  lateRoundingUnit: number
  paidLeaveClassifications: string[]
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  defaultDailyRate: 500,
  otMultiplier: 1.5,
  lateBufferMinutes: 0,
  lateRoundingUnit: 0,
  paidLeaveClassifications: [],
}
