import * as XLSX from 'xlsx'
import type { AttendanceRow, DamageRecord, Member, ParsedWorkbook } from './types'
import { DEFAULT_MAPPING, autoDetectMapping, isMappingComplete, resolveMapping, type ColumnMapping } from './mapping'

const DAILY_SHEET_RE = /^วันที่\s*(\d+)/i // matches "วันที่ 1", "วันที่ 3 กะดึก"

// Detect header row by running auto-detection on row 0 and row 7.
// Prefers row 0 (simplified template); falls back to row 7 (legacy Boxme TH layout).
function detectHeaderRow(data: any[][]): { headerRowIndex: number; headers: (string | null)[] } {
  let bestIdx = 0
  let bestConfidence = -1
  let bestHeaders: (string | null)[] = []
  for (const rowIdx of [0, 7]) {
    if (rowIdx >= data.length) continue
    const headers: (string | null)[] = (data[rowIdx] || []).map((c: any) =>
      c == null ? null : String(c)
    )
    const { confidence } = autoDetectMapping(headers)
    if (confidence > bestConfidence) {
      bestConfidence = confidence
      bestIdx = rowIdx
      bestHeaders = headers
    }
  }
  return { headerRowIndex: bestIdx, headers: bestHeaders }
}

// Collect up to 3 non-empty sample values per column from the first data rows.
function extractSampleValues(data: any[][], dataStart: number, numCols: number): Record<number, string[]> {
  const samples: Record<number, string[]> = {}
  for (let r = dataStart; r < Math.min(dataStart + 3, data.length); r++) {
    const row = data[r] || []
    for (let c = 0; c < numCols; c++) {
      const v = row[c]
      if (v != null && v !== '') {
        if (!samples[c]) samples[c] = []
        if (samples[c].length < 3) samples[c].push(String(v).trim().slice(0, 24))
      }
    }
  }
  return samples
}

// Excel datetime serial => HH:MM:SS string + ISO if has date
function excelTimeToString(v: unknown): string | undefined {
  if (v == null || v === '') return undefined
  if (v instanceof Date) {
    const h = String(v.getHours()).padStart(2, '0')
    const m = String(v.getMinutes()).padStart(2, '0')
    const s = String(v.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }
  if (typeof v === 'number') {
    // Excel serial: fractional part = time
    const totalSeconds = Math.round((v % 1) * 24 * 60 * 60)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  if (typeof v === 'string') {
    return v.trim()
  }
  return String(v)
}

function num(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/,/g, ''))
    return isNaN(n) ? undefined : n
  }
  return undefined
}

function str(v: unknown): string | undefined {
  if (v == null || v === '') return undefined
  if (v instanceof Date) return v.toISOString()
  return String(v).trim() || undefined
}

export function parseWorkbook(file: ArrayBuffer, fileName: string, mappingOverride?: ColumnMapping): ParsedWorkbook {
  // cellDates:false → keep numeric Excel serials so we can extract HH:MM:SS without TZ/precision loss.
  const wb = XLSX.read(file, { type: 'array', cellDates: false })
  const warnings: string[] = []
  const members: Member[] = []
  const attendance: AttendanceRow[] = []
  const damages: DamageRecord[] = []
  const daysFound: string[] = []

  // 1) Members
  if (wb.SheetNames.includes('Members')) {
    const ws = wb.Sheets['Members']
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: null })
    // header at row 1 (index 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row) continue
      const fullName = str(row[1])
      if (!fullName) continue
      members.push({
        fullName,
        nickname: str(row[2]),
        phone: str(row[3]),
        bankAccount: str(row[4]),
        bankCode: str(row[5]),
        department: str(row[7]),
        startDate: str(row[8]),
        employeeCode: str(row[9]),
        nationalId: str(row[10]),
      })
    }
  } else {
    warnings.push('Sheet "Members" not found — bank info will be missing.')
  }

  // 2) Damages
  if (wb.SheetNames.includes('สินค้าเสียหาย')) {
    const ws = wb.Sheets['สินค้าเสียหาย']
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: null })
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row) continue
      const fullName = str(row[1])
      const amount = num(row[4])
      if (!fullName || amount == null) continue
      const statusText = str(row[6]) || ''
      const status: DamageRecord['status'] = statusText.includes('หักเงินแล้ว')
        ? 'deducted'
        : statusText.includes('ยังไม่ได้') ? 'pending' : 'unknown'
      damages.push({
        fullName,
        nickname: str(row[2]),
        department: str(row[3]),
        amountThb: amount,
        warehouse: str(row[5]),
        status,
        incidentDateText: str(row[7]),
        deductionDateText: str(row[8]),
        rawRow: i + 1,
      })
    }
  }

  // 3) Daily sheets
  // Strategy:
  //   - Detect header row (row 0 = new template, row 7 = legacy) from the first daily sheet.
  //   - Resolve mapping (saved → auto-detect → default).
  //   - If incomplete and no override provided, return early with `requiresMapping=true`.
  let headerSample: (string | null)[] = []
  let sampleValues: Record<number, string[]> = {}
  let mapping: ColumnMapping = mappingOverride || DEFAULT_MAPPING
  let firstHeaderCaptured = false
  let detectedHeaderRow = 7 // legacy default

  for (const sheetName of wb.SheetNames) {
    const m = sheetName.match(DAILY_SHEET_RE)
    if (!m) continue
    daysFound.push(sheetName)
    if (!firstHeaderCaptured) {
      const ws = wb.Sheets[sheetName]
      const allRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: null })
      const detected = detectHeaderRow(allRows)
      detectedHeaderRow = detected.headerRowIndex
      headerSample = detected.headers
      sampleValues = extractSampleValues(allRows, detectedHeaderRow + 1, headerSample.length)
      firstHeaderCaptured = true

      if (!mappingOverride) {
        const resolved = resolveMapping(headerSample)
        mapping = resolved.mapping
        if (resolved.needsUserInput) {
          return {
            fileName,
            members,
            attendance: [],
            damages,
            daysFound,
            warnings,
            requiresMapping: true,
            sampleHeaders: headerSample,
            sampleValues,
            suggestedMapping: mapping,
            mappingSource: resolved.source,
            detectedHeaderRow,
          }
        }
      } else if (!isMappingComplete(mapping)) {
        return {
          fileName, members, attendance: [], damages, daysFound, warnings,
          requiresMapping: true, sampleHeaders: headerSample, sampleValues,
          suggestedMapping: mapping, mappingSource: 'default', detectedHeaderRow,
        }
      }
    }
  }

  // Pass 2: parse rows using resolved mapping, data starts at detectedHeaderRow + 1
  for (const sheetName of daysFound) {
    const m = sheetName.match(DAILY_SHEET_RE)
    if (!m) continue
    const dayNum = parseInt(m[1], 10)
    const ws = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: null })

    for (let i = detectedHeaderRow + 1; i < data.length; i++) {
      const row = data[i]
      if (!row) continue
      const fullName = str(row[mapping.fullName])
      if (!fullName || fullName.length < 2) continue

      // workDate from checkin serial
      let workDate: string | undefined
      const checkinRaw = row[mapping.checkin]
      if (typeof checkinRaw === 'number') {
        const days = Math.floor(checkinRaw)
        const ms = Date.UTC(1899, 11, 30) + days * 86400000
        workDate = new Date(ms).toISOString().slice(0, 10)
      }
      if (!workDate) workDate = `2026-04-${String(dayNum).padStart(2, '0')}`

      attendance.push({
        sheet: sheetName,
        rowIndex: i + 1,
        workDate,
        fullName,
        nickname: str(row[mapping.nickname]),
        checkin: excelTimeToString(row[mapping.checkin]),
        checkout: excelTimeToString(row[mapping.checkout]),
        note: str(row[mapping.note]),
        manualNote: str(row[mapping.manualNote]),
        shiftCode: str(row[mapping.shiftCode]),
        otBeforeHours: num(row[mapping.otBefore]),
        otAfterHours: num(row[mapping.otAfter]),
        damageDeduction: num(row[mapping.damage]),
        otherDeduction: num(row[mapping.other]),
      })
    }
  }

  if (daysFound.length === 0) {
    warnings.push('No daily timesheet sheet (วันที่ X) found in workbook.')
  }
  return {
    fileName, members, attendance, damages, daysFound, warnings,
    requiresMapping: false,
    sampleHeaders: headerSample,
    sampleValues,
    suggestedMapping: mapping,
    detectedHeaderRow,
  }
}
