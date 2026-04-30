import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { computePayroll, DEFAULT_CONFIG } from '../engines/compute'
import { resolveRateConfig, appendAuditLog } from '../db/queries'

const attendanceRouter = new Hono<{ Bindings: Env }>()

const manualEntrySchema = z.object({
  warehouseId: z.string(),
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
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const date = c.req.query('date')
  const dept = c.req.query('dept')
  const status = c.req.query('status')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '100'), 500)
  const offset = (page - 1) * limit

  let query = `SELECT a.*, p.gross_wage_thb, p.flags_json FROM attendance_records a
    LEFT JOIN payroll_daily p ON p.attendance_id = a.id
    WHERE a.country_code = ? AND a.deleted_at IS NULL`
  const params: unknown[] = [country]

  if (date) { query += ` AND a.work_date = ?`; params.push(date) }
  if (from && to) { query += ` AND a.work_date BETWEEN ? AND ?`; params.push(from, to) }
  if (dept) { query += ` AND a.note LIKE ?`; params.push(`${dept}%`) }
  if (status) { query += ` AND a.status = ?`; params.push(status) }

  const countQuery = `SELECT COUNT(*) as cnt FROM attendance_records a WHERE a.country_code = ? AND a.deleted_at IS NULL` +
    (date ? ` AND a.work_date = ?` : '') +
    (from && to ? ` AND a.work_date BETWEEN ? AND ?` : '') +
    (dept ? ` AND a.note LIKE ?` : '') +
    (status ? ` AND a.status = ?` : '')

  const countParams = [country, ...(params.slice(1))]
  const totalRow = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ cnt: number }>()

  query += ` ORDER BY a.work_date DESC, a.full_name LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()

  return c.json({
    success: true,
    data: results ?? [],
    meta: { total: totalRow?.cnt ?? 0, page, limit },
  })
})

// POST /api/attendance — manual entry
attendanceRouter.post('/', ...guard('supervisor'), zValidator('json', manualEntrySchema), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO attendance_records (id, country_code, warehouse_id, work_date, full_name,
      nickname, checkin, checkout, note, shift_code, manual_note, job_type_code,
      ot_before_hours, ot_after_hours, damage_deduction, other_deduction, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, country, body.warehouseId, body.workDate, body.fullName,
    body.nickname ?? null, body.checkin ?? null, body.checkout ?? null,
    body.note ?? null, body.shiftCode ?? null, body.manualNote ?? null, body.jobTypeCode,
    body.otBeforeHours, body.otAfterHours, body.damageDeduction, body.otherDeduction,
    user.email
  ).run()

  // Auto-compute payroll for this row
  await computeAndSave(c.env.DB, id, country, body.workDate, body.note ?? null)

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'create', entity: 'attendance', entity_id: id, country_code: country,
    after: body,
  })

  const created = await c.env.DB.prepare('SELECT * FROM attendance_records WHERE id = ?').bind(id).first()
  return c.json({ success: true, data: created }, 201)
})

// POST /api/attendance/:id/compute — recompute a single row
attendanceRouter.post('/:id/compute', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const id = c.req.param('id')

  const att = await c.env.DB.prepare(
    'SELECT * FROM attendance_records WHERE id = ? AND country_code = ?'
  ).bind(id, country).first<Record<string, unknown>>()
  if (!att) return c.json({ success: false, message: 'Not found' }, 404)

  await computeAndSave(c.env.DB, id, country, att['work_date'] as string, att['note'] as string | null)
  const result = await c.env.DB.prepare('SELECT * FROM payroll_daily WHERE attendance_id = ?').bind(id).first()
  return c.json({ success: true, data: result })
})

// POST /api/attendance/import — multipart Excel upload, returns preview
attendanceRouter.post('/import', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const warehouseId = c.req.query('warehouse') ?? 'wh-th-bkk-1'

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ success: false, message: 'No file uploaded' }, 400)

  const bytes = await file.arrayBuffer()
  const sessionId = crypto.randomUUID()

  // Upload raw file to R2 for later commit
  await c.env.FILES.put(`imports/${sessionId}/${file.name}`, bytes, {
    httpMetadata: { contentType: file.type },
  })

  // Parse Excel using dynamic import of xlsx (available in Workers via npm)
  const { read, utils } = await import('xlsx')
  const wb = read(new Uint8Array(bytes), { type: 'array' })

  const previewRows: Array<Record<string, unknown>> = []
  const warnings: string[] = []

  for (const sheetName of wb.SheetNames) {
    if (!sheetName.includes('วันที่') && !sheetName.match(/day\s*\d+/i)) continue
    const ws = wb.Sheets[sheetName]
    const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1, raw: false })

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[]
      if (!row || !row[1]) continue // skip empty rows

      previewRows.push({
        rowIndex: i,
        sheet: sheetName,
        workDate: '', // TODO: derive from sheet name
        fullName: String(row[1] ?? '').trim(),
        checkin: row[3] ? String(row[3]).trim() : undefined,
        checkout: row[4] ? String(row[4]).trim() : undefined,
        note: row[5] ? String(row[5]).trim() : undefined,
        shiftCode: row[2] ? String(row[2]).trim() : undefined,
      })
    }
  }

  // Record import session in DB
  await c.env.DB.prepare(`
    INSERT INTO import_sessions (id, country_code, warehouse_id, filename, row_count, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(sessionId, country, warehouseId, file.name, previewRows.length, user.email).run()

  // Cache preview in KV (15 min TTL)
  await c.env.SESSION_KV.put(
    `import:${sessionId}`,
    JSON.stringify({ rows: previewRows, country, warehouseId }),
    { expirationTtl: 900 }
  )

  return c.json({
    success: true,
    data: {
      importSessionId: sessionId,
      rows: previewRows.slice(0, 100), // preview max 100
      warnings,
      totalRows: previewRows.length,
    },
  })
})

// POST /api/attendance/import/commit
attendanceRouter.post('/import/commit', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const { importSessionId } = await c.req.json<{ importSessionId: string }>()

  const cached = await c.env.SESSION_KV.get(`import:${importSessionId}`)
  if (!cached) return c.json({ success: false, message: 'Import session expired or not found' }, 404)

  const { rows, warehouseId } = JSON.parse(cached) as {
    rows: Array<Record<string, unknown>>
    country: string
    warehouseId: string
  }

  let imported = 0, skipped = 0
  const errors: string[] = []
  const BATCH = 500

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const stmts = chunk.map(row => {
      const id = crypto.randomUUID()
      return c.env.DB.prepare(`
        INSERT INTO attendance_records (id, country_code, warehouse_id, work_date, full_name,
          checkin, checkout, note, shift_code, import_batch_id, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        id, country, warehouseId,
        String(row['workDate'] ?? ''), String(row['fullName'] ?? ''),
        row['checkin'] ?? null, row['checkout'] ?? null,
        row['note'] ?? null, row['shiftCode'] ?? null,
        importSessionId, user.email
      )
    })
    try {
      await c.env.DB.batch(stmts)
      imported += chunk.length
    } catch (e) {
      errors.push(String(e))
      skipped += chunk.length
    }
  }

  // Mark session committed
  await c.env.DB.prepare(
    `UPDATE import_sessions SET status = 'committed', committed_at = datetime('now') WHERE id = ?`
  ).bind(importSessionId).run()
  await c.env.SESSION_KV.delete(`import:${importSessionId}`)

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'import_commit', entity: 'attendance', entity_id: importSessionId,
    country_code: country,
    after: { imported, skipped },
  })

  return c.json({ success: true, data: { imported, skipped, errors } })
})

// Helper: compute and upsert payroll_daily for one attendance row
async function computeAndSave(
  db: D1Database,
  attendanceId: string,
  country: string,
  workDate: string,
  note: string | null
) {
  const att = await db.prepare('SELECT * FROM attendance_records WHERE id = ?')
    .bind(attendanceId).first<Record<string, unknown>>()
  if (!att) return

  const rateConfig = await resolveRateConfig(db, country, note, workDate)
  const config = {
    defaultDailyRate: rateConfig?.base_daily ?? 500,
    otMultiplier: rateConfig?.ot_multiplier ?? 1.5,
    lateBufferMinutes: 0,
    lateRoundingUnit: 0,
    paidLeaveClassifications: [],
  }

  const row = {
    sheet: String(att['import_batch_id'] ?? 'db'),
    rowIndex: 0,
    workDate: att['work_date'] as string,
    fullName: att['full_name'] as string,
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

  await db.prepare(`
    INSERT INTO payroll_daily (attendance_id, country_code,
      dept_category, shift_start, shift_end, crosses_midnight,
      shift_duration_hours, hours_bucket_u, wage_per_minute,
      late_minutes_raw, late_minutes_deducted, early_out_minutes,
      daily_rate_thb, late_deduction_thb, early_out_deduction_thb,
      ot_total_hours, ot_pay_thb, damage_thb, other_deduction_thb,
      gross_wage_raw, gross_wage_thb, flags_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(attendance_id) DO UPDATE SET
      gross_wage_thb=excluded.gross_wage_thb,
      flags_json=excluded.flags_json,
      computed_at=datetime('now')
  `).bind(
    attendanceId, country,
    result.deptCategory, result.shiftStart ?? null, result.shiftEnd ?? null,
    result.crossesMidnight ? 1 : 0,
    result.shiftDurationHours, result.hoursBucketU, result.wagePerMinute,
    result.lateMinutesRaw, result.lateMinutesDeducted, result.earlyOutMinutes,
    result.dailyRateThb, result.lateDeductionThb, result.earlyOutDeductionThb,
    result.otTotalHours, result.otPayThb, result.damageThb, result.otherDeductionThb,
    result.grossWageRaw, result.grossWageThb, JSON.stringify(result.flags)
  ).run()
}

declare const D1Database: never
type D1Database = typeof globalThis extends { DB: infer T } ? T : {
  prepare(sql: string): { bind(...args: unknown[]): { first<T>(): Promise<T | null>; run(): Promise<unknown>; all<T>(): Promise<{ results?: T[] }> }; first<T>(): Promise<T | null> }
  batch(stmts: unknown[]): Promise<unknown[]>
}

export { attendanceRouter }
