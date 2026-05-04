import * as XLSX from 'xlsx'

// Simplified daily-sheet template:
//   Row 1 = bilingual header (EN / Thai) — standard row-1 position
//   Row 2 = example data row
//   12 core columns only (down from 35+)
//
// Column layout (0-indexed):
//  0  No.
//  1  Full Name / ชื่อ-นามสกุล          → fullName
//  2  Check-in / เช็คอิน                → checkin
//  3  Check-out / เช็คเอ้า              → checkout
//  4  Dept / สังกัด                     → note
//  5  Shift / กะการทำงาน               → shiftCode
//  6  Nickname / ชื่อเล่น               → nickname
//  7  OT Before (h) / OT ก่อน          → otBefore
//  8  OT After (h) / OT หลัง            → otAfter
//  9  Damage THB / หักสินค้าชำรุด       → damage
// 10  Other Deduct THB / หักอื่น ๆ      → other
// 11  Notes / หมายเหตุ                  → manualNote

function buildDailyHeaders(currency: string) {
  return [
    'No.',
    'Full Name / ชื่อ-นามสกุล',
    'Check-in / เช็คอิน',
    'Check-out / เช็คเอ้า',
    'Dept / สังกัด',
    'Shift / กะการทำงาน',
    'Nickname / ชื่อเล่น',
    'OT Before (h) / OT ก่อน',
    'OT After (h) / OT หลัง',
    `Damage ${currency} / หักสินค้าชำรุด`,
    `Other Deduct ${currency} / หักอื่น ๆ`,
    'Notes / หมายเหตุ',
  ]
}

// Cell comments describe each column's expected format
function buildDailyComments(currency: string): Record<number, string> {
  return {
    1: 'Required. Full legal name, e.g. สมชาย ใจดี\nGhi đầy đủ họ tên, ví dụ: Nguyễn Văn An',
    2: 'Required. Time in HH:MM or HH:MM:SS format, e.g. 08:30 or 08:30:39\nเวลาเช็คอิน เช่น 08:30',
    3: 'Required. Same format as Check-in\nเวลาเช็คเอ้าท์',
    4: 'Required. Department code: BM1 / BM3 / DW1 / DW3 / นักศึกษา / แม่บ้าน\nMã phòng ban',
    5: 'Required. Format: "HH:MM - HH:MM", e.g. 08:30 - 17:30 or 17:00 - 02:00\nRường ca: "HH:MM - HH:MM"',
    6: 'Optional. Short name / nickname\nชื่อเล่น (ถ้ามี)',
    7: 'Optional. OT hours before shift, decimal e.g. 1.5 = 90 min\nOT ก่อนกะ (ชั่วโมง)',
    8: 'Optional. OT hours after shift, decimal\nOT หลังกะ (ชั่วโมง)',
    9: `Optional. Damage deduction in ${currency}\nหักค่าสินค้าชำรุด (${currency})`,
    10: `Optional. Other deductions in ${currency}\nหักอื่น ๆ (${currency})`,
    11: 'Optional. Free-text notes\nหมายเหตุ',
  }
}

function addComments(ws: XLSX.WorkSheet, row: number, comments: Record<number, string>) {
  for (const [col, text] of Object.entries(comments)) {
    const addr = XLSX.utils.encode_cell({ r: row, c: Number(col) })
    if (!ws[addr]) ws[addr] = { t: 's', v: ws[addr]?.v ?? '' }
    ws[addr].c = [{ a: 'Boxme', t: text }]
  }
}

export function downloadTemplate(currency = 'THB', fileName = 'boxme-payroll-template.xlsx') {
  const wb = XLSX.utils.book_new()

  // ── Members sheet ────────────────────────────────────────────────────────────
  // Column indices (0-based):
  //  0=No, 1=fullName, 2=nick, 3=phone, 4=bankAccount, 5=bankCode, 6=bankName,
  //  7=dept, 8=startDate, 9=employeeCode (NEW), 10=nationalId (NEW)
  const membersHeader = [
    'No.',
    'Full Name / ชื่อ-สกุล / Họ và Tên',
    'Nickname / ชื่อเล่น / Tên Gọi',
    'Phone / เบอร์โทร / Điện Thoại',
    'Bank Account / เลขบัญชี / Số TK',
    'Bank Code / ตัวย่อธนาคาร / Mã NH',
    'Bank Name / ชื่อธนาคาร / Tên NH',
    'Dept / สังกัด / Phòng Ban',
    'Start Date / วันที่เริ่มงาน / Ngày Bắt Đầu',
    'Employee Code / รหัส Boxme / Mã NV Boxme',
    'National ID / หมายเลขบัตรประชาชน / CCCD',
  ]
  const members = [
    membersHeader,
    [1, 'สมชาย ใจดี', 'ชาย', '0812345678', '1234567890', 'KBANK', 'Kasikornbank', 'BM1', '01/01/2026', '', ''],
    [2, 'สมหญิง ทำงาน', 'หญิง', '0823456789', '0987654321', 'SCB', 'Siam Commercial', 'BM3', '15/01/2026', '', ''],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(members), 'Members')

  // ── Damage log ────────────────────────────────────────────────────────────────
  const damageHeader = [
    'No.',
    'Full Name / ชื่อ-สกุล',
    'Nickname / ชื่อเล่น',
    'Dept / สังกัด',
    `Amount ${currency} / จำนวนเงิน`,
    'Warehouse / คลัง',
    'Status / สถานะ',
    'Incident Date / ผิดวันที่',
    'Deduct Date / หักวันที่',
  ]
  const damages = [
    damageHeader,
    [1, 'สมชาย ใจดี', 'ชาย', 'BM1', 200, 1, 'ยังไม่ได้หักเงิน', '03/04/2026', ''],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(damages), 'สินค้าเสียหาย')

  // ── Daily timesheet — simplified 12-column layout ─────────────────────────────
  // Header at row 1 (index 0) — no blank rows above
  const DAILY_HEADERS = buildDailyHeaders(currency)
  const DAILY_COMMENTS = buildDailyComments(currency)
  const aoa: any[][] = [
    DAILY_HEADERS,
    // Example rows
    [1, 'สมชาย ใจดี', '08:30:39', '17:30:00', 'BM1', '08:30 - 17:30', 'ชาย', 0, 0, 0, 0, ''],
    [2, 'สมหญิง ทำงาน', '09:47:34', '17:30:00', 'BM3', '08:30 - 17:30', 'หญิง', 0, 1.5, 0, 0, 'late'],
    [3, 'นักศึกษาฝึกงาน เอ', '08:30:53', '17:30:00', 'นักศึกษา', '08:30 - 17:30', 'เอ', 0, 0, 0, 0, ''],
  ]
  const dailyWs = XLSX.utils.aoa_to_sheet(aoa)
  addComments(dailyWs, 0, DAILY_COMMENTS)
  XLSX.utils.book_append_sheet(wb, dailyWs, 'วันที่ 1')

  // ── README / Instructions ──────────────────────────────────────────────────────
  const readme = [
    ['Boxme Payroll Import Template — Quick Guide'],
    [''],
    ['🇬🇧 ENGLISH'],
    ['1. Name daily sheets "วันที่ N" (e.g., "วันที่ 1", "วันที่ 2", ...).'],
    ['2. Header row is row 1. Data starts from row 2.'],
    ['3. Required columns: Full Name, Check-in, Check-out, Dept, Shift.'],
    ['4. Dept codes: BM1 / BM3 / DW1 / DW3 / นักศึกษา / แม่บ้าน.'],
    ['5. Shift format: "HH:MM - HH:MM"  →  example: 08:30 - 17:30'],
    ['6. OT columns: hours as decimals (1.5 = 90 min).'],
    [`7. Damage / Other columns: amount in ${currency}.`],
    ['8. Hover any column header cell to see a description tooltip.'],
    ['9. Members sheet: columns 10-11 (Employee Code, National ID) are optional — used to disambiguate workers with the same name.'],
    [''],
    ['🇹🇭 ภาษาไทย'],
    ['1. ตั้งชื่อ sheet รายวันว่า "วันที่ N" เช่น "วันที่ 1", "วันที่ 2", ...'],
    ['2. แถวหัว (header) อยู่ที่แถว 1 ข้อมูลเริ่มแถว 2'],
    ['3. คอลัมน์ที่ต้องมี: ชื่อ-นามสกุล, เช็คอิน, เช็คเอ้า, สังกัด, กะ'],
    ['4. รหัสสังกัด: BM1 / BM3 / DW1 / DW3 / นักศึกษา / แม่บ้าน'],
    ['5. รูปแบบกะ: "HH:MM - HH:MM"  →  ตัวอย่าง: 08:30 - 17:30'],
    ['6. OT: ใส่เป็นชั่วโมง (ทศนิยมได้ เช่น 1.5 = 90 นาที)'],
    [`7. คอลัมน์หัก: จำนวนเงิน (${currency})`],
    ['8. Sheet Members คอลัมน์ 10-11 (รหัส Boxme, บัตรประชาชน) เป็น optional ใช้แยกคนชื่อซ้ำ'],
    [''],
    ['🇻🇳 TIẾNG VIỆT'],
    ['1. Đặt tên sheet theo ngày: "วันที่ N" (ví dụ: "วันที่ 1", "วันที่ 2", ...)'],
    ['2. Hàng tiêu đề ở hàng 1, dữ liệu bắt đầu từ hàng 2.'],
    ['3. Cột bắt buộc: Họ Tên, Giờ Vào, Giờ Ra, Phòng Ban, Ca Làm.'],
    ['4. Mã phòng ban: BM1 / BM3 / DW1 / DW3 / นักศึกษา / แม่บ้าน'],
    ['5. Định dạng ca: "HH:MM - HH:MM"  →  ví dụ: 08:30 - 17:30'],
    ['6. OT: nhập số giờ (thập phân, ví dụ 1.5 = 90 phút)'],
    [`7. Cột khấu trừ: số tiền ${currency}.`],
    ['8. Sheet Members cột 10-11 (Mã NV Boxme, CCCD) là tuỳ chọn — dùng để phân biệt nhân viên trùng tên.'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readme), 'README')

  XLSX.writeFile(wb, fileName)
}
