export type Lang = 'en' | 'vi' | 'th'

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
]

export const DICT = {
  // Header
  'app.title': { en: 'Boxme TH Payroll', vi: 'Boxme TH Payroll', th: 'Boxme TH Payroll' },
  'app.subtitle': { en: 'Seasonal MVP · Phase 1', vi: 'MVP thời vụ · Giai đoạn 1', th: 'MVP ตามฤดูกาล · เฟส 1' },
  'app.version': { en: 'v0.1 MVP', vi: 'v0.1 MVP', th: 'v0.1 MVP' },

  // Hero / landing
  'hero.badge': { en: 'Phase 1 MVP · TH only · base + OT', vi: 'Giai đoạn 1 MVP · Chỉ TH · base + OT', th: 'เฟส 1 MVP · TH เท่านั้น · ค่าแรง + OT' },
  'hero.title': { en: 'Calculate seasonal collaborator wages for Boxme Thailand', vi: 'Tính lương cộng tác viên Boxme Thailand', th: 'คำนวณค่าจ้างพนักงานตามฤดูกาล Boxme Thailand' },
  'hero.desc': {
    en: 'Upload the daily timesheet Excel file. The system parses each daily sheet, applies the original Excel formula (base 500 ฿ · OT 1.5× · late penalty BM/DW only), and exports bank-ready CSV.',
    vi: 'Tải file Excel timesheet hàng ngày. Hệ thống phân tích từng sheet, áp dụng đúng công thức Excel gốc (base 500 ฿ · OT 1.5× · phạt trễ chỉ BM/DW) và xuất file ngân hàng.',
    th: 'อัปโหลดไฟล์ Excel timesheet รายวัน ระบบจะอ่านทุกชีท ใช้สูตร Excel เดิม (ค่าแรง 500 ฿ · OT 1.5× · หักสายเฉพาะ BM/DW) และส่งออกไฟล์สำหรับธนาคาร',
  },

  // Uploader
  'upload.dropTitle': { en: 'Upload your timesheet Excel', vi: 'Tải file Excel timesheet', th: 'อัปโหลดไฟล์ timesheet' },
  'upload.processing': { en: 'Processing...', vi: 'Đang xử lý...', th: 'กำลังประมวลผล...' },
  'upload.help': {
    en: 'Drag & drop your .xlsx file or click to choose. All processing runs in your browser — files are never uploaded to a server.',
    vi: 'Kéo-thả file .xlsx hoặc nhấp để chọn. Mọi xử lý chạy local trên trình duyệt — file không upload lên server.',
    th: 'ลากไฟล์ .xlsx มาวางหรือคลิกเพื่อเลือก ทุกอย่างทำงานบนเบราว์เซอร์ ไฟล์ไม่ถูกส่งขึ้นเซิร์ฟเวอร์',
  },
  'upload.button': { en: 'Choose .xlsx file', vi: 'Chọn file .xlsx', th: 'เลือกไฟล์ .xlsx' },
  'upload.constraint': { en: 'Supports .xlsx · 1 file · max 20 MB', vi: 'Hỗ trợ .xlsx · 1 file · tối đa 20 MB', th: 'รองรับ .xlsx · 1 ไฟล์ · สูงสุด 20 MB' },
  'upload.template': { en: 'Download template', vi: 'Tải template mẫu', th: 'ดาวน์โหลดเทมเพลต' },
  'upload.guide': { en: 'How to use', vi: 'Hướng dẫn sử dụng', th: 'วิธีใช้งาน' },
  'upload.formula': { en: 'How calculation works', vi: 'Cách tính lương', th: 'วิธีคำนวณ' },

  // Stats
  'stat.totalGross': { en: 'Total gross wages', vi: 'Tổng lương gross', th: 'ค่าแรงรวมทั้งหมด' },
  'stat.workers': { en: 'Collaborators', vi: 'Số CTV', th: 'จำนวนคนงาน' },
  'stat.days': { en: 'Workdays', vi: 'Số ngày làm', th: 'วันทำงาน' },
  'stat.shifts': { en: 'Shifts', vi: 'Số ca công', th: 'จำนวนกะ' },
  'stat.totalOt': { en: 'Total OT pay', vi: 'Tổng OT', th: 'OT รวม' },
  'stat.totalDeduction': { en: 'Total deductions', vi: 'Tổng khấu trừ', th: 'ยอดหักรวม' },

  // Toolbar
  'tb.fileLabel': { en: 'sheets parsed · ready', vi: 'sheet đã tính toán', th: 'ชีทถูกประมวลผล' },
  'tb.exportDaily': { en: 'Daily.xlsx', vi: 'Daily.xlsx', th: 'Daily.xlsx' },
  'tb.exportWorkers': { en: 'Workers.xlsx', vi: 'Workers.xlsx', th: 'Workers.xlsx' },
  'tb.exportBank': { en: 'Bank.csv', vi: 'Bank.csv', th: 'Bank.csv' },
  'tb.reset': { en: 'New file', vi: 'File khác', th: 'ไฟล์ใหม่' },

  // Worker table
  'wt.title': { en: 'Worker payroll summary', vi: 'Tổng hợp lương theo CTV', th: 'สรุปค่าจ้างต่อคน' },
  'wt.count': { en: 'people · sorted by gross desc', vi: 'người · sắp xếp theo lương cao→thấp', th: 'คน · เรียงจากมาก→น้อย' },
  'wt.search': { en: 'Search name / phone / acct...', vi: 'Tìm tên / SĐT / TK...', th: 'ค้นหาชื่อ / เบอร์ / เลขบัญชี...' },
  'wt.allDept': { en: 'All departments', vi: 'Tất cả phòng ban', th: 'ทุกแผนก' },
  'wt.fullName': { en: 'Name', vi: 'Họ tên', th: 'ชื่อ' },
  'wt.dept': { en: 'Department', vi: 'Phòng ban', th: 'แผนก' },
  'wt.shifts': { en: 'Shifts', vi: 'Ca', th: 'กะ' },
  'wt.deductLateEarly': { en: 'Late/early', vi: 'Trễ/sớm', th: 'สาย/ออกก่อน' },
  'wt.damage': { en: 'Damage', vi: 'Damage', th: 'ของเสียหาย' },
  'wt.ot': { en: 'OT', vi: 'OT', th: 'OT' },
  'wt.totalGross': { en: 'Gross', vi: 'Tổng lương', th: 'รวม' },
  'wt.empty': { en: 'No matching worker.', vi: 'Không có CTV phù hợp.', th: 'ไม่พบคนงาน' },

  // Detail
  'wd.title': { en: 'Worker details', vi: 'Chi tiết CTV', th: 'รายละเอียดคนงาน' },
  'wd.shifts': { en: 'Shifts', vi: 'Ca', th: 'กะ' },
  'wd.totalOt': { en: 'Total OT', vi: 'Tổng OT', th: 'OT รวม' },
  'wd.totalDeduct': { en: 'Deductions', vi: 'Khấu trừ', th: 'ยอดหัก' },
  'wd.totalNet': { en: 'Net wage', vi: 'Lương net', th: 'รับสุทธิ' },
  'wd.daily': { en: 'Daily breakdown', vi: 'Chi tiết theo ngày', th: 'รายละเอียดรายวัน' },
  'wd.shift': { en: 'Shift', vi: 'Ca', th: 'กะ' },
  'wd.late': { en: 'late', vi: 'trễ', th: 'สาย' },
  'wd.early': { en: 'early-out', vi: 'về sớm', th: 'ออกก่อน' },
  'wd.minShort': { en: 'min', vi: 'p', th: 'น.' },
  'wd.formula': { en: 'Show formula', vi: 'Xem công thức', th: 'ดูสูตร' },
  'wd.hide': { en: 'Hide', vi: 'Ẩn', th: 'ซ่อน' },
  'wd.footer': {
    en: 'Calculated from original Excel formula · base 500 ฿ · OT × 1.5 · BM/DW late penalty applies',
    vi: 'Tính theo công thức Excel gốc · base 500 ฿ · OT × 1.5 · BM/DW áp dụng phạt trễ',
    th: 'คำนวณตามสูตร Excel เดิม · 500 ฿ · OT × 1.5 · BM/DW หักสาย',
  },

  // Config
  'cfg.title': { en: 'Calculation settings', vi: 'Cấu hình tính lương', th: 'ตั้งค่าการคำนวณ' },
  'cfg.dailyRate': { en: 'Daily rate (฿)', vi: 'Lương ngày (฿)', th: 'ค่าแรงต่อวัน (฿)' },
  'cfg.otMul': { en: 'OT multiplier', vi: 'Hệ số OT', th: 'ตัวคูณ OT' },
  'cfg.lateBuf': { en: 'Late buffer (min)', vi: 'Buffer trễ (phút)', th: 'ช่วงผ่อนผันสาย (น.)' },
  'cfg.lateRound': { en: 'Late rounding (min)', vi: 'Làm tròn trễ (phút)', th: 'ปัดเศษสาย (น.)' },
  'summary': { en: 'Payroll summary', vi: 'Tổng hợp lương', th: 'สรุปค่าจ้าง' },

  // Mapping dialog
  'map.title': { en: 'Column mapping required', vi: 'Cần ánh xạ cột', th: 'ต้องแมปคอลัมน์' },
  'map.desc': {
    en: 'Some required columns could not be detected automatically. Please match each field to the right column from your Excel header.',
    vi: 'Một số cột bắt buộc không tự nhận diện được. Vui lòng chọn cột tương ứng từ header file Excel của bạn.',
    th: 'ตรวจไม่พบบางคอลัมน์อัตโนมัติ กรุณาเลือกคอลัมน์ที่ตรงกันจากไฟล์ Excel ของคุณ',
  },
  'map.sheet': { en: 'Detected sheet:', vi: 'Sheet đang xử lý:', th: 'ชีทที่กำลังประมวลผล:' },
  'map.notMapped': { en: '— not selected —', vi: '— chưa chọn —', th: '— ยังไม่เลือก —' },
  'map.required': { en: 'required', vi: 'bắt buộc', th: 'จำเป็น' },
  'map.optional': { en: 'optional', vi: 'tuỳ chọn', th: 'ไม่บังคับ' },
  'map.save': { en: 'Save mapping & continue', vi: 'Lưu ánh xạ & tiếp tục', th: 'บันทึกแมปและดำเนินการต่อ' },
  'map.savedToast': { en: 'Mapping saved for this header layout.', vi: 'Đã lưu ánh xạ cho định dạng header này.', th: 'บันทึกการแมปสำหรับเฮดเดอร์นี้แล้ว' },
  'map.field.fullName': { en: 'Full name', vi: 'Họ và tên', th: 'ชื่อ-สกุล' },
  'map.field.checkin': { en: 'Check-in time', vi: 'Giờ checkin', th: 'เวลาเข้างาน' },
  'map.field.checkout': { en: 'Check-out time', vi: 'Giờ checkout', th: 'เวลาเลิกงาน' },
  'map.field.note': { en: 'Department code (Note)', vi: 'Mã phòng ban (Note)', th: 'รหัสแผนก (Note)' },
  'map.field.shift': { en: 'Shift schedule', vi: 'Mã ca làm việc', th: 'รหัสกะ' },
  'map.field.nickname': { en: 'Nickname', vi: 'Tên gọi', th: 'ชื่อเล่น' },
  'map.field.manualNote': { en: 'Manual note (sick leave / phone)', vi: 'Ghi chú (ốm/lý do)', th: 'หมายเหตุ' },
  'map.field.otBefore': { en: 'OT before (hours)', vi: 'OT trước (giờ)', th: 'OT ก่อน (ชม.)' },
  'map.field.otAfter': { en: 'OT after (hours)', vi: 'OT sau (giờ)', th: 'OT หลัง (ชม.)' },
  'map.field.damage': { en: 'Damage deduction', vi: 'Khấu trừ damage', th: 'หักของเสียหาย' },
  'map.field.other': { en: 'Other deduction', vi: 'Khấu trừ khác', th: 'หักอื่น ๆ' },
  'map.resetSaved': { en: 'Reset saved mappings', vi: 'Xoá ánh xạ đã lưu', th: 'รีเซ็ตแมปที่บันทึกไว้' },

  // Help
  'help.title': { en: 'How to use', vi: 'Hướng dẫn sử dụng', th: 'วิธีใช้งาน' },
  'help.s1.title': { en: '1. Prepare your Excel file', vi: '1. Chuẩn bị file Excel', th: '1. เตรียมไฟล์ Excel' },
  'help.s1.body': {
    en: 'The file must contain daily timesheet sheets named "วันที่ N" (e.g. วันที่ 1, วันที่ 2, ...). Each sheet must have its header on row 8 and data from row 9. The "Members" master sheet is recommended (for bank info) but optional.',
    vi: 'File phải có các sheet timesheet hàng ngày tên "วันที่ N" (ví dụ: วันที่ 1, วันที่ 2, ...). Mỗi sheet header ở dòng 8, dữ liệu từ dòng 9. Sheet "Members" được khuyến nghị (lấy thông tin ngân hàng) nhưng không bắt buộc.',
    th: 'ไฟล์ต้องมีชีทรายวันชื่อ "วันที่ N" (เช่น วันที่ 1, วันที่ 2, ...) แต่ละชีทมีเฮดเดอร์ที่แถว 8 และข้อมูลจากแถว 9 แนะนำให้มีชีท "Members" สำหรับข้อมูลธนาคาร',
  },
  'help.s2.title': { en: '2. Upload', vi: '2. Tải file lên', th: '2. อัปโหลด' },
  'help.s2.body': {
    en: 'Drag & drop or click to choose .xlsx. The browser parses everything locally — your file never leaves your device.',
    vi: 'Kéo-thả hoặc nhấp để chọn .xlsx. Trình duyệt xử lý hoàn toàn local — file không rời khỏi máy bạn.',
    th: 'ลากวางหรือคลิกเพื่อเลือก .xlsx เบราว์เซอร์ประมวลผลทั้งหมดในเครื่อง ไฟล์ไม่ออกจากอุปกรณ์',
  },
  'help.s3.title': { en: '3. Review and adjust settings', vi: '3. Kiểm tra và điều chỉnh', th: '3. ตรวจสอบและปรับตั้งค่า' },
  'help.s3.body': {
    en: 'Check the dashboard summary, drill into each worker for daily details. If your shop uses a different daily rate or OT multiplier, change it under "Calculation settings" — the totals re-compute instantly.',
    vi: 'Xem tổng quan dashboard, click vào từng CTV để xem chi tiết. Nếu mức lương ngày hoặc hệ số OT của bạn khác, chỉnh tại "Cấu hình tính lương" — số liệu cập nhật ngay.',
    th: 'ดูสรุปแดชบอร์ด คลิกแต่ละคนเพื่อดูรายละเอียด หากอัตราค่าแรงหรือ OT ต่างไป ปรับใน "ตั้งค่าการคำนวณ"',
  },
  'help.s4.title': { en: '4. Export', vi: '4. Xuất file', th: '4. ส่งออก' },
  'help.s4.body': {
    en: 'Daily.xlsx — every shift with full breakdown. Workers.xlsx — totals per person. Bank.csv — generic CSV ready for bank batch upload (per-bank format adapters arrive in Phase 1.1).',
    vi: 'Daily.xlsx — mỗi ca với breakdown đầy đủ. Workers.xlsx — tổng theo CTV. Bank.csv — CSV chuyển khoản hàng loạt (format riêng từng ngân hàng sẽ có ở Phase 1.1).',
    th: 'Daily.xlsx — ทุกกะแบบละเอียด · Workers.xlsx — รวมต่อคน · Bank.csv — สำหรับอัปโหลดธนาคาร',
  },
  'help.s5.title': { en: '5. Column mapping', vi: '5. Ánh xạ cột', th: '5. การแมปคอลัมน์' },
  'help.s5.body': {
    en: 'If your headers are different from the standard template, the app shows a mapping screen. Map each field once — the choice is remembered for the same header layout next time.',
    vi: 'Nếu header file của bạn khác template chuẩn, app sẽ hiện màn hình ánh xạ cột. Ánh xạ một lần — lần sau dùng cùng định dạng sẽ tự nhớ.',
    th: 'หากเฮดเดอร์ของคุณต่างจากเทมเพลต ระบบจะแสดงหน้าแมปคอลัมน์ ทำครั้งเดียวระบบจดจำไว้ครั้งถัดไป',
  },

  // Formula explanation
  'fx.title': { en: 'Calculation method (transparent)', vi: 'Cách tính lương (chi tiết minh bạch)', th: 'วิธีการคำนวณ (โปร่งใส)' },
  'fx.intro': {
    en: 'Every value below is computed from the original Excel formulas extracted from the Boxme TH timesheet. Numbers can be reproduced row-by-row in Excel.',
    vi: 'Tất cả giá trị dưới đây tính theo công thức Excel gốc trích xuất từ file timesheet Boxme TH. Có thể đối chiếu từng dòng với Excel.',
    th: 'ค่าทั้งหมดคำนวณตามสูตร Excel เดิมของ Boxme TH สามารถตรวจสอบทีละแถวกับ Excel ได้',
  },
  'fx.step1': { en: 'Step 1 — Hours bucket U', vi: 'Bước 1 — Hệ số giờ U', th: 'ขั้นที่ 1 — ตัว U' },
  'fx.step1.body': {
    en: 'If the shift is 6 hours or shorter (e.g., a half-day), U = 5. Otherwise U = 8. This mirrors the original Excel formula and is used as the divisor for wage-per-minute.',
    vi: 'Nếu ca dài ≤ 6 tiếng (vd: nửa ngày), U = 5. Ngược lại U = 8. Đây là công thức Excel gốc, dùng làm mẫu số cho "lương/phút".',
    th: 'ถ้ากะ ≤ 6 ชม. (เช่นครึ่งวัน) U = 5 มิฉะนั้น U = 8 ใช้เป็นตัวหารสำหรับ "ค่าแรงต่อนาที"',
  },
  'fx.step2': { en: 'Step 2 — Wage per minute', vi: 'Bước 2 — Lương/phút', th: 'ขั้นที่ 2 — ค่าแรงต่อนาที' },
  'fx.step2.body': {
    en: 'wage_per_minute = daily_rate ÷ (U × 60). With base 500 ฿ and U = 8 → 500 / 480 = 1.0417 ฿/min.',
    vi: 'wage_per_minute = lương_ngày ÷ (U × 60). Với base 500 ฿ và U = 8 → 500 / 480 = 1.0417 ฿/phút.',
    th: 'ค่าแรง/นาที = ค่าแรงต่อวัน ÷ (U × 60) เช่น 500 ÷ 480 = 1.0417 ฿/นาที',
  },
  'fx.step3': { en: 'Step 3 — Late deduction', vi: 'Bước 3 — Khấu trừ trễ giờ', th: 'ขั้นที่ 3 — หักสาย' },
  'fx.step3.body': {
    en: 'Late minutes = max(0, checkin − shift_start). After applying the late buffer, the result is multiplied by wage_per_minute. ⚠️ Only BM and DW workers receive this penalty — interns (นักศึกษา) and housekeepers (แม่บ้าน) are exempt, as in the original Excel.',
    vi: 'Phút trễ = max(0, checkin − giờ_bắt_đầu). Trừ buffer (nếu có), nhân với lương/phút. ⚠️ Chỉ áp dụng cho BM và DW — intern (นักศึกษา) và housekeeper (แม่บ้าน) được miễn, đúng theo Excel gốc.',
    th: 'นาทีสาย = max(0, เวลาเข้า − เวลาเริ่มกะ) หักช่วงผ่อนผันแล้วคูณค่าแรง/นาที ⚠️ ใช้กับ BM/DW เท่านั้น นักศึกษาและแม่บ้านได้รับการยกเว้น',
  },
  'fx.step4': { en: 'Step 4 — Early-out deduction', vi: 'Bước 4 — Khấu trừ về sớm', th: 'ขั้นที่ 4 — หักออกก่อน' },
  'fx.step4.body': {
    en: 'Early-out minutes = max(0, shift_end − checkout) × wage_per_minute. Currently applied to all departments (matches Excel).',
    vi: 'Phút về sớm = max(0, giờ_kết_thúc − checkout) × lương/phút. Áp dụng cho mọi phòng ban (đúng Excel).',
    th: 'นาทีออกก่อน = max(0, เวลาเลิก − เวลาออก) × ค่าแรง/นาที ใช้ทุกแผนก',
  },
  'fx.step5': { en: 'Step 5 — Overtime pay', vi: 'Bước 5 — Tiền OT', th: 'ขั้นที่ 5 — ค่า OT' },
  'fx.step5.body': {
    en: 'OT pay = (daily_rate ÷ U) × 1.5 × total_OT_hours. Example: 2h OT on a base of 500 with U=8 → (500/8) × 1.5 × 2 = 187.5 ฿.',
    vi: 'OT pay = (lương_ngày ÷ U) × 1.5 × tổng_giờ_OT. Ví dụ: OT 2h, base 500, U=8 → (500/8) × 1.5 × 2 = 187.5 ฿.',
    th: 'OT = (ค่าแรงต่อวัน ÷ U) × 1.5 × ชั่วโมง OT รวม เช่น OT 2 ชม. = (500/8) × 1.5 × 2 = 187.5 ฿',
  },
  'fx.step6': { en: 'Step 6 — Damage & other deductions', vi: 'Bước 6 — Damage & khấu trừ khác', th: 'ขั้นที่ 6 — หักของเสียหาย/อื่น ๆ' },
  'fx.step6.body': {
    en: 'Damage and other deductions are entered directly per row. They are subtracted from the daily wage. If damage exceeds the wage, gross is floored at 0 (no negative pay).',
    vi: 'Damage và khấu trừ khác nhập trực tiếp theo từng dòng, trừ vào lương ngày. Nếu damage > lương → gross floor về 0 (không trả âm).',
    th: 'ค่าของเสียหายและการหักอื่นกรอกในแต่ละแถว หักจากค่าแรง หากมากกว่าค่าแรง รวมจะเป็น 0',
  },
  'fx.step7': { en: 'Step 7 — Gross wage', vi: 'Bước 7 — Lương gross', th: 'ขั้นที่ 7 — รวมค่าแรง' },
  'fx.step7.body': {
    en: 'gross = daily_rate − late_deduction − early_out − damage − other + OT_pay. Floored at 0.',
    vi: 'gross = lương_ngày − trừ_trễ − trừ_sớm − damage − khác + OT. Floor về 0.',
    th: 'รวม = ค่าแรงต่อวัน − หักสาย − หักออกก่อน − ของเสียหาย − อื่น + OT (ขั้นต่ำ 0)',
  },
  'fx.glossary': { en: 'Glossary', vi: 'Thuật ngữ', th: 'อภิธานศัพท์' },
  'fx.glossary.body': {
    en: 'BM/DW = warehouse / loading-dock departments — late penalty applies. นักศึกษา = student intern · แม่บ้าน = housekeeper — both exempt from late penalty (always paid full base if they show up). กะ = shift. U = hours bucket (5 or 8) used as divisor.',
    vi: 'BM/DW = phòng ban kho/dock — áp dụng phạt trễ. นักศึกษา = thực tập sinh · แม่บ้าน = lao công — cả hai miễn phạt trễ (vẫn trả full lương ngày nếu có mặt). กะ = ca làm. U = bucket giờ (5 hoặc 8) dùng làm mẫu số.',
    th: 'BM/DW = แผนกคลัง/โหลด — หักสาย · นักศึกษา = นักศึกษาฝึกงาน · แม่บ้าน = พนักงานทำความสะอาด — ทั้งสองได้รับยกเว้น',
  },
  'fx.checks': { en: 'How Boxme TH can double-check', vi: 'Cách Boxme TH đối chiếu', th: 'วิธีตรวจสอบของ Boxme TH' },
  'fx.checks.body': {
    en: '(1) Open the original Excel and recalculate (F9) — column AH = our gross. (2) Compare the bank export totals to your previous-month payment file. (3) For 1 month, run this tool and Excel in parallel — discrepancies should be zero.',
    vi: '(1) Mở Excel gốc, recalculate (F9) — cột AH = gross của tool. (2) So tổng file bank export với file thanh toán tháng trước. (3) Chạy song song 1 tháng — chênh lệch phải bằng 0.',
    th: '(1) เปิด Excel เดิม กด F9 ให้คำนวณใหม่ — คอลัมน์ AH = ค่าจ้างของเครื่องมือนี้ (2) เทียบยอดไฟล์ bank กับไฟล์เดือนที่แล้ว (3) ใช้คู่กัน 1 เดือน ผลควรเท่ากันทุกบาท',
  },

  // Footer
  'footer': { en: 'Boxme Vietnam BA · MVP v0.1 · processed locally, no upload', vi: 'Boxme Vietnam BA · MVP v0.1 · xử lý local, không upload', th: 'Boxme Vietnam BA · MVP v0.1 · ประมวลผลในเครื่อง' },

  // Errors
  'err.noData': { en: 'No timesheet data found. Make sure the file has วันที่ X sheets.', vi: 'Không tìm thấy dữ liệu chấm công. Đảm bảo có sheet วันที่ X.', th: 'ไม่พบข้อมูล timesheet ตรวจสอบให้มีชีท วันที่ X' },
  'err.parse': { en: 'Could not read the Excel file.', vi: 'Không thể đọc file Excel.', th: 'อ่านไฟล์ Excel ไม่ได้' },
  'warn.title': { en: 'Warnings', vi: 'Cảnh báo', th: 'คำเตือน' },

  // Common
  'common.close': { en: 'Close', vi: 'Đóng', th: 'ปิด' },
  'common.cancel': { en: 'Cancel', vi: 'Huỷ', th: 'ยกเลิก' },
  'common.continue': { en: 'Continue', vi: 'Tiếp tục', th: 'ดำเนินการต่อ' },
  'common.lang': { en: 'Language', vi: 'Ngôn ngữ', th: 'ภาษา' },
  'common.save': { en: 'Save', vi: 'Lưu', th: 'บันทึก' },
  'common.edit': { en: 'Edit', vi: 'Sửa', th: 'แก้ไข' },
  'common.delete': { en: 'Delete', vi: 'Xoá', th: 'ลบ' },
  'common.loading': { en: 'Loading…', vi: 'Đang tải…', th: 'กำลังโหลด…' },
  'common.noData': { en: 'No data found.', vi: 'Không có dữ liệu.', th: 'ไม่พบข้อมูล' },

  // Navigation
  'nav.payroll': { en: 'Payroll', vi: 'Tính lương', th: 'คำนวณเงินเดือน' },
  'nav.workers': { en: 'Workers', vi: 'Nhân viên', th: 'พนักงาน' },
  'nav.admin': { en: 'Admin', vi: 'Quản trị', th: 'ผู้ดูแล' },
  'nav.settings': { en: 'Settings', vi: 'Cài đặt', th: 'ตั้งค่า' },

  // Workers page
  'workers.title': { en: 'Workers', vi: 'Nhân viên', th: 'พนักงาน' },
  'workers.add': { en: 'Add Worker', vi: 'Thêm nhân viên', th: 'เพิ่มพนักงาน' },
  'workers.search': { en: 'Search name / code…', vi: 'Tìm tên / mã…', th: 'ค้นหาชื่อ / รหัส…' },
  'workers.filter.all': { en: 'All', vi: 'Tất cả', th: 'ทั้งหมด' },
  'workers.filter.pending': { en: 'Pending update', vi: 'Chờ cập nhật', th: 'รอการอัปเดต' },
  'workers.filter.active': { en: 'Active', vi: 'Đang làm', th: 'ใช้งาน' },
  'workers.filter.resigned': { en: 'Resigned', vi: 'Đã nghỉ', th: 'ลาออก' },
  'workers.filter.inactive': { en: 'Inactive', vi: 'Không hoạt động', th: 'ไม่ใช้งาน' },
  'workers.status.active': { en: 'Active', vi: 'Đang làm', th: 'ใช้งาน' },
  'workers.status.pending_update': { en: 'Pending update', vi: 'Chờ cập nhật', th: 'รอการอัปเดต' },
  'workers.status.resigned': { en: 'Resigned', vi: 'Đã nghỉ', th: 'ลาออก' },
  'workers.status.inactive': { en: 'Inactive', vi: 'Không hoạt động', th: 'ไม่ใช้งาน' },
  'workers.col.code': { en: 'Code', vi: 'Mã', th: 'รหัส' },
  'workers.col.name': { en: 'Name', vi: 'Họ tên', th: 'ชื่อ' },
  'workers.col.dept': { en: 'Dept', vi: 'Bộ phận', th: 'แผนก' },
  'workers.col.bank': { en: 'Bank', vi: 'Ngân hàng', th: 'ธนาคาร' },
  'workers.col.status': { en: 'Status', vi: 'Trạng thái', th: 'สถานะ' },
  'workers.remove.title': { en: 'Remove Worker?', vi: 'Xoá nhân viên?', th: 'ลบพนักงาน?' },
  'workers.remove.body': { en: 'This will soft-delete {name} and mark them as resigned. The record is preserved for payroll history.', vi: 'Hành động này sẽ xoá mềm {name} và chuyển trạng thái thành đã nghỉ. Hồ sơ được giữ lại cho lịch sử lương.', th: 'การกระทำนี้จะลบ {name} แบบ soft-delete และเปลี่ยนสถานะเป็นลาออก บันทึกยังคงอยู่สำหรับประวัติเงินเดือน' },
  'workers.noFound': { en: 'No workers found.', vi: 'Không tìm thấy nhân viên.', th: 'ไม่พบพนักงาน' },
  'workers.form.code': { en: 'Employee Code', vi: 'Mã nhân viên', th: 'รหัสพนักงาน' },
  'workers.form.nameLocal': { en: 'Full Name', vi: 'Họ tên (tiếng Việt)', th: 'ชื่อ-นามสกุล' },
  'workers.form.nameEn': { en: 'Full Name (English)', vi: 'Họ tên (tiếng Anh)', th: 'ชื่อ-นามสกุล (อังกฤษ)' },
  'workers.form.warehouse': { en: 'Warehouse', vi: 'Kho', th: 'คลังสินค้า' },
  'workers.form.dept': { en: 'Department', vi: 'Bộ phận', th: 'แผนก' },
  'workers.form.jobType': { en: 'Job Type', vi: 'Loại hợp đồng', th: 'ประเภทงาน' },
  'workers.form.bankCode': { en: 'Bank Code', vi: 'Ngân hàng', th: 'รหัสธนาคาร' },
  'workers.form.bankAccount': { en: 'Bank Account', vi: 'Số tài khoản', th: 'หมายเลขบัญชี' },
  'workers.form.phone': { en: 'Phone', vi: 'Điện thoại', th: 'โทรศัพท์' },
  'workers.form.startDate': { en: 'Start Date', vi: 'Ngày bắt đầu', th: 'วันที่เริ่มงาน' },

  // Payroll badges (post-compute warnings)
  'badge.pendingWorkers': { en: '{n} new workers need info', vi: '{n} CTV mới chưa có thông tin', th: '{n} พนักงานใหม่ยังไม่มีข้อมูล' },
  'badge.openWorkers': { en: 'Open Workers', vi: 'Mở Workers', th: 'เปิดพนักงาน' },
  'badge.otOutlier': { en: '{n} days with OT > 4h', vi: '{n} ngày OT > 4h', th: '{n} วันมี OT > 4 ชม.' },
  'badge.totalGross': { en: 'Total gross', vi: 'Tổng gross', th: 'รวม Gross' },

  // Warehouse switcher
  'warehouse.label': { en: 'Warehouse', vi: 'Kho', th: 'คลังสินค้า' },
  'warehouse.switch': { en: 'Switch warehouse', vi: 'Đổi kho', th: 'เปลี่ยนคลัง' },
} as const

export type DictKey = keyof typeof DICT

export function translate(key: DictKey, lang: Lang): string {
  const entry = DICT[key]
  if (!entry) return key
  return (entry as any)[lang] || (entry as any).en || key
}
