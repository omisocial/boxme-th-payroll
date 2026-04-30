import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { computePayroll, DEFAULT_CONFIG, type EngineConfig } from '../engines/compute'
import { resolveRateConfig, appendAuditLog } from '../db/queries'
import { guard, type Env } from '../auth/rbac'
import { getSupabase } from '../db/supabase'

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
  const sb = getSupabase(c.env)
  const { row, country } = c.req.valid('json')

  const rateConfig = await resolveRateConfig(sb, country, row.note ?? null, row.workDate)

  const config: EngineConfig = {
    ...DEFAULT_CONFIG,
    defaultDailyRate: rateConfig?.base_daily ?? DEFAULT_CONFIG.defaultDailyRate,
    otMultiplier: rateConfig?.ot_multiplier ?? DEFAULT_CONFIG.otMultiplier,
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
  const sb = getSupabase(c.env)
  const { periodId, country } = c.req.valid('json')
  const user = c.get('user')

  const { data: periodRow } = await sb.from('payroll_periods')
    .select('id, status, from_date, to_date')
    .eq('id', periodId)
    .eq('country_code', country)
    .maybeSingle()

  if (!periodRow) return c.json({ success: false, message: 'Period not found' }, 404)
  const p = periodRow as Record<string, unknown>
  if (p['status'] !== 'open') {
    return c.json({ success: false, message: 'Period is not open for computation' }, 400)
  }

  const { data: attendanceRows } = await sb.from('attendance_records')
    .select('*')
    .eq('country_code', country)
    .gte('work_date', p['from_date'] as string)
    .lte('work_date', p['to_date'] as string)
    .is('deleted_at', null)

  if (!attendanceRows?.length) {
    return c.json({ success: true, data: { computed: 0, message: 'No attendance rows found' } })
  }

  let computed = 0
  let errors = 0

  for (const att of attendanceRows) {
    try {
      const a = att as Record<string, unknown>
      const rateConfig = await resolveRateConfig(
        sb, country, a['note'] as string | null, a['work_date'] as string
      )

      const config: EngineConfig = {
        ...DEFAULT_CONFIG,
        defaultDailyRate: rateConfig?.base_daily ?? DEFAULT_CONFIG.defaultDailyRate,
        otMultiplier: rateConfig?.ot_multiplier ?? DEFAULT_CONFIG.otMultiplier,
      }

      const row = {
        sheet: (a['import_batch_id'] as string) ?? 'db',
        rowIndex: 0,
        workDate: a['work_date'] as string,
        fullName: a['full_name'] as string,
        nickname: a['nickname'] as string | undefined,
        checkin: a['checkin'] as string | undefined,
        checkout: a['checkout'] as string | undefined,
        note: a['note'] as string | undefined,
        shiftCode: a['shift_code'] as string | undefined,
        manualNote: a['manual_note'] as string | undefined,
        otBeforeHours: Number(a['ot_before_hours']) || 0,
        otAfterHours: Number(a['ot_after_hours']) || 0,
        damageDeduction: Number(a['damage_deduction']) || 0,
        otherDeduction: Number(a['other_deduction']) || 0,
      }

      const result = computePayroll(row, config)

      await sb.from('payroll_daily').upsert({
        attendance_id: a['id'],
        country_code: country,
        period_id: periodId,
        dept_category: result.deptCategory,
        shift_start: result.shiftStart ?? null,
        shift_end: result.shiftEnd ?? null,
        crosses_midnight: result.crossesMidnight,
        shift_duration_hours: result.shiftDurationHours,
        hours_bucket_u: result.hoursBucketU,
        wage_per_minute: result.wagePerMinute,
        late_minutes_raw: result.lateMinutesRaw,
        late_minutes_deducted: result.lateMinutesDeducted,
        early_out_minutes: result.earlyOutMinutes,
        daily_rate_thb: result.dailyRateThb,
        late_deduction_thb: result.lateDeductionThb,
        early_out_deduction_thb: result.earlyOutDeductionThb,
        ot_total_hours: result.otTotalHours,
        ot_pay_thb: result.otPayThb,
        damage_thb: result.damageThb,
        other_deduction_thb: result.otherDeductionThb,
        gross_wage_raw: result.grossWageRaw,
        gross_wage_thb: result.grossWageThb,
        flags_json: result.flags,
        computed_at: new Date().toISOString(),
      }, { onConflict: 'attendance_id' })

      computed++
    } catch {
      errors++
    }
  }

  await appendAuditLog(sb, {
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
