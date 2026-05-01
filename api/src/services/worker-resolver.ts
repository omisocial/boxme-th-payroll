// Worker resolver: match attendance row → existing worker, else auto-create
// with status='pending_update' so HR can complete the record later.

export interface ResolveResult {
  workerId: string
  matched: boolean   // true when an existing worker was found
  created: boolean   // true when we just inserted a pending_update worker
}

function generateCodeFromName(name: string): string {
  // Best-effort fallback code: first 6 alphanumerics + 4-char random
  const alpha = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'NEW'
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PEND-${alpha}-${rnd}`
}

export async function resolveOrCreateWorker(
  db: D1Database,
  countryCode: string,
  warehouseId: string,
  fullName: string,
): Promise<ResolveResult> {
  const trimmed = fullName.trim()
  if (!trimmed) throw new Error('fullName is required')

  // 1. Exact match by name_local first (case-insensitive), within country.
  const existing = await db.prepare(`
    SELECT id FROM workers
     WHERE country_code = ?
       AND deleted_at IS NULL
       AND lower(name_local) = lower(?)
     LIMIT 1
  `).bind(countryCode, trimmed).first<{ id: string }>()

  if (existing) {
    return { workerId: existing.id, matched: true, created: false }
  }

  // 2. Auto-create with pending_update status.
  const id = crypto.randomUUID()
  const code = generateCodeFromName(trimmed)
  await db.prepare(`
    INSERT INTO workers (
      id, country_code, warehouse_id, code, name_local, status, created_via
    ) VALUES (?, ?, ?, ?, ?, 'pending_update', 'attendance_import')
  `).bind(id, countryCode, warehouseId, code, trimmed).run()

  return { workerId: id, matched: false, created: true }
}

export async function bulkResolveWorkers(
  db: D1Database,
  countryCode: string,
  warehouseId: string,
  fullNames: string[],
): Promise<ResolveResult[]> {
  const unique = Array.from(new Set(fullNames.map(n => n.trim()).filter(Boolean)))
  const results: ResolveResult[] = []
  for (const name of unique) {
    results.push(await resolveOrCreateWorker(db, countryCode, warehouseId, name))
  }
  return results
}
