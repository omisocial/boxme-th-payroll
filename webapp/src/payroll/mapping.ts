// Column mapping: per logical field -> 0-indexed column in the daily sheet header row.
// -1 means "not mapped".

export type FieldKey =
  | 'fullName' | 'checkin' | 'checkout' | 'note'
  | 'shiftCode' | 'nickname' | 'manualNote'
  | 'otBefore' | 'otAfter' | 'damage' | 'other'
  | 'employeeCode' | 'nationalId'

export interface ColumnMapping {
  fullName: number
  checkin: number
  checkout: number
  note: number
  shiftCode: number
  nickname: number
  manualNote: number
  otBefore: number
  otAfter: number
  damage: number
  other: number
  employeeCode: number  // -1 = not mapped
  nationalId: number    // -1 = not mapped
}

export const REQUIRED_FIELDS: FieldKey[] = ['fullName', 'checkin', 'checkout', 'note', 'shiftCode']
export const OPTIONAL_FIELDS: FieldKey[] = ['nickname', 'manualNote', 'otBefore', 'otAfter', 'damage', 'other', 'employeeCode', 'nationalId']

// Default mapping for the original Boxme TH timesheet template
export const DEFAULT_MAPPING: ColumnMapping = {
  fullName: 1,       // B: ชื่อ-นามสกุล
  checkin: 2,        // C: Checkin time
  checkout: 3,       // D: Checkout time
  note: 4,           // E: Note (department code)
  nickname: 5,       // F: ชื่อเล่น
  manualNote: 10,    // K: หมายเหตุ
  shiftCode: 17,     // R: กะการทำงาน
  otBefore: 28,      // AC: OT ก่อน hours
  otAfter: 30,       // AE: OT หลัง hours
  damage: 34,        // AI: หักสินค้าชำรุด
  other: 35,         // AJ: other deduction
  employeeCode: -1,  // not present in legacy template
  nationalId: -1,    // not present in legacy template
}

// Header keyword patterns per field (case-insensitive substring match).
// Exported so MappingDialog can surface multilingual keyword hints to users.
export const PATTERNS: Record<FieldKey, RegExp[]> = {
  fullName:  [/ชื่อ.?(นาม)?สกุล/i, /full ?name/i, /họ ?(và )?tên/i, /^name$/i],
  checkin:   [/check.?in/i, /เช็คอิน/i, /เข้างาน/i, /giờ.?vào/i, /vào ca/i],
  checkout:  [/check.?out/i, /เช็คเอ้า/i, /เลิกงาน/i, /giờ.?ra/i, /ra ca/i],
  note:      [/^note$/i, /^department/i, /แผนก/i, /สังกัด/i, /phòng ban/i, /^ph.?ng ban$/i],
  shiftCode: [/กะ(การ)?(ทำงาน)?/i, /^shift/i, /^ca( làm)?$/i],
  nickname:  [/ชื่อเล่น/i, /nick.?name/i, /tên gọi/i],
  manualNote:[/หมายเหตุ/i, /^note( |$)/i, /^remark/i, /ghi chú/i],
  otBefore:  [/ot.?(ก่อน|before|trước).*(จำนวน|hr|hour|giờ)/i, /OT.?ก่อน/i],
  otAfter:   [/ot.?(หลัง|after|sau).*(จำนวน|hr|hour|giờ)/i, /OT.?หลัง/i],
  damage:       [/(หัก)?สินค้า(ชำรุด|เสียหาย)/i, /damage/i, /hư hỏng/i],
  other:        [/khấu trừ khác/i, /other ?deduct/i, /หักอื่น/i],
  employeeCode: [/employee.?code/i, /รหัส.*(boxme|พนักงาน)/i, /mã.?nv/i, /emp.?id/i, /\bemp\b/i],
  nationalId:   [/national.?id/i, /หมายเลข.*บัตร/i, /\bcccd\b/i, /\bcmnd\b/i, /citizen.?id/i, /id.?card/i, /\bprc\b/i],
}

const STORAGE_KEY = 'boxme.mappings'

function headerSignature(headers: (string | null)[]): string {
  return headers.map(h => (h || '').toString().trim().toLowerCase().replace(/\s+/g, ' ')).join('|')
}

interface SavedMappings { [signature: string]: ColumnMapping }

function loadSaved(): SavedMappings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

export function saveMapping(headers: (string | null)[], mapping: ColumnMapping) {
  try {
    const all = loadSaved()
    all[headerSignature(headers)] = mapping
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

export function getSavedMapping(headers: (string | null)[]): ColumnMapping | null {
  const all = loadSaved()
  return all[headerSignature(headers)] || null
}

export function clearSavedMappings() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

export function autoDetectMapping(headers: (string | null)[]): { mapping: ColumnMapping; confidence: number } {
  const result: ColumnMapping = { ...DEFAULT_MAPPING }
  let hits = 0
  // Only auto-detect required fields. Optional/numeric columns (OT/damage) are kept at default
  // because their headers are typically merged labels — auto-detection picks the label cell
  // instead of the data cell. Users can override via the mapping dialog.
  const fieldsToDetect: FieldKey[] = [...REQUIRED_FIELDS, 'nickname', 'manualNote']
  for (const field of fieldsToDetect) {
    const patterns = PATTERNS[field]
    let foundIdx = -1
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || '').toString()
      if (!h) continue
      if (patterns.some(p => p.test(h))) {
        foundIdx = i
        break
      }
    }
    if (foundIdx >= 0) {
      result[field] = foundIdx
      hits++
    }
  }
  return { mapping: result, confidence: hits / fieldsToDetect.length }
}

export function isMappingComplete(m: ColumnMapping): boolean {
  return REQUIRED_FIELDS.every(f => m[f] >= 0)
}

export function resolveMapping(headers: (string | null)[]): {
  mapping: ColumnMapping
  source: 'saved' | 'auto' | 'default'
  needsUserInput: boolean
} {
  const saved = getSavedMapping(headers)
  if (saved) return { mapping: saved, source: 'saved', needsUserInput: false }

  const { mapping, confidence } = autoDetectMapping(headers)
  if (isMappingComplete(mapping) && confidence >= 0.6) {
    return { mapping, source: 'auto', needsUserInput: false }
  }
  // try default mapping if it fits
  return { mapping, source: 'default', needsUserInput: !isMappingComplete(mapping) }
}

// Returns human-readable keyword hints for a field, shown in the mapping dialog.
// E.g. getFieldKeywords('checkin') → "check-in / เช็คอิน / giờ vào / vào ca"
export function getFieldKeywords(field: FieldKey): string {
  return PATTERNS[field]
    .map(p => {
      // Extract the literal part from the regex source (strip anchors/modifiers)
      const src = p.source.replace(/^\^|\$$/g, '').replace(/\(\?:.*?\)/g, '').replace(/[()[\]]/g, '').replace(/\\/g, '')
      return src
    })
    .filter(Boolean)
    .join(' / ')
}

// Returns per-field mapping source for confidence indicators in the dialog.
// source: 'saved' | 'auto' | 'default'
export function getMappingConfidence(
  field: FieldKey,
  headers: (string | null)[],
  mappingSource: 'saved' | 'auto' | 'default'
): 'saved' | 'auto' | 'default' | 'unmapped' {
  if (mappingSource === 'saved') return 'saved'
  const patterns = PATTERNS[field]
  const matched = headers.some(h => h && patterns.some(p => p.test(h)))
  if (matched) return 'auto'
  if (mappingSource === 'default') return 'default'
  return 'unmapped'
}
