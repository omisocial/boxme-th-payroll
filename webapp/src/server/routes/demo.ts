/**
 * Demo Data Route — Boxme Thailand Audit
 *
 * Provides one-click seeding of realistic Thai worker + attendance data
 * covering 13 payroll audit scenarios for the month of April 2026.
 *
 * Endpoints:
 *   GET    /api/demo/status  — check if demo data is loaded (hr+)
 *   POST   /api/demo/seed    — load demo data         (super_admin)
 *   DELETE /api/demo/reset   — clear all demo data    (super_admin)
 */

import { Hono } from 'hono'
import { guard, type Env } from '../auth/rbac'
import { computePayroll, DEFAULT_CONFIG, type AttendanceRow } from '../engines/compute'
import { resolveRateConfig, appendAuditLog } from '../db/queries'
import { getSupabase, type SB } from '../db/supabase'

const demoRouter = new Hono<{ Bindings: Env }>()

// ─── Constants ───────────────────────────────────────────────────────────────

const DEMO_BATCH_ID = 'demo-seed-th-2026-04'
const DEMO_TAG      = '[DEMO]'
const DEMO_COUNTRY  = 'TH'

// Shift time-range strings used in attendance_records.shift_code (parsed by engine)
const SHIFT = {
  MORNING:   '08:30 - 17:30',
  AFTERNOON: '13:00 - 22:00',
  NIGHT_A:   '22:00 - 07:00',
  NIGHT_B:   '20:00 - 05:00',
} as const

// Dept-note values for attendance.note (drive classifyDept in engine)
const DEPT_NOTE = {
  BM:          'BM',
  DW:          'DW',
  HOUSEKEEPER: 'แม่บ้าน',
  INTERN:      'นักศึกษา',
} as const

// ─── Worker Definitions ───────────────────────────────────────────────────────

interface DemoWorkerDef {
  code: string
  name_local: string
  department_code: string
  shift_code: string   // MORNING | AFTERNOON | NIGHT_A | NIGHT_B (worker master)
  job_type_code: string
}

const DEMO_WORKERS: DemoWorkerDef[] = [
  // BM1 — Morning
  { code: 'DEMO-BM1-01', name_local: 'สมชาย รักดี',        department_code: 'BM1',       shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-BM1-02', name_local: 'สมศรี ใจงาม',        department_code: 'BM1',       shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-BM1-03', name_local: 'วิชัย แสงทอง',       department_code: 'BM1',       shift_code: 'MORNING',   job_type_code: 'FORKLIFT'   },
  { code: 'DEMO-BM1-16', name_local: 'ธนกร ใจดี',          department_code: 'BM1',       shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-BM1-17', name_local: 'วรรณา ศรีสุข',       department_code: 'BM1',       shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-BM1-20', name_local: 'พล มหาสุข',          department_code: 'BM1',       shift_code: 'MORNING',   job_type_code: 'SUPERVISOR' },
  // BM3 — Afternoon
  { code: 'DEMO-BM3-04', name_local: 'ประเสริฐ มั่งมี',    department_code: 'BM3',       shift_code: 'AFTERNOON', job_type_code: 'GENERAL'    },
  { code: 'DEMO-BM3-05', name_local: 'กิตติ ดวงดี',        department_code: 'BM3',       shift_code: 'AFTERNOON', job_type_code: 'GENERAL'    },
  { code: 'DEMO-BM3-06', name_local: 'นันทิดา สุขใจ',      department_code: 'BM3',       shift_code: 'AFTERNOON', job_type_code: 'FORKLIFT'   },
  { code: 'DEMO-BM3-18', name_local: 'ณัฐพล ทองแดง',       department_code: 'BM3',       shift_code: 'AFTERNOON', job_type_code: 'GENERAL'    },
  // DW1 — Night A
  { code: 'DEMO-DW1-07', name_local: 'สุรชัย เปี่ยมสุข',   department_code: 'DW1',       shift_code: 'NIGHT_A',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-DW1-08', name_local: 'มาลี รุ่งเรือง',      department_code: 'DW1',       shift_code: 'NIGHT_A',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-DW1-19', name_local: 'สาวิตรี จันทร์ดี',   department_code: 'DW1',       shift_code: 'NIGHT_A',   job_type_code: 'GENERAL'    },
  // DW3 — Night B
  { code: 'DEMO-DW3-09', name_local: 'อนุชา วงศ์ดี',       department_code: 'DW3',       shift_code: 'NIGHT_B',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-DW3-10', name_local: 'ปิยะ ทองดี',          department_code: 'DW3',       shift_code: 'NIGHT_B',   job_type_code: 'FORKLIFT'   },
  { code: 'DEMO-DW3-11', name_local: 'รัตนา พิมพ์ดี',      department_code: 'DW3',       shift_code: 'NIGHT_B',   job_type_code: 'GENERAL'    },
  // Housekeeping — Morning
  { code: 'DEMO-HK-12',  name_local: 'อุบล รัตนา',         department_code: 'HOUSEKEEP', shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-HK-13',  name_local: 'สมใจ ผลดี',          department_code: 'HOUSEKEEP', shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  // Intern — Morning
  { code: 'DEMO-INT-14', name_local: 'จิตรา วิไล',          department_code: 'INTERN',    shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
  { code: 'DEMO-INT-15', name_local: 'พิมพ์ชนก สว่าง',     department_code: 'INTERN',    shift_code: 'MORNING',   job_type_code: 'GENERAL'    },
]

// ─── Attendance Templates ─────────────────────────────────────────────────────

interface AttendanceTemplate {
  name:         string         // matches worker name_local
  date:         string         // YYYY-MM-DD
  ci:           string | null  // checkin  HH:MM
  co:           string | null  // checkout HH:MM
  noteField:    string         // attendance.note → dept classification
  shift:        string         // attendance.shift_code → time range
  manualNote?:  string         // attendance.manual_note → sick/personal/manual flags
  damage?:      number         // damage_deduction (THB)
  otAfter?:     number         // ot_after_hours
  scenario:     string         // audit label (for reference)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function att(
  name: string, date: string,
  ci: string | null, co: string | null,
  noteField: string, shift: string,
  scenario: string,
  extra: { manualNote?: string; damage?: number; otAfter?: number } = {}
): AttendanceTemplate {
  return { name, date, ci, co, noteField, shift, scenario, ...extra }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const M  = SHIFT.MORNING
const A  = SHIFT.AFTERNOON
const NA = SHIFT.NIGHT_A
const NB = SHIFT.NIGHT_B
const BM = DEPT_NOTE.BM
const DW = DEPT_NOTE.DW
const HK = DEPT_NOTE.HOUSEKEEPER
const IN = DEPT_NOTE.INTERN

// Sick/personal/manual keywords (must match engine's detect logic)
const SICK      = 'ลาป่วย'
const PERSONAL  = 'ลากิจ'
const MANUAL_IN = 'โทรศัพท์เข้าแอป'
const MANUAL_IN2= 'ไม่ได้เช็คอิน'

const DEMO_ATTENDANCE: AttendanceTemplate[] = [
  // ═══ สมชาย รักดี — BM1 MORNING (SC01 Normal + SC04 OT + SC12 Absent) ═══════
  att('สมชาย รักดี', '2026-04-01', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมชาย รักดี', '2026-04-04', '08:30', '20:30', BM, M, 'SC04 OT',      { otAfter: 3 }),
  att('สมชาย รักดี', '2026-04-07', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมชาย รักดี', '2026-04-10', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมชาย รักดี', '2026-04-14', null,    null,    BM, M, 'SC12 Absent'),
  att('สมชาย รักดี', '2026-04-17', '08:30', '17:30', BM, M, 'SC01 Normal'),

  // ═══ สมศรี ใจงาม — BM1 MORNING (SC01 + SC02 Late + SC06 Sick) ══════════════
  att('สมศรี ใจงาม', '2026-04-01', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมศรี ใจงาม', '2026-04-02', '09:15', '17:30', BM, M, 'SC02 Late +45m'),
  att('สมศรี ใจงาม', '2026-04-05', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมศรี ใจงาม', '2026-04-08', null,    null,    BM, M, 'SC06 Sick',     { manualNote: SICK }),
  att('สมศรี ใจงาม', '2026-04-12', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมศรี ใจงาม', '2026-04-15', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('สมศรี ใจงาม', '2026-04-19', '08:30', '17:30', BM, M, 'SC01 Normal'),

  // ═══ วิชัย แสงทอง — BM1 MORNING/FORKLIFT (SC01 + SC03 Early out + SC11 Damage) ═══
  att('วิชัย แสงทอง', '2026-04-01', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('วิชัย แสงทอง', '2026-04-03', '08:30', '15:30', BM, M, 'SC03 Early -2h'),
  att('วิชัย แสงทอง', '2026-04-06', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('วิชัย แสงทอง', '2026-04-09', '08:30', '17:30', BM, M, 'SC11 Damage 200', { damage: 200 }),
  att('วิชัย แสงทอง', '2026-04-13', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('วิชัย แสงทอง', '2026-04-16', '08:30', '17:30', BM, M, 'SC01 Normal'),

  // ═══ ธนกร ใจดี — BM1 MORNING (SC11 Damage focus) ══════════════════════════
  att('ธนกร ใจดี', '2026-04-01', '08:30', '17:30', BM, M, 'SC11 Damage 300',  { damage: 300 }),
  att('ธนกร ใจดี', '2026-04-06', '08:30', '17:30', BM, M, 'SC11 Damage 200',  { damage: 200 }),
  att('ธนกร ใจดี', '2026-04-11', '08:30', '17:30', BM, M, 'SC11 Damage 100',  { damage: 100 }),
  att('ธนกร ใจดี', '2026-04-16', '08:30', '17:30', BM, M, 'SC01 Normal'),

  // ═══ วรรณา ศรีสุข — BM1 MORNING (SC12 Absent focus) ════════════════════════
  att('วรรณา ศรีสุข', '2026-04-02', null,    null,    BM, M, 'SC12 Absent'),
  att('วรรณา ศรีสุข', '2026-04-08', null,    null,    BM, M, 'SC12 Absent'),
  att('วรรณา ศรีสุข', '2026-04-14', null,    null,    BM, M, 'SC12 Absent'),
  att('วรรณา ศรีสุข', '2026-04-19', '08:30', '17:30', BM, M, 'SC01 Normal'),

  // ═══ พล มหาสุข — BM1 MORNING (mixed) ═══════════════════════════════════════
  att('พล มหาสุข', '2026-04-04', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('พล มหาสุข', '2026-04-08', '09:00', '17:30', BM, M, 'SC02 Late +30m'),
  att('พล มหาสุข', '2026-04-12', '08:30', '20:00', BM, M, 'SC04 OT 2.5h',    { otAfter: 2.5 }),
  att('พล มหาสุข', '2026-04-16', '08:30', '17:30', BM, M, 'SC01 Normal'),
  att('พล มหาสุข', '2026-04-20', '08:30', '17:30', BM, M, 'SC01 Normal'),

  // ═══ ประเสริฐ มั่งมี — BM3 AFTERNOON (SC01 + SC07 Personal leave + SC02 Late) ═══
  att('ประเสริฐ มั่งมี', '2026-04-01', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('ประเสริฐ มั่งมี', '2026-04-02', null,    null,    BM, A, 'SC07 Personal', { manualNote: PERSONAL }),
  att('ประเสริฐ มั่งมี', '2026-04-07', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('ประเสริฐ มั่งมี', '2026-04-09', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('ประเสริฐ มั่งมี', '2026-04-14', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('ประเสริฐ มั่งมี', '2026-04-18', '13:45', '22:00', BM, A, 'SC02 Late +45m'),

  // ═══ กิตติ ดวงดี — BM3 AFTERNOON (SC01 + SC03 + SC04 OT) ══════════════════
  att('กิตติ ดวงดี', '2026-04-02', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('กิตติ ดวงดี', '2026-04-05', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('กิตติ ดวงดี', '2026-04-09', '13:00', '19:30', BM, A, 'SC03 Early -2.5h'),
  att('กิตติ ดวงดี', '2026-04-11', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('กิตติ ดวงดี', '2026-04-15', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('กิตติ ดวงดี', '2026-04-19', '13:00', '23:30', BM, A, 'SC04 OT 1.5h',   { otAfter: 1.5 }),

  // ═══ นันทิดา สุขใจ — BM3 AFTERNOON/FORKLIFT (SC01 + SC02 Late) ════════════
  att('นันทิดา สุขใจ', '2026-04-03', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('นันทิดา สุขใจ', '2026-04-06', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('นันทิดา สุขใจ', '2026-04-10', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('นันทิดา สุขใจ', '2026-04-13', '13:30', '22:00', BM, A, 'SC02 Late +30m'),
  att('นันทิดา สุขใจ', '2026-04-17', '13:00', '22:00', BM, A, 'SC01 Normal'),
  att('นันทิดา สุขใจ', '2026-04-20', '13:00', '22:00', BM, A, 'SC01 Normal'),

  // ═══ ณัฐพล ทองแดง — BM3 AFTERNOON (SC08 Manual check-in focus) ═════════════
  att('ณัฐพล ทองแดง', '2026-04-03', '13:00', '22:00', BM, A, 'SC08 Manual', { manualNote: MANUAL_IN  }),
  att('ณัฐพล ทองแดง', '2026-04-09', '13:00', '22:00', BM, A, 'SC08 Manual', { manualNote: MANUAL_IN  }),
  att('ณัฐพล ทองแดง', '2026-04-15', '13:00', '22:00', BM, A, 'SC08 Manual', { manualNote: MANUAL_IN2 }),
  att('ณัฐพล ทองแดง', '2026-04-20', '13:00', '22:00', BM, A, 'SC01 Normal'),

  // ═══ สุรชัย เปี่ยมสุข — DW1 NIGHT_A (SC05 Night) ═══════════════════════════
  att('สุรชัย เปี่ยมสุข', '2026-04-01', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('สุรชัย เปี่ยมสุข', '2026-04-04', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('สุรชัย เปี่ยมสุข', '2026-04-08', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('สุรชัย เปี่ยมสุข', '2026-04-12', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('สุรชัย เปี่ยมสุข', '2026-04-17', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('สุรชัย เปี่ยมสุข', '2026-04-20', '22:00', '07:00', DW, NA, 'SC05 Night A'),

  // ═══ มาลี รุ่งเรือง — DW1 NIGHT_A (SC05 + SC02 Late night) ════════════════
  att('มาลี รุ่งเรือง', '2026-04-02', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('มาลี รุ่งเรือง', '2026-04-05', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('มาลี รุ่งเรือง', '2026-04-09', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('มาลี รุ่งเรือง', '2026-04-13', '22:00', '07:00', DW, NA, 'SC05 Night A'),
  att('มาลี รุ่งเรือง', '2026-04-18', '22:30', '07:00', DW, NA, 'SC02 Late Night +30m'),

  // ═══ สาวิตรี จันทร์ดี — DW1 NIGHT_A (SC13 Night OT focus) ══════════════════
  att('สาวิตรี จันทร์ดี', '2026-04-05', '22:00', '09:00', DW, NA, 'SC13 Night OT +2h', { otAfter: 2 }),
  att('สาวิตรี จันทร์ดี', '2026-04-11', '22:00', '10:00', DW, NA, 'SC13 Night OT +3h', { otAfter: 3 }),
  att('สาวิตรี จันทร์ดี', '2026-04-17', '22:00', '09:00', DW, NA, 'SC13 Night OT +2h', { otAfter: 2 }),

  // ═══ อนุชา วงศ์ดี — DW3 NIGHT_B (SC05 Night B) ═════════════════════════════
  att('อนุชา วงศ์ดี', '2026-04-01', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('อนุชา วงศ์ดี', '2026-04-05', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('อนุชา วงศ์ดี', '2026-04-10', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('อนุชา วงศ์ดี', '2026-04-14', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('อนุชา วงศ์ดี', '2026-04-19', '20:00', '05:00', DW, NB, 'SC05 Night B'),

  // ═══ ปิยะ ทองดี — DW3 NIGHT_B (SC05 Night B) ═══════════════════════════════
  att('ปิยะ ทองดี', '2026-04-03', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('ปิยะ ทองดี', '2026-04-07', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('ปิยะ ทองดี', '2026-04-11', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('ปิยะ ทองดี', '2026-04-15', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('ปิยะ ทองดี', '2026-04-20', '20:00', '05:00', DW, NB, 'SC05 Night B'),

  // ═══ รัตนา พิมพ์ดี — DW3 NIGHT_B (SC05 + SC02 Late) ════════════════════════
  att('รัตนา พิมพ์ดี', '2026-04-02', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('รัตนา พิมพ์ดี', '2026-04-06', '20:00', '05:00', DW, NB, 'SC05 Night B'),
  att('รัตนา พิมพ์ดี', '2026-04-12', '20:30', '05:00', DW, NB, 'SC02 Late Night B +30m'),
  att('รัตนา พิมพ์ดี', '2026-04-16', '20:00', '05:00', DW, NB, 'SC05 Night B'),

  // ═══ อุบล รัตนา — HOUSEKEEP MORNING (SC10 Housekeeper exempt) ════════════════
  att('อุบล รัตนา', '2026-04-01', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),
  att('อุบล รัตนา', '2026-04-05', '09:00', '17:30', HK, M, 'SC10 HK Late (no deduct)'),
  att('อุบล รัตนา', '2026-04-10', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),
  att('อุบล รัตนา', '2026-04-15', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),
  att('อุบล รัตนา', '2026-04-20', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),

  // ═══ สมใจ ผลดี — HOUSEKEEP MORNING (SC10) ═══════════════════════════════════
  att('สมใจ ผลดี', '2026-04-02', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),
  att('สมใจ ผลดี', '2026-04-07', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),
  att('สมใจ ผลดี', '2026-04-12', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),
  att('สมใจ ผลดี', '2026-04-17', '08:30', '17:30', HK, M, 'SC10 HK Exempt'),

  // ═══ จิตรา วิไล — INTERN MORNING (SC09 Intern exempt) ════════════════════════
  att('จิตรา วิไล', '2026-04-01', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
  att('จิตรา วิไล', '2026-04-05', '09:30', '17:30', IN, M, 'SC09 Intern Late (no deduct)'),
  att('จิตรา วิไล', '2026-04-10', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
  att('จิตรา วิไล', '2026-04-15', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
  att('จิตรา วิไล', '2026-04-20', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),

  // ═══ พิมพ์ชนก สว่าง — INTERN MORNING (SC09) ════════════════════════════════
  att('พิมพ์ชนก สว่าง', '2026-04-03', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
  att('พิมพ์ชนก สว่าง', '2026-04-08', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
  att('พิมพ์ชนก สว่าง', '2026-04-13', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
  att('พิมพ์ชนก สว่าง', '2026-04-18', '08:30', '17:30', IN, M, 'SC09 Intern Exempt'),
]

// ─── Helper: compute payroll inline (no DB refetch) ──────────────────────────

function computeRow(
  rec: {
    id: string
    work_date: string; full_name: string
    checkin: string | null; checkout: string | null
    note: string | null; shift_code: string | null; manual_note: string | null
    ot_before_hours: number; ot_after_hours: number
    damage_deduction: number; other_deduction: number
    import_batch_id: string
  },
  config: typeof DEFAULT_CONFIG,
  country: string
) {
  const row: AttendanceRow = {
    sheet:           rec.import_batch_id,
    rowIndex:        0,
    workDate:        rec.work_date,
    fullName:        rec.full_name,
    checkin:         rec.checkin  ?? undefined,
    checkout:        rec.checkout ?? undefined,
    note:            rec.note     ?? undefined,
    shiftCode:       rec.shift_code  ?? undefined,
    manualNote:      rec.manual_note ?? undefined,
    otBeforeHours:   rec.ot_before_hours,
    otAfterHours:    rec.ot_after_hours,
    damageDeduction: rec.damage_deduction,
    otherDeduction:  rec.other_deduction,
  }
  const r = computePayroll(row, config)
  return {
    attendance_id:           rec.id,
    country_code:            country,
    dept_category:           r.deptCategory,
    shift_start:             r.shiftStart   ?? null,
    shift_end:               r.shiftEnd     ?? null,
    crosses_midnight:        r.crossesMidnight,
    shift_duration_hours:    r.shiftDurationHours,
    hours_bucket_u:          r.hoursBucketU,
    wage_per_minute:         r.wagePerMinute,
    late_minutes_raw:        r.lateMinutesRaw,
    late_minutes_deducted:   r.lateMinutesDeducted,
    early_out_minutes:       r.earlyOutMinutes,
    daily_rate_thb:          r.dailyRateThb,
    late_deduction_thb:      r.lateDeductionThb,
    early_out_deduction_thb: r.earlyOutDeductionThb,
    ot_total_hours:          r.otTotalHours,
    ot_pay_thb:              r.otPayThb,
    damage_thb:              r.damageThb,
    other_deduction_thb:     r.otherDeductionThb,
    gross_wage_raw:          r.grossWageRaw,
    gross_wage_thb:          r.grossWageThb,
    flags_json:              r.flags,
    computed_at:             new Date().toISOString(),
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/demo/status
demoRouter.get('/status', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)

  const [workerRes, attRes] = await Promise.all([
    sb.from('workers')
      .select('id', { count: 'exact', head: true })
      .eq('country_code', DEMO_COUNTRY)
      .like('notes', `%${DEMO_TAG}%`)
      .is('deleted_at', null),
    sb.from('attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('import_batch_id', DEMO_BATCH_ID)
      .is('deleted_at', null),
  ])

  const workerCount = workerRes.count ?? 0
  const attCount    = attRes.count ?? 0

  // Count computed payroll rows via join
  let computedCount = 0
  if (attCount > 0) {
    const { count } = await sb.from('payroll_daily')
      .select('id', { count: 'exact', head: true })
      .in(
        'attendance_id',
        (await sb.from('attendance_records')
          .select('id')
          .eq('import_batch_id', DEMO_BATCH_ID)
          .is('deleted_at', null)
        ).data?.map((r: Record<string, unknown>) => r['id']) ?? []
      )
    computedCount = count ?? 0
  }

  return c.json({
    success: true,
    data: {
      loaded:        workerCount > 0,
      workerCount,
      attendanceCount: attCount,
      computedCount,
    },
  })
})

// POST /api/demo/seed
demoRouter.post('/seed', ...guard('super_admin'), async (c) => {
  const sb    = getSupabase(c.env)
  const user  = c.get('user')

  // ① Guard: check not already loaded
  const { count: existing } = await sb.from('workers')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', DEMO_COUNTRY)
    .like('notes', `%${DEMO_TAG}%`)
    .is('deleted_at', null)

  if ((existing ?? 0) > 0) {
    return c.json({
      success: false,
      message: 'Demo data already loaded. Use DELETE /api/demo/reset first.',
      data: { alreadyLoaded: true },
    }, 409)
  }

  // ② Get first active TH warehouse
  const { data: whs, error: whErr } = await sb.from('warehouses')
    .select('id, name')
    .eq('country_code', DEMO_COUNTRY)
    .eq('active', true)
    .order('name')
    .limit(1)

  if (whErr || !whs || whs.length === 0) {
    return c.json({ success: false, message: 'No active TH warehouse found.' }, 500)
  }
  const warehouseId = (whs[0] as Record<string, unknown>)['id'] as string

  // ③ Insert 20 workers
  const workerRows = DEMO_WORKERS.map(w => ({
    country_code:    DEMO_COUNTRY,
    warehouse_id:    warehouseId,
    code:            w.code,
    name_local:      w.name_local,
    department_code: w.department_code,
    shift_code:      w.shift_code,
    job_type_code:   w.job_type_code,
    status:          'active',
    created_via:     'manual',
    notes:           DEMO_TAG,
    start_date:      '2026-01-01',
  }))

  const { data: insertedWorkers, error: wErr } = await sb
    .from('workers')
    .insert(workerRows)
    .select('id, name_local')

  if (wErr || !insertedWorkers) {
    return c.json({ success: false, message: `Worker insert failed: ${wErr?.message}` }, 500)
  }

  // Build name → id lookup
  const nameToId = new Map<string, string>()
  for (const w of insertedWorkers as Array<{ id: string; name_local: string }>) {
    nameToId.set(w.name_local, w.id)
  }

  // ④ Fetch rate config once (country-wide TH rate)
  const rateConfig  = await resolveRateConfig(sb, DEMO_COUNTRY, null, '2026-04-01')
  const engineConfig = {
    ...DEFAULT_CONFIG,
    defaultDailyRate: rateConfig?.base_daily    ?? DEFAULT_CONFIG.defaultDailyRate,
    otMultiplier:     rateConfig?.ot_multiplier ?? DEFAULT_CONFIG.otMultiplier,
  }

  // ⑤ Build attendance records (with worker_id linked)
  const now     = new Date().toISOString()
  const attRows = DEMO_ATTENDANCE.map(t => ({
    country_code:     DEMO_COUNTRY,
    warehouse_id:     warehouseId,
    worker_id:        nameToId.get(t.name) ?? null,
    work_date:        t.date,
    full_name:        t.name,
    checkin:          t.ci,
    checkout:         t.co,
    note:             t.noteField,
    manual_note:      t.manualNote ?? null,
    shift_code:       t.shift,
    ot_before_hours:  0,
    ot_after_hours:   t.otAfter  ?? 0,
    damage_deduction: t.damage   ?? 0,
    other_deduction:  0,
    import_batch_id:  DEMO_BATCH_ID,
    created_by:       user.email,
    created_at:       now,
  }))

  // ⑥ Batch insert attendance (chunks of 50)
  const BATCH = 50
  const insertedAtt: Array<Record<string, unknown>> = []
  let attErrors: string[] = []

  for (let i = 0; i < attRows.length; i += BATCH) {
    const chunk = attRows.slice(i, i + BATCH)
    const { data, error } = await sb.from('attendance_records')
      .insert(chunk)
      .select('id, work_date, full_name, checkin, checkout, note, shift_code, manual_note, ot_before_hours, ot_after_hours, damage_deduction, other_deduction, import_batch_id')

    if (error) {
      attErrors.push(error.message)
    } else if (data) {
      insertedAtt.push(...(data as Array<Record<string, unknown>>))
    }
  }

  // ⑦ Compute payroll inline + batch upsert payroll_daily
  const payrollRows = insertedAtt.map(rec =>
    computeRow(rec as Parameters<typeof computeRow>[0], engineConfig, DEMO_COUNTRY)
  )

  let computedCount = 0
  for (let i = 0; i < payrollRows.length; i += BATCH) {
    const chunk = payrollRows.slice(i, i + BATCH)
    const { error } = await sb.from('payroll_daily')
      .upsert(chunk, { onConflict: 'attendance_id' })
    if (!error) computedCount += chunk.length
  }

  // ⑧ Audit log
  await appendAuditLog(sb, {
    user_id:      user.id,
    user_email:   user.email,
    action:       'demo_seed',
    entity:       'demo',
    entity_id:    DEMO_BATCH_ID,
    country_code: DEMO_COUNTRY,
    after: {
      workers:    insertedWorkers.length,
      attendance: insertedAtt.length,
      computed:   computedCount,
      warehouse:  warehouseId,
    },
  })

  return c.json({
    success: true,
    data: {
      workers:         insertedWorkers.length,
      attendance:      insertedAtt.length,
      computed:        computedCount,
      attendanceErrors: attErrors,
      warehouseName:   (whs[0] as Record<string, unknown>)['name'],
      periodCovered:   'April 2026 (days 1–20)',
      scenarios: [
        'SC01 Normal attendance',
        'SC02 Late arrival (deduction)',
        'SC03 Early departure (deduction)',
        'SC04 Overtime ×1.5',
        'SC05 Night shift crossing midnight',
        'SC06 Sick leave (ลาป่วย)',
        'SC07 Personal leave (ลากิจ)',
        'SC08 Manual check-in (โทรศัพท์เข้าแอป)',
        'SC09 Intern exempt (นักศึกษา)',
        'SC10 Housekeeper exempt (แม่บ้าน)',
        'SC11 Damage deduction',
        'SC12 Absent (no show)',
        'SC13 Night shift OT',
      ],
    },
  }, 201)
})

// DELETE /api/demo/reset
demoRouter.delete('/reset', ...guard('super_admin'), async (c) => {
  const sb   = getSupabase(c.env)
  const user = c.get('user')

  // ① Get attendance IDs to delete payroll_daily (FK cascade workaround)
  const { data: attIds } = await sb.from('attendance_records')
    .select('id')
    .eq('import_batch_id', DEMO_BATCH_ID)
    .is('deleted_at', null)

  const ids = (attIds ?? []).map((r: Record<string, unknown>) => r['id'] as string)

  // ② Delete payroll_daily rows (no cascade defined)
  let deletedPayroll = 0
  if (ids.length > 0) {
    const { count } = await sb.from('payroll_daily')
      .delete({ count: 'exact' })
      .in('attendance_id', ids)
    deletedPayroll = count ?? 0
  }

  // ③ Hard-delete attendance records (demo data, safe to fully remove)
  const { count: deletedAtt } = await sb.from('attendance_records')
    .delete({ count: 'exact' })
    .eq('import_batch_id', DEMO_BATCH_ID)

  // ④ Hard-delete demo workers (frees up (country_code, code) uniqueness for re-seed)
  const { count: deletedWorkers } = await sb.from('workers')
    .delete({ count: 'exact' })
    .eq('country_code', DEMO_COUNTRY)
    .like('notes', `%${DEMO_TAG}%`)

  // ⑤ Audit log
  await appendAuditLog(sb, {
    user_id:      user.id,
    user_email:   user.email,
    action:       'demo_reset',
    entity:       'demo',
    entity_id:    DEMO_BATCH_ID,
    country_code: DEMO_COUNTRY,
    after: { deletedWorkers, deletedAtt, deletedPayroll },
  })

  return c.json({
    success: true,
    data: { deletedWorkers, deletedAtt, deletedPayroll },
  })
})

export { demoRouter }
