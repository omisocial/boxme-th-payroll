import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { computePayroll, DEFAULT_CONFIG } from '../engines/compute'
import { resolveRateConfig, appendAuditLog } from '../db/queries'
import { getSupabase, storageUpload, type SB } from '../db/supabase'

const attendanceRouter = new Hono<{ Bindings: Env }>()

const manualEntrySchema = z.object({
  warehouseId: z.string().uuid(),
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
  jobTypeCode: z.string().default('GENERAL'),
})

// GET /api/attendance
attendanceRouter.get('/', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const date = c.req.query('date')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const status = c.req.query('status')
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '100'), 500)
  const offset = (page - 1) * limit

  let query = sb.from('attendance_records')
    .select('*, payroll_daily(gross_wage_thb, flags_json)', { count: 'exact' })
    .eq('country_code', country)
    .is('deleted_at', null)

  if (date) query = query.eq('work_date', date)
  if (from && to) query = query.gte('work_date', from).lte('work_date', to)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('work_date', { ascending: false })
    .order('full_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)

  return c.json({
    success: true,
    data: data ?? [],
    meta: { total: count ?? 0, page, limit },
  })
})

// POST /api/attendance — manual entry
attendanceRouter.post('/', ...guard('supervisor'), zValidator('json', manualEntrySchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const { data: created, error } = await sb.from('attendance_records')
    .insert({
      country_code: country,
      warehouse_id: body.warehouseId,
      work_date: body.workDate,
      full_name: body.fullName,
      nickname: body.nickname ?? null,
      checkin: body.checkin ?? null,
      checkout: body.checkout ?? null,
      note: body.note ?? null,
      shift_code: body.shiftCode ?? null,
      manual_note: body.manualNote ?? null,
      job_type_code: body.jobTypeCode,
      ot_before_hours: body.otBeforeHours,
      ot_after_hours: body.otAfterHours,
      damage_deduction: body.damageDeduction,
      other_deduction: body.otherDeduction,
      created_by: user.email,
    })
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  const row = created as Record<string, unknown>
  await computeAndSave(sb, row['id'] as string, country, row['work_date'] as string, row['note'] as string | null)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'create', entity: 'attendance',
    entity_id: row['id'] as string,
    country_code: country,
    after: body,
  })

  return c.json({ success: true, data: created }, 201)
})

// POST /api/attendance/:id/compute — recompute a single row
attendanceRouter.post('/:id/compute', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const id = c.req.param('id')

  const { data: att } = await sb.from('attendance_records')
    .select('*')
    .eq('id', id)
    .eq('country_code', country)
    .maybeSingle()

  if (!att) return c.json({ success: false, message: 'Not found' }, 404)
  const a = att as Record<string, unknown>

  await computeAndSave(sb, id, country, a['work_date'] as string, a['note'] as string | null)

  const { data: result } = await sb.from('payroll_daily')
    .select('*')
    .eq('attendance_id', id)
    .maybeSingle()

  return c.json({ success: true, data: result })
})

// POST /api/attendance/import — multipart Excel upload, returns preview
attendanceRouter.post('/import', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const warehouseId = c.req.query('warehouse')
  if (!warehouseId) return c.json({ success: false, message: 'warehouse query param required (UUID)' }, 400)

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ success: false, message: 'No file uploaded' }, 400)

  const bytes = await file.arrayBuffer()
  const sessionId = crypto.randomUUID()

  // Upload raw file to Supabase Storage for audit trail
  try {
    await storageUpload(sb, 'payroll-imports', `${country}/${sessionId}/${file.name}`, bytes, file.type || 'application/octet-stream')
  } catch {
    // Non-fatal — continue even if storage bucket not configured
    console.warn('[import] Storage upload failed (bucket may not exist yet)')
  }

  // Parse Excel — mirrors frontend parser.ts logic
  const { read, utils } = await import('xlsx')
  const wb = read(new Uint8Array(bytes), { type: 'array', cellDates: false })

  const previewRows: Array<Record<string, unknown>> = []
  const warnings: string[] = []
  const yearMonth = c.req.query('yearMonth') // optional "YYYY-MM" for date fallback

  // Default column indices matching DEFAULT_MAPPING in mapping.ts
  const COL = { fullName: 1, checkin: 2, checkout: 3, note: 4, nickname: 5, shiftCode: 17 }

  // Convert Excel time/datetime serial to "HH:MM" string
  const toTimeStr = (v: unknown): string | undefined => {
    if (typeof v === 'number') {
      const frac = v % 1
      const totalSec = Math.round(frac * 86400)
      const h = Math.floor(totalSec / 3600)
      const min = Math.floor((totalSec % 3600) / 60)
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    }
    if (typeof v === 'string' && v.trim()) return v.trim()
    return undefined
  }

  const DAILY_SHEET_RE = /^วันที่\s*(\d+)/i
  for (const sheetName of wb.SheetNames) {
    const m = sheetName.match(DAILY_SHEET_RE)
    if (!m) continue
    const dayNum = parseInt(m[1], 10)

    const ws = wb.Sheets[sheetName]
    // raw:true preserves Excel numeric serials so we can extract date from checkin
    const rows = utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null })

    // Header is at index 7, data starts at index 8 (same as frontend parser)
    for (let i = 8; i < rows.length; i++) {
      const row = rows[i] as unknown[]
      if (!row) continue
      const fullName = row[COL.fullName] != null ? String(row[COL.fullName]).trim() : ''
      if (fullName.length < 2) continue

      // Parse work date from checkin serial integer part (date + time combined)
      let workDate = ''
      const checkinRaw = row[COL.checkin]
      if (typeof checkinRaw === 'number' && Math.floor(checkinRaw) > 1) {
        const days = Math.floor(checkinRaw)
        const ms = Date.UTC(1899, 11, 30) + days * 86400000
        workDate = new Date(ms).toISOString().slice(0, 10)
      }
      if (!workDate) {
        const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
          ? yearMonth
          : new Date().toISOString().slice(0, 7)
        workDate = `${ym}-${String(dayNum).padStart(2, '0')}`
      }

      previewRows.push({
        rowIndex: i,
        sheet: sheetName,
        workDate,
        fullName,
        checkin: toTimeStr(row[COL.checkin]),
        checkout: toTimeStr(row[COL.checkout]),
        note: row[COL.note] != null ? String(row[COL.note]).trim() : undefined,
        shiftCode: row[COL.shiftCode] != null ? String(row[COL.shiftCode]).trim() : undefined,
        nickname: row[COL.nickname] != null ? String(row[COL.nickname]).trim() : undefined,
      })
    }
  }
  if (previewRows.length === 0) warnings.push('No daily sheets (วันที่ N) found in workbook.')

  // Store import session with preview rows in DB
  const { error } = await sb.from('import_sessions').insert({
    id: sessionId,
    country_code: country,
    warehouse_id: warehouseId,
    filename: file.name,
    row_count: previewRows.length,
    preview_json: previewRows,
    created_by: user.email,
  })

  if (error) return c.json({ success: false, message: error.message }, 500)

  return c.json({
    success: true,
    data: {
      importSessionId: sessionId,
      rows: previewRows.slice(0, 100),
      warnings,
      totalRows: previewRows.length,
    },
  })
})

// POST /api/attendance/import/commit
attendanceRouter.post('/import/commit', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const { importSessionId } = await c.req.json<{ importSessionId: string }>()

  const { data: session } = await sb.from('import_sessions')
    .select('*')
    .eq('id', importSessionId)
    .eq('status', 'preview')
    .maybeSingle()

  if (!session) return c.json({ success: false, message: 'Import session not found or already committed' }, 404)

  const s = session as Record<string, unknown>
  const rows = (s['preview_json'] as Array<Record<string, unknown>>) ?? []
  const warehouseId = s['warehouse_id'] as string

  // Build full_name → worker_id lookup for this country
  const { data: workerRows } = await sb.from('workers')
    .select('id, name_local')
    .eq('country_code', country)
    .is('deleted_at', null)
  const nameToWorkerId: Record<string, string> = {}
  for (const w of workerRows ?? []) {
    const ww = w as Record<string, unknown>
    nameToWorkerId[ww['name_local'] as string] = ww['id'] as string
  }

  let imported = 0, skipped = 0
  const errors: string[] = []
  const BATCH = 200

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const records = chunk.map(row => {
      const fullName = String(row['fullName'] ?? '')
      return {
        country_code: country,
        warehouse_id: warehouseId,
        worker_id: nameToWorkerId[fullName] ?? null,
        work_date: String(row['workDate'] ?? ''),
        full_name: fullName,
        checkin: row['checkin'] ?? null,
        checkout: row['checkout'] ?? null,
        note: row['note'] ?? null,
        shift_code: row['shiftCode'] ?? null,
        import_batch_id: importSessionId,
        created_by: user.email,
      }
    })

    const { error } = await sb.from('attendance_records').insert(records)
    if (error) {
      errors.push(error.message)
      skipped += chunk.length
    } else {
      imported += chunk.length
    }
  }

  await sb.from('import_sessions')
    .update({ status: 'committed', committed_at: new Date().toISOString() })
    .eq('id', importSessionId)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'import_commit', entity: 'attendance',
    entity_id: importSessionId,
    country_code: country,
    after: { imported, skipped },
  })

  return c.json({ success: true, data: { imported, skipped, errors } })
})

// Helper: compute and upsert payroll_daily for one attendance row
async function computeAndSave(
  sb: SB,
  attendanceId: string,
  country: string,
  workDate: string,
  note: string | null
) {
  const { data: att } = await sb.from('attendance_records')
    .select('*')
    .eq('id', attendanceId)
    .maybeSingle()

  if (!att) return
  const a = att as Record<string, unknown>

  const rateConfig = await resolveRateConfig(sb, country, note, workDate)
  const config = {
    ...DEFAULT_CONFIG,
    defaultDailyRate: rateConfig?.base_daily ?? DEFAULT_CONFIG.defaultDailyRate,
    otMultiplier: rateConfig?.ot_multiplier ?? DEFAULT_CONFIG.otMultiplier,
  }

  const row = {
    sheet: String(a['import_batch_id'] ?? 'db'),
    rowIndex: 0,
    workDate: a['work_date'] as string,
    fullName: a['full_name'] as string,
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
    attendance_id: attendanceId,
    country_code: country,
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
}

export { attendanceRouter }
