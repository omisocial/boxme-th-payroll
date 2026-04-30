import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { computePayroll, DEFAULT_CONFIG, type EngineConfig } from '../engines/compute'
import { resolveRateConfig, appendAuditLog } from '../db/queries'
import { guard, type Env } from '../auth/rbac'

const payrollRouter = new Hono<{ Bindings: Env }>()

const attendanceRowSchema = z.object({
  sheet: z.string().default('manual'),
  rowIndex: z.number().default(0),
  workDate: z.string(),
  fullName: z.string(),
  nickname: z.string().optional(),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  note: z.string().optional(),
  shiftCode: z.string().optional(),
  manualNote: z.string().optional(),
  otBeforeHours: z.number().default(0),
  otAfterHours: z.number().default(0),
  damageDeduction: z.number().default(0),
  otherDeduction: z.number().default(0),
})

const computeSchema = z.object({
  row: attendanceRowSchema,
  country: z.string().default('TH'),
  warehouseId: z.string().optional(),
})

// POST /api/payroll/compute — single row computation
payrollRouter.post('/compute', ...guard('viewer'), zValidator('json', computeSchema), async (c) => {
  const { row, country, warehouseId } = c.req.valid('json')

  const rateConfig = await resolveRateConfig(c.env.DB, country, row.note ?? null, row.workDate)

  const config: EngineConfig = {
    defaultDailyRate: rateConfig?.base_daily ?? DEFAULT_CONFIG.defaultDailyRate,
    otMultiplier: rateConfig?.ot_multiplier ?? DEFAULT_CONFIG.otMultiplier,
    lateBufferMinutes: DEFAULT_CONFIG.lateBufferMinutes,
    lateRoundingUnit: DEFAULT_CONFIG.lateRoundingUnit,
    paidLeaveClassifications: DEFAULT_CONFIG.paidLeaveClassifications,
  }

  const result = computePayroll(row, config)
  return c.json({ success: true, data: result })
})

const batchSchema = z.object({
  periodId: z.string(),
  country: z.string().default('TH'),
})

// POST /api/payroll/batch — compute all attendance rows for a period
payrollRouter.post('/batch', ...guard('hr'), zValidator('json', batchSchema), async (c) => {
  const { periodId, country } = c.req.valid('json')
  const user = c.get('user')

  const periodRow = await c.env.DB.prepare(
    'SELECT * FROM payroll_periods WHERE id = ? AND country_code = ?'
  ).bind(periodId, country).first<{ id: string; status: string; from_date: string; to_date: string }>()

  if (!periodRow) return c.json({ success: false, message: 'Period not found' }, 404)
  if (periodRow.status !== 'open') {
    return c.json({ success: false, message: 'Period is not open for computation' }, 400)
  }

  const { results: attendanceRows } = await c.env.DB.prepare(`
    SELECT * FROM attendance_records
    WHERE country_code = ? AND work_date BETWEEN ? AND ? AND deleted_at IS NULL
  `).bind(country, periodRow.from_date, periodRow.to_date).all<Record<string, unknown>>()

  if (!attendanceRows?.length) {
    return c.json({ success: true, data: { computed: 0, message: 'No attendance rows found' } })
  }

  let computed = 0
  let errors = 0

  for (const att of attendanceRows) {
    try {
      const rateConfig = await resolveRateConfig(
        c.env.DB, country, att['note'] as string | null, att['work_date'] as string
      )

      const config: EngineConfig = {
        defaultDailyRate: rateConfig?.base_daily ?? 500,
        otMultiplier: rateConfig?.ot_multiplier ?? 1.5,
        lateBufferMinutes: 0,
        lateRoundingUnit: 0,
        paidLeaveClassifications: [],
      }

      const row = {
        sheet: att['import_batch_id'] as string ?? 'db',
        rowIndex: 0,
        workDate: att['work_date'] as string,
        fullName: att['full_name'] as string,
        nickname: att['nickname'] as string | undefined,
        checkin: att['checkin'] as string | undefined,
        checkout: att['checkout'] as string | undefined,
        note: att['note'] as string | undefined,
        shiftCode: att['shift_code'] as string | undefined,
        manualNote: att['manual_note'] as string | undefined,
        otBeforeHours: (att['ot_before_hours'] as number) || 0,
        otAfterHours: (att['ot_after_hours'] as number) || 0,
        damageDeduction: (att['damage_deduction'] as number) || 0,
        otherDeduction: (att['other_deduction'] as number) || 0,
      }

      const result = computePayroll(row, config)

      await c.env.DB.prepare(`
        INSERT INTO payroll_daily (
          attendance_id, country_code, period_id,
          dept_category, shift_start, shift_end, crosses_midnight,
          shift_duration_hours, hours_bucket_u, wage_per_minute,
          late_minutes_raw, late_minutes_deducted, early_out_minutes,
          daily_rate_thb, late_deduction_thb, early_out_deduction_thb,
          ot_total_hours, ot_pay_thb, damage_thb, other_deduction_thb,
          gross_wage_raw, gross_wage_thb, flags_json
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(attendance_id) DO UPDATE SET
          dept_category=excluded.dept_category,
          gross_wage_thb=excluded.gross_wage_thb,
          flags_json=excluded.flags_json,
          computed_at=datetime('now')
      `).bind(
        att['id'], country, periodId,
        result.deptCategory, result.shiftStart ?? null, result.shiftEnd ?? null,
        result.crossesMidnight ? 1 : 0,
        result.shiftDurationHours, result.hoursBucketU, result.wagePerMinute,
        result.lateMinutesRaw, result.lateMinutesDeducted, result.earlyOutMinutes,
        result.dailyRateThb, result.lateDeductionThb, result.earlyOutDeductionThb,
        result.otTotalHours, result.otPayThb, result.damageThb, result.otherDeductionThb,
        result.grossWageRaw, result.grossWageThb, JSON.stringify(result.flags)
      ).run()

      computed++
    } catch {
      errors++
    }
  }

  await appendAuditLog(c.env.DB, {
    user_id: user.id,
    user_email: user.email,
    action: 'batch_compute',
    entity: 'payroll_period',
    entity_id: periodId,
    country_code: country,
    after: { computed, errors },
  })

  return c.json({ success: true, data: { computed, errors, total: attendanceRows.length } })
})

export { payrollRouter }
