import * as XLSX from 'xlsx'

// Generate a minimal but valid template that the parser can auto-detect.
// Headers placed at row 8 (index 7) to match Boxme TH layout. Data row 9.
export function downloadTemplate(fileName = 'boxme-th-payroll-template.xlsx') {
  const wb = XLSX.utils.book_new()

  // Members sheet (master)
  const members = [
    ['ลำดับ', 'ชื่อ - สกุล', 'ชื่อเล่น', 'เบอร์โทร', 'เลขบัญชี', 'ตัวย่อธนาคาร', 'ชื่อธนาคาร', 'สังกัด', 'วันที่เริ่มงาน'],
    [1, 'สมชาย ใจดี', 'ชาย', '0812345678', '1234567890', 'K-BANK', 'Kasikornbank', 'BM1', '01/01/2026'],
    [2, 'สมหญิง ทำงาน', 'หญิง', '0823456789', '0987654321', 'SCB', 'Siam Commercial', 'BM3', '15/01/2026'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(members), 'Members')

  // Damage log
  const damages = [
    ['ลำดับ', 'ชื่อ-สกุล', 'ชื่อเล่น', 'สังกัด', 'จำนวนเงิน', 'คลัง', 'สถานะ', 'ผิดวันที่', 'หักวันที่'],
    [1, 'สมชาย ใจดี', 'ชาย', 'BM1', 200, 1, 'ยังไม่ได้หักเงิน', '03/04/2026', ''],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(damages), 'สินค้าเสียหาย')

  // Daily sheet template — 1 example day
  const headerRow = [
    'ลำดับ', 'ชื่อ-นามสกุล', 'Checkin time', 'Checkout time', 'Note', 'ชื่อเล่น',
    'เบอร์โทร', 'เลขที่บัญชี', 'ตัวย่อธนาคาร', 'ชื่อธนาคาร', 'หมายเหตุ',
    'ตรวจสอบ BM', 'นาทีที่เลิกก่อน', 'นาทีที่เลิกก่อน', 'นาทีที่เลิกก่อน',
    'สาย (นาที)', 'สาย', 'กะการทำงาน', 'เวลาเริ่ม', 'เวลาเลิก',
    'ชั่วโมงทำงาน', 'นาทีที่หักจริง', 'จำนวนเงินหักสาย', 'นาทีที่ออกก่อน',
    'ค่าแรง/นาที', 'จำนวนเงินหักออกก่อน', 'ค่าแรง',
    'OT ก่อน (เวลา)', 'OT ก่อน (จำนวนชม.)',
    'OT หลัง (เวลา)', 'OT หลัง (จำนวนชม.)',
    'รวม OT', 'ค่าแรง OT', 'รวมค่าแรง', 'หักสินค้าชำรุด', 'หักอื่น ๆ',
  ]

  // Row 1-7: department summary placeholders
  const blank = new Array(headerRow.length).fill('')
  const aoa: any[][] = []
  for (let i = 0; i < 7; i++) aoa.push(blank.slice())
  aoa.push(headerRow)

  // Sample data rows
  aoa.push([
    1, 'สมชาย ใจดี', '08:30:39', '17:30:00', 'BM1', 'ชาย',
    '', '', '', '', '', '', '', '', '',
    '', '', '08:30 - 17:30', '', '',
    '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '',
  ])
  aoa.push([
    2, 'สมหญิง ทำงาน', '09:47:34', '17:30:00', 'BM3', 'หญิง',
    '', '', '', '', '', '', '', '', '',
    '', '', '08:30 - 17:30', '', '',
    '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '',
  ])
  aoa.push([
    3, 'นักศึกษาฝึกงาน เอ', 'เอ', '08:30:53', '17:30:00', 'นักศึกษา',
    '', '', '', '', '', '', '', '',
    '', '', '', '08:30 - 17:30', '', '',
    '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '',
  ])

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'วันที่ 1')

  // Instructions sheet
  const instr = [
    ['Boxme Thailand — Payroll Template'],
    [''],
    ['1. Each daily timesheet sheet must be named "วันที่ N" (e.g., "วันที่ 1").'],
    ['2. Header row sits on row 8. Data starts row 9.'],
    ['3. Required columns: ชื่อ-นามสกุล, Checkin time, Checkout time, Note, กะการทำงาน.'],
    ['4. Note column = department code: BM1 / BM3 / DW1 / DW3 / นักศึกษา / แม่บ้าน.'],
    ['5. Shift code format: "HH:MM - HH:MM" (e.g., "08:30 - 17:30" or "17:00 - 02:00" for night shift).'],
    ['6. OT columns: hours as decimals (e.g., 1.5 for 90 minutes).'],
    ['7. Damage / other deduction in THB.'],
    ['8. The Members sheet provides bank info. สินค้าเสียหาย is the damage log.'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instr), 'README')

  XLSX.writeFile(wb, fileName)
}
