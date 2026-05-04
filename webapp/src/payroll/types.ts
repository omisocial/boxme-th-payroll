export type DeptCategory = 'BM' | 'DW' | 'INTERN' | 'HOUSEKEEPER' | 'OTHER'

export interface EngineConfig {
  countryCode: string
  warehouseId?: string | null
  currency: string
  currencySymbol: string
  defaultDailyRate: number
  otMultiplier: number
  lateBufferMinutes: number
  lateRoundingUnit: number
  paidLeaveClassifications: string[]
  bmPrefixes: string[]
  dwPrefixes: string[]
  internKeywords: string[]
  housekeeperKeywords: string[]
  sickLeaveKeywords: string[]
  personalLeaveKeywords: string[]
  manualCheckinKeywords: string[]
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  countryCode: 'TH',
  warehouseId: null,
  currency: 'THB',
  currencySymbol: '฿',
  defaultDailyRate: 500,
  otMultiplier: 1.5,
  lateBufferMinutes: 0,
  lateRoundingUnit: 0,
  paidLeaveClassifications: [],
  bmPrefixes: ['bm'],
  dwPrefixes: ['dw'],
  internKeywords: ['นักศึกษา', 'นศ.'],
  housekeeperKeywords: ['แม่บ้าน', 'แมบ้าน'],
  sickLeaveKeywords: ['ลาป่วย', 'ลาไปหาหมอ', 'หาหมอ'],
  personalLeaveKeywords: ['ลากิจ', 'ลาบ่าย', 'ลางานช่วงบ่าย', 'แจ้งลา', 'ลากลับ'],
  manualCheckinKeywords: ['โทรศัพท์เข้าแอป', 'ไม่ได้เช็คอิน', 'แอปไม่ได้'],
}

export interface Member {
  fullName: string
  nickname?: string
  phone?: string
  bankAccount?: string
  bankCode?: string
  department?: string
  startDate?: string
  employeeCode?: string  // Boxme HRMS employee ID (e.g. BKK-1234)
  nationalId?: string    // Citizen ID / CCCD / Passport
}

export interface AttendanceRow {
  // raw inputs from sheet
  sheet: string
  rowIndex: number
  workDate: string // YYYY-MM-DD
  fullName: string
  nickname?: string
  checkin?: string // ISO or HH:mm:ss
  checkout?: string
  note?: string // dept code (col E)
  shiftCode?: string // e.g. "08:30 - 17:30"
  manualNote?: string // K
  otBeforeHours?: number
  otAfterHours?: number
  damageDeduction?: number
  otherDeduction?: number
}

export interface PayrollResult extends AttendanceRow {
  deptCategory: DeptCategory
  shiftStart?: string // HH:mm
  shiftEnd?: string
  crossesMidnight: boolean
  shiftDurationHours: number
  hoursBucketU: number // 5 or 8
  wagePerMinute: number
  lateMinutesRaw: number
  lateMinutesDeducted: number // 0 if intern/housekeeper
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

export interface DamageRecord {
  fullName: string
  nickname?: string
  department?: string
  amountThb: number
  warehouse?: string
  status?: 'deducted' | 'pending' | 'unknown'
  incidentDateText?: string
  deductionDateText?: string
  rawRow: number
}

import type { ColumnMapping } from './mapping'

export interface ParsedWorkbook {
  fileName: string
  members: Member[]
  attendance: AttendanceRow[]
  damages: DamageRecord[]
  daysFound: string[] // sheet names of วันที่ X
  warnings: string[]
  requiresMapping?: boolean
  sampleHeaders?: (string | null)[]
  // First 3 values per column index from the first daily sheet data rows.
  // Used by MappingDialog to show sample data next to each column name.
  sampleValues?: Record<number, string[]>
  suggestedMapping?: ColumnMapping
  mappingSource?: 'saved' | 'auto' | 'default'
  // Which row index the header was detected at (0 = new format, 7 = legacy)
  detectedHeaderRow?: number
}

export interface PeriodSummary {
  totalDays: number
  totalWorkers: number
  totalGrossThb: number
  totalOtThb: number
  totalLateThb: number
  totalEarlyOutThb: number
  totalDamageThb: number
  totalShifts: number
}

export interface WorkerSummary {
  fullName: string
  nickname?: string
  bankAccount?: string
  bankCode?: string
  department?: string
  employeeCode?: string  // Boxme HRMS employee ID
  nationalId?: string    // Citizen ID / CCCD / Passport
  shifts: number
  totalGross: number
  totalOt: number
  totalLate: number
  totalEarlyOut: number
  totalDamage: number
  rows: PayrollResult[]
}
