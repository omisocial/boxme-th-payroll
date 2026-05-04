export type GL = 'en' | 'vi' | 'th'

export interface T3 { en: string; vi: string; th: string }

export interface GuideItem {
  heading: T3
  body: T3
  tip?: T3
  warn?: T3
  code?: string
}

export interface GuideSection {
  id: string
  title: T3
  intro: T3
  items: GuideItem[]
}

export const GUIDE_SECTIONS: GuideSection[] = [
  // ─── 1. OVERVIEW ────────────────────────────────────────────────────────────
  {
    id: 'overview',
    title: { en: '1. Overview', vi: '1. Tổng quan', th: '1. ภาพรวม' },
    intro: {
      en: 'Boxme Sessional Payroll is a web-based payroll system for calculating and managing wages for seasonal contractors at Boxme Thailand warehouses.',
      vi: 'Boxme Sessional Payroll là hệ thống tính lương trên web, dùng để tính toán và quản lý lương cho cộng tác viên thời vụ tại các kho Boxme Thailand.',
      th: 'Boxme Sessional Payroll คือระบบเงินเดือนบนเว็บ สำหรับคำนวณและจัดการค่าจ้างพนักงานรายวัน/ตามฤดูกาลของ Boxme Thailand',
    },
    items: [
      {
        heading: { en: 'What does this system do?', vi: 'Hệ thống làm gì?', th: 'ระบบนี้ทำอะไร?' },
        body: {
          en: 'Upload a daily timesheet Excel file → the system parses each day sheet, applies the official Boxme wage formula (base rate + OT × 1.5 − late/early deductions − damage), and lets you export a bank-ready CSV for batch payment.',
          vi: 'Upload file Excel chấm công hàng ngày → hệ thống tự parse từng sheet ngày, áp dụng công thức lương Boxme chuẩn (lương cơ bản + OT × 1.5 − trừ trễ/sớm − damage), rồi xuất file CSV để chuyển khoản hàng loạt.',
          th: 'อัปโหลดไฟล์ Excel timesheet รายวัน → ระบบอ่านแต่ละชีทวัน ใช้สูตรค่าจ้าง Boxme มาตรฐาน (ค่าแรงพื้นฐาน + OT × 1.5 − หักสาย/ออกก่อน − ของเสียหาย) แล้วส่งออกไฟล์ CSV สำหรับโอนเงินเป็นชุด',
        },
      },
      {
        heading: { en: 'Who uses this system?', vi: 'Ai sử dụng?', th: 'ใครใช้ระบบนี้?' },
        body: {
          en: 'HR staff uploads timesheets and manages worker records. Supervisors can enter manual attendance. Country Admins configure rates and approve periods. Super Admins manage all users and system settings.',
          vi: 'Nhân viên HR upload timesheet và quản lý hồ sơ CTV. Supervisor có thể nhập chấm công thủ công. Country Admin cấu hình mức lương và duyệt kỳ lương. Super Admin quản lý toàn bộ người dùng và cài đặt hệ thống.',
          th: 'เจ้าหน้าที่ HR อัปโหลด timesheet และจัดการข้อมูลพนักงาน หัวหน้างานบันทึกเวลาเข้า-ออกด้วยตนเอง Country Admin ตั้งค่าอัตราค่าจ้างและอนุมัติรอบเงินเดือน Super Admin จัดการผู้ใช้และการตั้งค่าทั้งหมด',
        },
      },
      {
        heading: { en: 'Key features', vi: 'Tính năng chính', th: 'ฟีเจอร์หลัก' },
        body: {
          en: '• Parse multi-day Excel timesheets automatically\n• Exact replica of original Boxme Excel wage formula\n• Worker master data with bank account storage\n• Payment period tracking (open → locked → approved)\n• Monthly summary reports with department breakdown\n• Export Daily.xlsx, Workers.xlsx, Bank.csv\n• Multi-language UI: English, Vietnamese, Thai\n• Role-based access control (5 roles)',
          vi: '• Tự động parse file Excel chấm công nhiều ngày\n• Công thức lương giống hệt file Excel Boxme gốc\n• Hồ sơ CTV với thông tin tài khoản ngân hàng\n• Theo dõi kỳ thanh toán (mở → khoá → duyệt)\n• Báo cáo tổng hợp tháng theo phòng ban\n• Xuất Daily.xlsx, Workers.xlsx, Bank.csv\n• Giao diện đa ngôn ngữ: Anh, Việt, Thái\n• Phân quyền theo vai trò (5 vai trò)',
          th: '• อ่านไฟล์ Excel timesheet หลายวันอัตโนมัติ\n• สูตรค่าจ้างเหมือนกับไฟล์ Excel Boxme ต้นฉบับทุกประการ\n• ฐานข้อมูลพนักงานพร้อมข้อมูลบัญชีธนาคาร\n• ติดตามรอบการชำระเงิน (เปิด → ล็อก → อนุมัติ)\n• รายงานสรุปรายเดือนแยกตามแผนก\n• ส่งออก Daily.xlsx, Workers.xlsx, Bank.csv\n• รองรับหลายภาษา: อังกฤษ, เวียดนาม, ไทย\n• ควบคุมสิทธิ์ตามบทบาท (5 บทบาท)',
        },
      },
    ],
  },

  // ─── 2. LOGIN & ROLES ────────────────────────────────────────────────────────
  {
    id: 'login',
    title: { en: '2. Login & Roles', vi: '2. Đăng nhập & Quyền', th: '2. เข้าสู่ระบบ & สิทธิ์' },
    intro: {
      en: 'Access is controlled by email/password login with role-based permissions. New accounts are created by a Super Admin.',
      vi: 'Quyền truy cập được kiểm soát bằng email/mật khẩu với phân quyền theo vai trò. Tài khoản mới do Super Admin tạo.',
      th: 'การเข้าถึงควบคุมด้วย email/รหัสผ่าน พร้อมสิทธิ์ตามบทบาท บัญชีใหม่สร้างโดย Super Admin',
    },
    items: [
      {
        heading: { en: 'How to log in', vi: 'Cách đăng nhập', th: 'วิธีเข้าสู่ระบบ' },
        body: {
          en: '1. Open the application URL in your browser.\n2. Enter your email address and password.\n3. Click "Sign in".\n4. If it is your first login, you will be prompted to change your password before continuing.',
          vi: '1. Mở URL ứng dụng trong trình duyệt.\n2. Nhập địa chỉ email và mật khẩu.\n3. Nhấn "Đăng nhập".\n4. Nếu là lần đăng nhập đầu tiên, bạn sẽ được yêu cầu đổi mật khẩu trước khi tiếp tục.',
          th: '1. เปิด URL ของแอปพลิเคชันในเบราว์เซอร์\n2. ใส่อีเมลและรหัสผ่าน\n3. คลิก "เข้าสู่ระบบ"\n4. หากเป็นการเข้าสู่ระบบครั้งแรก ระบบจะให้เปลี่ยนรหัสผ่านก่อนดำเนินการต่อ',
        },
        tip: {
          en: 'Supported browsers: Chrome, Edge, Firefox (latest versions). Safari on Mac is also supported.',
          vi: 'Trình duyệt được hỗ trợ: Chrome, Edge, Firefox (phiên bản mới nhất). Safari trên Mac cũng được hỗ trợ.',
          th: 'เบราว์เซอร์ที่รองรับ: Chrome, Edge, Firefox (เวอร์ชันล่าสุด) Safari บน Mac ก็รองรับเช่นกัน',
        },
      },
      {
        heading: { en: 'Change password', vi: 'Đổi mật khẩu', th: 'เปลี่ยนรหัสผ่าน' },
        body: {
          en: 'If your account was set up with a temporary password (force_password_change = true), a password change screen appears immediately after login. Enter your new password twice and confirm. After saving, you will be logged in automatically.',
          vi: 'Nếu tài khoản được tạo với mật khẩu tạm thời (force_password_change = true), màn hình đổi mật khẩu xuất hiện ngay sau khi đăng nhập. Nhập mật khẩu mới hai lần và xác nhận. Sau khi lưu, bạn sẽ tự động đăng nhập.',
          th: 'หากบัญชีถูกสร้างด้วยรหัสผ่านชั่วคราว (force_password_change = true) หน้าจอเปลี่ยนรหัสผ่านจะปรากฏทันทีหลังเข้าสู่ระบบ ใส่รหัสผ่านใหม่สองครั้งแล้วยืนยัน หลังบันทึกจะเข้าสู่ระบบอัตโนมัติ',
        },
      },
      {
        heading: { en: 'Forgot password', vi: 'Quên mật khẩu', th: 'ลืมรหัสผ่าน' },
        body: {
          en: 'Click "Forgot password?" on the login screen. Enter your email address and a reset link will be sent. The link expires after 1 hour. If you do not receive the email, check your spam folder or contact your Super Admin.',
          vi: 'Nhấn "Quên mật khẩu?" trên màn hình đăng nhập. Nhập địa chỉ email và đường dẫn đặt lại sẽ được gửi đến. Đường dẫn hết hạn sau 1 giờ. Nếu không nhận được email, kiểm tra thư mục spam hoặc liên hệ Super Admin.',
          th: 'คลิก "ลืมรหัสผ่าน?" ที่หน้าจอเข้าสู่ระบบ ใส่อีเมลแล้วระบบจะส่งลิงก์รีเซ็ต ลิงก์หมดอายุใน 1 ชั่วโมง หากไม่ได้รับอีเมล ตรวจสอบโฟลเดอร์สแปมหรือติดต่อ Super Admin',
        },
      },
      {
        heading: { en: 'User roles & permissions', vi: 'Vai trò & quyền hạn', th: 'บทบาทผู้ใช้ & สิทธิ์' },
        body: {
          en: 'The system has 4 roles:\n\n• Viewer — Read-only: view reports, download exports\n• HR — Full payroll ops: upload timesheets, manage workers, create/lock periods, mark payments\n• Country Admin — HR + approve periods, manage rate configs, shifts, warehouses, legal limits, create users\n• Super Admin — All permissions + reset demo data, manage all countries\n\nEach account is scoped to a country and optionally to a specific warehouse.',
          vi: 'Hệ thống có 4 vai trò:\n\n• Viewer — Chỉ đọc: xem báo cáo, tải xuất\n• HR — Toàn bộ thao tác lương: upload timesheet, quản lý CTV, tạo/khoá kỳ, đánh dấu thanh toán\n• Country Admin — Như HR + duyệt kỳ, quản lý rate configs, ca, kho, giới hạn pháp lý, tạo tài khoản\n• Super Admin — Tất cả quyền + reset demo, quản lý mọi quốc gia\n\nMỗi tài khoản được giới hạn theo quốc gia và tuỳ chọn theo kho cụ thể.',
          th: 'ระบบมี 4 บทบาท:\n\n• Viewer — อ่านอย่างเดียว: ดูรายงาน ดาวน์โหลด\n• HR — ปฏิบัติการเงินเดือนเต็มรูปแบบ: อัปโหลด timesheet จัดการพนักงาน สร้าง/ล็อกรอบ ทำเครื่องหมายชำระเงิน\n• Country Admin — เหมือน HR + อนุมัติรอบ จัดการ rate configs กะ คลัง ข้อจำกัดทางกฎหมาย สร้างบัญชีผู้ใช้\n• Super Admin — สิทธิ์ทั้งหมด + รีเซ็ตข้อมูลทดสอบ จัดการทุกประเทศ\n\nแต่ละบัญชีถูกจำกัดตามประเทศและเลือกได้ตามคลังสินค้าเฉพาะ',
        },
      },
    ],
  },

  // ─── 3. WORKFLOW ─────────────────────────────────────────────────────────────
  {
    id: 'workflow',
    title: { en: '3. Workflow Overview', vi: '3. Quy trình tổng quan', th: '3. ภาพรวมขั้นตอนการทำงาน' },
    intro: {
      en: 'The system follows a 5-step workflow. The progress bar at the top of the screen shows your current step.',
      vi: 'Hệ thống theo quy trình 5 bước. Thanh tiến trình ở đầu màn hình hiển thị bước hiện tại.',
      th: 'ระบบทำงานตามขั้นตอน 5 ขั้น แถบความคืบหน้าด้านบนแสดงขั้นตอนปัจจุบัน',
    },
    items: [
      {
        heading: { en: 'Step 1 — Import', vi: 'Bước 1 — Import', th: 'ขั้นที่ 1 — Import' },
        body: {
          en: 'Upload the daily timesheet Excel file (.xlsx). The system reads every sheet named "วันที่ N" and extracts attendance records. If column headers are non-standard, a mapping dialog appears.',
          vi: 'Upload file Excel timesheet hàng ngày (.xlsx). Hệ thống đọc mọi sheet tên "วันที่ N" và trích xuất dữ liệu chấm công. Nếu tên cột không chuẩn, dialog ánh xạ sẽ xuất hiện.',
          th: 'อัปโหลดไฟล์ Excel timesheet รายวัน (.xlsx) ระบบอ่านทุกชีทที่ชื่อ "วันที่ N" และดึงข้อมูลการเข้างาน หากชื่อคอลัมน์ไม่ตรงมาตรฐาน กล่องโต้ตอบแมปคอลัมน์จะปรากฏ',
        },
      },
      {
        heading: { en: 'Step 2 — Workers', vi: 'Bước 2 — Workers', th: 'ขั้นที่ 2 — Workers' },
        body: {
          en: 'After import, check for workers flagged as "pending" (new names not yet in the database). Add bank account details and department info for new workers before finalizing payroll.',
          vi: 'Sau import, kiểm tra các CTV được đánh dấu "chờ cập nhật" (tên mới chưa có trong database). Thêm thông tin tài khoản ngân hàng và phòng ban cho CTV mới trước khi chốt lương.',
          th: 'หลังนำเข้า ตรวจสอบพนักงานที่ถูกแจ้งว่า "รอการอัปเดต" (ชื่อใหม่ที่ยังไม่อยู่ในฐานข้อมูล) เพิ่มข้อมูลบัญชีธนาคารและแผนกสำหรับพนักงานใหม่ก่อนสรุปเงินเดือน',
        },
      },
      {
        heading: { en: 'Step 3 — Calculate', vi: 'Bước 3 — Calculate', th: 'ขั้นที่ 3 — Calculate' },
        body: {
          en: 'The payroll calculation runs automatically when the file is uploaded. Review the KPI summary cards and per-worker breakdown. Adjust the daily rate or OT multiplier in "Calculation settings" if needed — totals recalculate instantly.',
          vi: 'Tính lương tự động khi file được upload. Xem tóm tắt KPI và chi tiết từng CTV. Điều chỉnh lương ngày hoặc hệ số OT trong "Cấu hình tính lương" nếu cần — tổng cập nhật ngay.',
          th: 'การคำนวณเงินเดือนทำงานอัตโนมัติเมื่ออัปโหลดไฟล์ ตรวจสอบ KPI สรุปและรายละเอียดต่อคน ปรับค่าแรงรายวันหรือตัวคูณ OT ใน "ตั้งค่าการคำนวณ" ถ้าต้องการ ยอดรวมคำนวณใหม่ทันที',
        },
      },
      {
        heading: { en: 'Step 4 — Pay', vi: 'Bước 4 — Pay', th: 'ขั้นที่ 4 — Pay' },
        body: {
          en: 'Go to the "Pay" tab to manage payment periods. Create a period for the date range, review individual payment lines, and mark workers as paid after bank transfer. Use bulk-select to mark multiple workers at once.',
          vi: 'Chuyển sang tab "Pay" để quản lý kỳ thanh toán. Tạo kỳ cho khoảng ngày, xem từng dòng thanh toán, và đánh dấu đã thanh toán sau khi chuyển khoản. Dùng bulk-select để đánh dấu nhiều CTV cùng lúc.',
          th: 'ไปที่แท็บ "Pay" เพื่อจัดการรอบการชำระเงิน สร้างรอบสำหรับช่วงวันที่ ตรวจสอบแต่ละบรรทัดการชำระเงิน และทำเครื่องหมายพนักงานว่าชำระแล้วหลังโอนเงิน ใช้ bulk-select เพื่อทำเครื่องหมายหลายคนพร้อมกัน',
        },
      },
      {
        heading: { en: 'Step 5 — Report', vi: 'Bước 5 — Report', th: 'ขั้นที่ 5 — Report' },
        body: {
          en: 'View the monthly payroll report with totals broken down by department. Export data as Daily.xlsx (every shift), Workers.xlsx (totals per person), or Bank.csv (for bank batch upload).',
          vi: 'Xem báo cáo lương tháng với tổng theo phòng ban. Xuất dữ liệu dưới dạng Daily.xlsx (mọi ca), Workers.xlsx (tổng theo CTV), hoặc Bank.csv (để upload lên ngân hàng).',
          th: 'ดูรายงานเงินเดือนรายเดือนพร้อมยอดรวมแยกตามแผนก ส่งออกข้อมูลเป็น Daily.xlsx (ทุกกะ) Workers.xlsx (รวมต่อคน) หรือ Bank.csv (สำหรับอัปโหลดธนาคาร)',
        },
      },
    ],
  },

  // ─── 4. IMPORT ───────────────────────────────────────────────────────────────
  {
    id: 'import',
    title: { en: '4. Import Timesheet', vi: '4. Import Timesheet', th: '4. นำเข้า Timesheet' },
    intro: {
      en: 'The import step reads your daily timesheet Excel file and extracts all attendance records for payroll calculation.',
      vi: 'Bước import đọc file Excel timesheet hàng ngày và trích xuất toàn bộ dữ liệu chấm công để tính lương.',
      th: 'ขั้นตอนนำเข้าอ่านไฟล์ Excel timesheet รายวันของคุณและดึงข้อมูลการเข้างานทั้งหมดเพื่อคำนวณเงินเดือน',
    },
    items: [
      {
        heading: { en: 'Excel file requirements', vi: 'Yêu cầu file Excel', th: 'ข้อกำหนดไฟล์ Excel' },
        body: {
          en: 'The file must be .xlsx format (not .xls or .csv). It must contain one or more day sheets named exactly "วันที่ 1", "วันที่ 2", ... "วันที่ 31". Each day sheet has:\n• Row 8 — column headers\n• Row 9 onwards — attendance data\n\nOptional: a "Members" sheet containing full name, bank code, and bank account number for auto-fill.',
          vi: 'File phải là định dạng .xlsx (không phải .xls hay .csv). Phải có một hoặc nhiều sheet ngày đặt tên chính xác "วันที่ 1", "วันที่ 2", ... "วันที่ 31". Mỗi sheet ngày:\n• Hàng 8 — tiêu đề cột\n• Từ hàng 9 trở đi — dữ liệu chấm công\n\nTuỳ chọn: sheet "Members" chứa họ tên đầy đủ, mã ngân hàng, số tài khoản để tự điền.',
          th: 'ไฟล์ต้องเป็นรูปแบบ .xlsx (ไม่ใช่ .xls หรือ .csv) ต้องมีชีทวันอย่างน้อยหนึ่งชีทที่ชื่อ "วันที่ 1", "วันที่ 2", ... "วันที่ 31" แต่ละชีทวัน:\n• แถว 8 — หัวคอลัมน์\n• แถว 9 เป็นต้นไป — ข้อมูลการเข้างาน\n\nไม่บังคับ: ชีท "Members" ที่มีชื่อเต็ม รหัสธนาคาร และหมายเลขบัญชีสำหรับเติมอัตโนมัติ',
        },
        tip: {
          en: 'Download the official template from the upload screen to ensure your file has the correct structure.',
          vi: 'Tải template chính thức từ màn hình upload để đảm bảo file có cấu trúc đúng.',
          th: 'ดาวน์โหลดเทมเพลตอย่างเป็นทางการจากหน้าจออัปโหลดเพื่อให้แน่ใจว่าไฟล์มีโครงสร้างที่ถูกต้อง',
        },
      },
      {
        heading: { en: 'Required columns', vi: 'Cột bắt buộc', th: 'คอลัมน์ที่จำเป็น' },
        body: {
          en: 'Required (must be present):\n• Full name — worker\'s name as it appears in the worker database\n• Check-in time — HH:MM or Excel serial time\n• Check-out time — HH:MM or Excel serial time\n\nOptional (improve accuracy):\n• Department code (Note) — e.g. "bm", "dw" for late-penalty classification\n• Shift code — links to shift definitions for exact start/end times\n• OT before / OT after — overtime hours (decimal)\n• Damage deduction — baht amount\n• Other deduction — baht amount\n• Manual note — sick leave, personal leave keywords',
          vi: 'Bắt buộc (phải có):\n• Họ và tên — tên CTV như trong database\n• Giờ check-in — HH:MM hoặc số serial Excel\n• Giờ check-out — HH:MM hoặc số serial Excel\n\nTuỳ chọn (tăng độ chính xác):\n• Mã phòng ban (Note) — ví dụ "bm", "dw" để phân loại phạt trễ\n• Mã ca — liên kết đến định nghĩa ca cho giờ bắt đầu/kết thúc chính xác\n• OT trước / OT sau — giờ OT (số thập phân)\n• Khấu trừ damage — số tiền baht\n• Khấu trừ khác — số tiền baht\n• Ghi chú thủ công — từ khoá nghỉ ốm, nghỉ việc riêng',
          th: 'จำเป็น (ต้องมี):\n• ชื่อเต็ม — ชื่อพนักงานตามที่อยู่ในฐานข้อมูล\n• เวลาเข้างาน — HH:MM หรือ serial time ของ Excel\n• เวลาออกงาน — HH:MM หรือ serial time ของ Excel\n\nไม่บังคับ (เพิ่มความแม่นยำ):\n• รหัสแผนก (Note) — เช่น "bm", "dw" เพื่อจัดประเภทการหักสาย\n• รหัสกะ — เชื่อมกับนิยามกะสำหรับเวลาเริ่ม/สิ้นสุดที่แน่นอน\n• OT ก่อน / OT หลัง — ชั่วโมง OT (ทศนิยม)\n• หักของเสียหาย — จำนวนเงินบาท\n• หักอื่น ๆ — จำนวนเงินบาท\n• หมายเหตุ — คีย์เวิร์ดลาป่วย ลากิจ',
        },
      },
      {
        heading: { en: 'How to upload', vi: 'Cách upload', th: 'วิธีอัปโหลด' },
        body: {
          en: '1. On the Payroll tab, drag your .xlsx file onto the upload zone — or click "Choose .xlsx file" to browse.\n2. The system parses the file entirely in your browser. Files are never sent to a server.\n3. If parsing succeeds, the dashboard appears immediately with KPI cards and the worker table.\n4. If the file has no "วันที่ N" sheets, an error message is shown. Check the sheet names in your Excel file.',
          vi: '1. Trên tab Payroll, kéo file .xlsx vào vùng upload — hoặc nhấn "Chọn file .xlsx" để duyệt.\n2. Hệ thống parse file hoàn toàn trong trình duyệt. File không được gửi lên server.\n3. Nếu parse thành công, dashboard xuất hiện ngay với KPI cards và bảng CTV.\n4. Nếu file không có sheet "วันที่ N", thông báo lỗi được hiển thị. Kiểm tra tên sheet trong file Excel.',
          th: '1. ที่แท็บ Payroll ลากไฟล์ .xlsx มายังพื้นที่อัปโหลด หรือคลิก "เลือกไฟล์ .xlsx" เพื่อเรียกดู\n2. ระบบอ่านไฟล์ทั้งหมดในเบราว์เซอร์ของคุณ ไม่มีการส่งไฟล์ไปยังเซิร์ฟเวอร์\n3. หากสำเร็จ แดชบอร์ดจะปรากฏทันทีพร้อม KPI cards และตารางพนักงาน\n4. หากไฟล์ไม่มีชีท "วันที่ N" จะแสดงข้อความแจ้งข้อผิดพลาด ตรวจสอบชื่อชีทในไฟล์ Excel',
        },
      },
      {
        heading: { en: 'Column mapping dialog', vi: 'Dialog ánh xạ cột', th: 'กล่องโต้ตอบแมปคอลัมน์' },
        body: {
          en: 'If your Excel file has non-standard column headers (e.g., Thai column names instead of English), the mapping dialog appears automatically. For each required field, select the correct column from your file\'s headers.\n\nOnce you save the mapping, it is stored in your browser\'s local storage. Next time you upload a file with the same header layout, the mapping is applied automatically.',
          vi: 'Nếu file Excel của bạn có tiêu đề cột không chuẩn (ví dụ: tiêu đề tiếng Thái thay vì tiếng Anh), dialog ánh xạ tự động xuất hiện. Với mỗi trường bắt buộc, chọn cột đúng từ tiêu đề file của bạn.\n\nSau khi lưu ánh xạ, nó được lưu trong local storage của trình duyệt. Lần sau upload file có cùng định dạng header, ánh xạ sẽ tự động áp dụng.',
          th: 'หากไฟล์ Excel มีหัวคอลัมน์ที่ไม่ตรงมาตรฐาน (เช่น หัวคอลัมน์ภาษาไทยแทนภาษาอังกฤษ) กล่องโต้ตอบแมปจะปรากฏอัตโนมัติ สำหรับแต่ละฟิลด์ที่จำเป็น เลือกคอลัมน์ที่ถูกต้องจากหัวคอลัมน์ของไฟล์\n\nเมื่อบันทึกการแมป ระบบจะเก็บใน local storage ของเบราว์เซอร์ ครั้งต่อไปที่อัปโหลดไฟล์ที่มีเลย์เอาต์หัวคอลัมน์เดียวกัน การแมปจะถูกนำไปใช้อัตโนมัติ',
        },
        tip: {
          en: 'To reset saved mappings (e.g., after changing your Excel template), use the "Reset saved mappings" link inside the mapping dialog.',
          vi: 'Để xoá ánh xạ đã lưu (ví dụ sau khi thay đổi template Excel), dùng đường dẫn "Xoá ánh xạ đã lưu" trong dialog ánh xạ.',
          th: 'หากต้องการรีเซ็ตการแมปที่บันทึกไว้ (เช่น หลังเปลี่ยนเทมเพลต Excel) ใช้ลิงก์ "รีเซ็ตแมปที่บันทึกไว้" ภายในกล่องโต้ตอบแมป',
        },
      },
    ],
  },

  // ─── 5. REVIEW RESULTS ───────────────────────────────────────────────────────
  {
    id: 'review',
    title: { en: '5. Review Results', vi: '5. Xem kết quả', th: '5. ตรวจสอบผลลัพธ์' },
    intro: {
      en: 'After a successful import, the payroll dashboard shows a complete breakdown of wages, deductions, and OT for the period.',
      vi: 'Sau khi import thành công, dashboard hiển thị breakdown đầy đủ về lương, khấu trừ và OT cho kỳ đó.',
      th: 'หลังนำเข้าสำเร็จ แดชบอร์ดจะแสดงรายละเอียดครบถ้วนของค่าจ้าง การหัก และ OT สำหรับรอบนั้น',
    },
    items: [
      {
        heading: { en: 'KPI summary cards', vi: 'Thẻ KPI tóm tắt', th: 'การ์ด KPI สรุป' },
        body: {
          en: 'Six cards appear at the top of the dashboard:\n• Total gross wages — sum of all workers\' gross pay\n• Collaborators — number of unique workers in the period\n• Workdays — total distinct working days parsed\n• Shifts — total shift records processed\n• Total OT pay — sum of all overtime pay\n• Total deductions — sum of all late, early-out, damage, and other deductions',
          vi: 'Sáu thẻ xuất hiện ở đầu dashboard:\n• Tổng lương gross — tổng lương gross của mọi CTV\n• Cộng tác viên — số CTV duy nhất trong kỳ\n• Ngày làm — tổng số ngày làm việc riêng biệt đã parse\n• Ca công — tổng số bản ghi ca đã xử lý\n• Tổng OT — tổng tiền OT\n• Tổng khấu trừ — tổng trừ trễ, về sớm, damage, và khác',
          th: 'การ์ดหกใบปรากฏด้านบนของแดชบอร์ด:\n• ค่าแรงรวมทั้งหมด — ผลรวมค่าจ้าง gross ของพนักงานทุกคน\n• จำนวนคนงาน — จำนวนพนักงานที่ไม่ซ้ำกันในรอบ\n• วันทำงาน — จำนวนวันทำงานที่แตกต่างกันทั้งหมดที่อ่านได้\n• จำนวนกะ — จำนวนบันทึกกะที่ประมวลผล\n• OT รวม — ผลรวมค่า OT ทั้งหมด\n• ยอดหักรวม — ผลรวมการหักสาย ออกก่อน ของเสียหาย และอื่น ๆ',
        },
      },
      {
        heading: { en: 'Payroll badges (warnings)', vi: 'Badges cảnh báo', th: 'แบดจ์คำเตือน' },
        body: {
          en: 'Yellow warning badges appear below the KPI cards when action is needed:\n• "N new workers need info" — workers found in the timesheet but not yet in the database. Click to go to Workers management.\n• "N days with OT > 4h" — days where overtime exceeds 4 hours, which may indicate a data entry error.',
          vi: 'Các badge cảnh báo vàng xuất hiện bên dưới KPI khi cần hành động:\n• "N CTV mới chưa có thông tin" — CTV có trong timesheet nhưng chưa có trong database. Nhấn để vào Workers.\n• "N ngày OT > 4h" — ngày có OT vượt 4 tiếng, có thể là lỗi nhập liệu.',
          th: 'แบดจ์คำเตือนสีเหลืองปรากฏด้านล่าง KPI เมื่อต้องดำเนินการ:\n• "N พนักงานใหม่ยังไม่มีข้อมูล" — พนักงานที่อยู่ใน timesheet แต่ยังไม่อยู่ในฐานข้อมูล คลิกเพื่อไปที่ Workers\n• "N วันมี OT > 4 ชม." — วันที่มี OT เกิน 4 ชั่วโมง ซึ่งอาจบ่งชี้ว่ามีข้อผิดพลาดในการกรอกข้อมูล',
        },
      },
      {
        heading: { en: 'Worker summary table', vi: 'Bảng tóm tắt CTV', th: 'ตารางสรุปพนักงาน' },
        body: {
          en: 'The table lists every worker in the period sorted by gross wage (highest first). Columns: Name, Department, Shifts, Late/Early deductions, Damage, OT, and Total Gross.\n\nSearch bar: filter by name, phone, or bank account number.\nDepartment filter: show only workers from a specific department (BM, DW, etc.).\nClick any row to open the worker detail modal.',
          vi: 'Bảng liệt kê mọi CTV trong kỳ, sắp xếp theo lương gross (cao nhất trước). Cột: Tên, Phòng ban, Ca, Trừ trễ/sớm, Damage, OT, và Tổng gross.\n\nThanh tìm kiếm: lọc theo tên, SĐT, hoặc số tài khoản.\nLọc phòng ban: chỉ hiển thị CTV thuộc phòng ban cụ thể (BM, DW, ...).\nNhấn vào bất kỳ hàng nào để mở modal chi tiết CTV.',
          th: 'ตารางแสดงพนักงานทุกคนในรอบ เรียงตามค่าจ้าง gross (มากที่สุดก่อน) คอลัมน์: ชื่อ แผนก กะ การหักสาย/ออกก่อน ของเสียหาย OT และ gross รวม\n\nแถบค้นหา: กรองตามชื่อ โทรศัพท์ หรือหมายเลขบัญชี\nกรองแผนก: แสดงเฉพาะพนักงานจากแผนกเฉพาะ (BM, DW ฯลฯ)\nคลิกแถวใดก็ได้เพื่อเปิด modal รายละเอียดพนักงาน',
        },
      },
      {
        heading: { en: 'Worker detail modal', vi: 'Modal chi tiết CTV', th: 'Modal รายละเอียดพนักงาน' },
        body: {
          en: 'Click a worker row to see a day-by-day breakdown:\n• Each row = one shift with check-in, check-out, shift code\n• Late/early-out minutes and baht deduction per day\n• OT hours and baht per day\n• Damage and other deductions\n• Running total at the bottom\n\nClick "Show formula" to see the calculation variables (U, W, Z, AG, AH) for each shift.',
          vi: 'Nhấn vào hàng CTV để xem breakdown theo từng ngày:\n• Mỗi hàng = một ca với checkin, checkout, mã ca\n• Phút trễ/về sớm và số tiền khấu trừ theo ngày\n• Giờ OT và tiền OT theo ngày\n• Damage và khấu trừ khác\n• Tổng cộng ở cuối\n\nNhấn "Xem công thức" để thấy biến tính toán (U, W, Z, AG, AH) cho mỗi ca.',
          th: 'คลิกแถวพนักงานเพื่อดูรายละเอียดรายวัน:\n• แต่ละแถว = หนึ่งกะพร้อมเวลาเข้า ออก รหัสกะ\n• นาทีสาย/ออกก่อนและการหักเงินบาทต่อวัน\n• ชั่วโมง OT และเงินบาท OT ต่อวัน\n• ของเสียหายและการหักอื่น ๆ\n• ยอดรวมด้านล่าง\n\nคลิก "ดูสูตร" เพื่อดูตัวแปรการคำนวณ (U, W, Z, AG, AH) สำหรับแต่ละกะ',
        },
      },
      {
        heading: { en: 'Calculation settings override', vi: 'Ghi đè cài đặt tính lương', th: 'ปรับตั้งค่าการคำนวณ' },
        body: {
          en: 'Click "Calculation settings" to reveal four input fields:\n• Daily rate (฿) — base wage per shift (default 500)\n• OT multiplier — overtime rate factor (default 1.5)\n• Late buffer (min) — minutes of lateness tolerated before deduction starts (default 0)\n• Late rounding (min) — round late minutes to nearest N (e.g., 5 means 7 min late → deduct for 5 min)\n\nChanging any value recalculates the entire table instantly. These overrides apply only to the current session and are not saved.',
          vi: 'Nhấn "Cấu hình tính lương" để hiện bốn ô nhập:\n• Lương ngày (฿) — lương cơ bản mỗi ca (mặc định 500)\n• Hệ số OT — hệ số lương ngoài giờ (mặc định 1.5)\n• Buffer trễ (phút) — phút trễ được tha trước khi trừ (mặc định 0)\n• Làm tròn trễ (phút) — làm tròn phút trễ tới N gần nhất (vd: 5 nghĩa là trễ 7 phút → trừ 5 phút)\n\nThay đổi bất kỳ giá trị nào sẽ tính lại toàn bộ bảng ngay. Các thay đổi này chỉ áp dụng cho phiên hiện tại và không được lưu.',
          th: 'คลิก "ตั้งค่าการคำนวณ" เพื่อแสดงช่องป้อนสี่ช่อง:\n• ค่าแรงต่อวัน (฿) — ค่าจ้างพื้นฐานต่อกะ (ค่าเริ่มต้น 500)\n• ตัวคูณ OT — ตัวคูณอัตราค่าล่วงเวลา (ค่าเริ่มต้น 1.5)\n• ช่วงผ่อนผันสาย (น.) — นาทีที่ยอมรับการมาสายก่อนเริ่มหัก (ค่าเริ่มต้น 0)\n• ปัดเศษสาย (น.) — ปัดเศษนาทีสายเป็น N ที่ใกล้ที่สุด (เช่น 5 หมายถึงสาย 7 น. → หัก 5 น.)\n\nการเปลี่ยนค่าใดก็ตามจะคำนวณตารางทั้งหมดใหม่ทันที การปรับนี้ใช้ได้เฉพาะเซสชันปัจจุบันและไม่ถูกบันทึก',
        },
      },
    ],
  },

  // ─── 6. WORKERS ──────────────────────────────────────────────────────────────
  {
    id: 'workers',
    title: { en: '6. Workers Management', vi: '6. Quản lý nhân viên', th: '6. การจัดการพนักงาน' },
    intro: {
      en: 'The Workers section manages the master list of contractors. Keeping worker records up to date ensures correct department classification and enables bank export.',
      vi: 'Mục Workers quản lý danh sách chính của CTV. Giữ hồ sơ CTV cập nhật đảm bảo phân loại phòng ban đúng và cho phép xuất bank.',
      th: 'ส่วน Workers จัดการรายชื่อหลักของพนักงาน การอัปเดตข้อมูลพนักงานให้ทันสมัยช่วยให้การจัดประเภทแผนกถูกต้องและเปิดใช้งานการส่งออกธนาคาร',
    },
    items: [
      {
        heading: { en: 'Worker list', vi: 'Danh sách CTV', th: 'รายชื่อพนักงาน' },
        body: {
          en: 'Click "Workers" in the navigation or WorkflowStepper to open the Workers page. The table shows all workers with their code, name, department, bank details, and status.\n\nFilter by status: All / Active / Pending update / Resigned / Inactive.\nSearch by name or code.\nClick the edit (pencil) icon to update a worker\'s details.',
          vi: 'Nhấn "Workers" trong điều hướng hoặc WorkflowStepper để mở trang Workers. Bảng hiển thị tất cả CTV với mã, tên, phòng ban, thông tin ngân hàng và trạng thái.\n\nLọc theo trạng thái: Tất cả / Đang làm / Chờ cập nhật / Đã nghỉ / Không hoạt động.\nTìm kiếm theo tên hoặc mã.\nNhấn biểu tượng sửa (bút chì) để cập nhật thông tin CTV.',
          th: 'คลิก "Workers" ในการนำทางหรือ WorkflowStepper เพื่อเปิดหน้า Workers ตารางแสดงพนักงานทั้งหมดพร้อมรหัส ชื่อ แผนก รายละเอียดธนาคาร และสถานะ\n\nกรองตามสถานะ: ทั้งหมด / ใช้งาน / รอการอัปเดต / ลาออก / ไม่ใช้งาน\nค้นหาตามชื่อหรือรหัส\nคลิกไอคอนแก้ไข (ดินสอ) เพื่ออัปเดตข้อมูลพนักงาน',
        },
      },
      {
        heading: { en: 'Add or edit a worker', vi: 'Thêm hoặc sửa CTV', th: 'เพิ่มหรือแก้ไขพนักงาน' },
        body: {
          en: 'Click "Add Worker" (top right) or the edit icon on any row to open the worker form. Required fields:\n• Employee code — unique identifier (e.g., TH-001)\n• Full name (Thai) — must match exactly as it appears in the Excel timesheet\n• Warehouse — the warehouse this worker belongs to\n• Department — BM, DW, INTERN, HOUSEKEEPER, or OTHER\n\nOptional: English name, job type, phone number, start date.',
          vi: 'Nhấn "Thêm nhân viên" (góc trên phải) hoặc biểu tượng sửa trên bất kỳ hàng nào để mở form CTV. Trường bắt buộc:\n• Mã nhân viên — định danh duy nhất (ví dụ: TH-001)\n• Họ tên (Thái) — phải khớp chính xác với tên trong file Excel\n• Kho — kho mà CTV thuộc về\n• Phòng ban — BM, DW, INTERN, HOUSEKEEPER, hoặc OTHER\n\nTuỳ chọn: Tên tiếng Anh, loại hợp đồng, SĐT, ngày bắt đầu.',
          th: 'คลิก "เพิ่มพนักงาน" (ขวาบน) หรือไอคอนแก้ไขบนแถวใดก็ได้เพื่อเปิดฟอร์มพนักงาน ฟิลด์ที่จำเป็น:\n• รหัสพนักงาน — ตัวระบุที่ไม่ซ้ำกัน (เช่น TH-001)\n• ชื่อเต็ม (ภาษาไทย) — ต้องตรงกับชื่อใน Excel timesheet ทุกตัวอักษร\n• คลังสินค้า — คลังที่พนักงานสังกัด\n• แผนก — BM, DW, INTERN, HOUSEKEEPER หรือ OTHER\n\nไม่บังคับ: ชื่อภาษาอังกฤษ ประเภทงาน โทรศัพท์ วันที่เริ่มงาน',
        },
        warn: {
          en: 'The worker\'s full name must match exactly (including spaces and Thai characters) to the name in the Excel timesheet — otherwise the system cannot match the attendance record to the worker database entry.',
          vi: 'Họ tên CTV phải khớp chính xác (bao gồm dấu cách và ký tự Thái) với tên trong file Excel — nếu không hệ thống không thể ghép bản ghi chấm công với hồ sơ CTV.',
          th: 'ชื่อเต็มของพนักงานต้องตรงกันทุกตัวอักษร (รวมช่องว่างและตัวอักษรไทย) กับชื่อใน Excel timesheet มิฉะนั้นระบบจะไม่สามารถจับคู่บันทึกการเข้างานกับข้อมูลพนักงานได้',
        },
      },
      {
        heading: { en: 'Bank account information', vi: 'Thông tin tài khoản ngân hàng', th: 'ข้อมูลบัญชีธนาคาร' },
        body: {
          en: 'Bank details are required for Bank.csv export. Edit a worker and go to the "Bank info" section:\n• Bank code — 3-letter code (e.g., SCB, KBANK, BBL)\n• Account number — numeric, no dashes\n\nIf the Members sheet is present in your Excel file, bank details are auto-imported when the file is uploaded.',
          vi: 'Thông tin ngân hàng cần thiết để xuất Bank.csv. Sửa CTV và vào mục "Thông tin ngân hàng":\n• Mã ngân hàng — mã 3 chữ cái (ví dụ: SCB, KBANK, BBL)\n• Số tài khoản — số, không có dấu gạch ngang\n\nNếu sheet Members có trong file Excel, thông tin ngân hàng sẽ tự nhập khi upload file.',
          th: 'รายละเอียดธนาคารจำเป็นสำหรับการส่งออก Bank.csv แก้ไขพนักงานและไปที่ส่วน "ข้อมูลธนาคาร":\n• รหัสธนาคาร — รหัส 3 ตัวอักษร (เช่น SCB, KBANK, BBL)\n• หมายเลขบัญชี — ตัวเลขเท่านั้น ไม่มีขีดกลาง\n\nหากชีท Members อยู่ในไฟล์ Excel ข้อมูลธนาคารจะถูกนำเข้าอัตโนมัติเมื่ออัปโหลดไฟล์',
        },
      },
      {
        heading: { en: 'Bulk import workers from CSV', vi: 'Import hàng loạt CTV từ CSV', th: 'นำเข้าพนักงานจำนวนมากจาก CSV' },
        body: {
          en: 'To add many workers at once, click "Bulk import" in the Workers page. Download the CSV template, fill it in with worker data, then upload it. Required CSV columns: code, name_local, warehouse_id, department.\n\nThe import is additive — it only creates new workers and does not overwrite existing records.',
          vi: 'Để thêm nhiều CTV cùng lúc, nhấn "Bulk import" trong trang Workers. Tải CSV template, điền dữ liệu CTV, rồi upload. Cột CSV bắt buộc: code, name_local, warehouse_id, department.\n\nImport chỉ tạo mới — không ghi đè bản ghi đã có.',
          th: 'หากต้องการเพิ่มพนักงานหลายคนพร้อมกัน คลิก "Bulk import" ในหน้า Workers ดาวน์โหลดเทมเพลต CSV กรอกข้อมูลพนักงาน แล้วอัปโหลด คอลัมน์ CSV ที่จำเป็น: code, name_local, warehouse_id, department\n\nการนำเข้าเป็นแบบเพิ่มเติม — สร้างพนักงานใหม่เท่านั้น ไม่เขียนทับบันทึกที่มีอยู่',
        },
      },
    ],
  },

  // ─── 7. PAYMENTS ─────────────────────────────────────────────────────────────
  {
    id: 'payments',
    title: { en: '7. Payments', vi: '7. Thanh toán', th: '7. การชำระเงิน' },
    intro: {
      en: 'The Payments section manages payroll periods and tracks which workers have been paid.',
      vi: 'Mục Thanh toán quản lý các kỳ lương và theo dõi CTV nào đã được thanh toán.',
      th: 'ส่วนการชำระเงินจัดการรอบเงินเดือนและติดตามว่าพนักงานคนใดได้รับการชำระเงินแล้ว',
    },
    items: [
      {
        heading: { en: 'Create a payment period', vi: 'Tạo kỳ thanh toán', th: 'สร้างรอบการชำระเงิน' },
        body: {
          en: 'Click "New Period" and enter the start date, end date, and warehouse. The system creates a period with status "Open". While open, you can add attendance records and update worker info.\n\nLock the period when you are ready to finalize payroll — this prevents further edits. A Country Admin can then approve the locked period to mark it as fully processed.',
          vi: 'Nhấn "Kỳ mới" và nhập ngày bắt đầu, ngày kết thúc, và kho. Hệ thống tạo kỳ với trạng thái "Mở". Khi mở, bạn có thể thêm bản ghi chấm công và cập nhật thông tin CTV.\n\nKhoá kỳ khi sẵn sàng chốt lương — điều này ngăn chỉnh sửa thêm. Country Admin có thể duyệt kỳ đã khoá để đánh dấu là đã xử lý đầy đủ.',
          th: 'คลิก "รอบใหม่" และใส่วันที่เริ่ม วันที่สิ้นสุด และคลัง ระบบสร้างรอบที่มีสถานะ "เปิด" ขณะเปิดอยู่ คุณสามารถเพิ่มบันทึกการเข้างานและอัปเดตข้อมูลพนักงานได้\n\nล็อกรอบเมื่อพร้อมสรุปเงินเดือน — ป้องกันการแก้ไขเพิ่มเติม Country Admin สามารถอนุมัติรอบที่ล็อกแล้วเพื่อทำเครื่องหมายว่าประมวลผลครบถ้วน',
        },
      },
      {
        heading: { en: 'Payment lines', vi: 'Dòng thanh toán', th: 'บรรทัดการชำระเงิน' },
        body: {
          en: 'Inside a period, each worker has one payment line showing their total gross wage. Status options:\n• Unpaid — default, not yet transferred\n• Processing — bank transfer initiated\n• Paid — transfer confirmed\n\nClick a line to edit the amount or add a note. The amount can be adjusted (e.g., for manual corrections) without affecting the underlying attendance records.',
          vi: 'Trong một kỳ, mỗi CTV có một dòng thanh toán hiển thị tổng lương gross. Tuỳ chọn trạng thái:\n• Chưa thanh toán — mặc định, chưa chuyển khoản\n• Đang xử lý — đã khởi tạo chuyển khoản\n• Đã thanh toán — đã xác nhận chuyển khoản\n\nNhấn vào dòng để sửa số tiền hoặc thêm ghi chú. Số tiền có thể điều chỉnh (ví dụ: sửa thủ công) mà không ảnh hưởng đến bản ghi chấm công.',
          th: 'ภายในรอบ พนักงานแต่ละคนมีหนึ่งบรรทัดการชำระเงินที่แสดงค่าจ้าง gross รวม ตัวเลือกสถานะ:\n• ยังไม่ชำระ — ค่าเริ่มต้น ยังไม่โอน\n• กำลังดำเนินการ — เริ่มโอนธนาคารแล้ว\n• ชำระแล้ว — ยืนยันการโอนแล้ว\n\nคลิกบรรทัดเพื่อแก้ไขจำนวนเงินหรือเพิ่มหมายเหตุ สามารถปรับจำนวนเงินได้ (เช่น สำหรับการแก้ไขด้วยตนเอง) โดยไม่กระทบบันทึกการเข้างาน',
        },
      },
      {
        heading: { en: 'Bulk mark as paid', vi: 'Đánh dấu nhiều người đã thanh toán', th: 'ทำเครื่องหมายชำระแล้วจำนวนมาก' },
        body: {
          en: 'Select multiple workers using the checkboxes on the left of each row, then click "Mark as Paid" at the top of the table. This is useful after completing a bank batch transfer.\n\nYou can also filter by department first to mark only BM workers, then only DW workers, etc.',
          vi: 'Chọn nhiều CTV bằng checkbox bên trái mỗi hàng, rồi nhấn "Đánh dấu đã thanh toán" ở đầu bảng. Hữu ích sau khi hoàn tất chuyển khoản ngân hàng hàng loạt.\n\nBạn cũng có thể lọc theo phòng ban trước để đánh dấu chỉ CTV BM, rồi CTV DW, v.v.',
          th: 'เลือกพนักงานหลายคนโดยใช้ช่องทำเครื่องหมายทางซ้ายของแต่ละแถว แล้วคลิก "ทำเครื่องหมายชำระแล้ว" ที่ด้านบนของตาราง มีประโยชน์หลังโอนเงินธนาคารเป็นชุดเสร็จสิ้น\n\nคุณยังสามารถกรองตามแผนกก่อน เพื่อทำเครื่องหมายเฉพาะพนักงาน BM แล้วค่อยทำ DW ฯลฯ',
        },
      },
    ],
  },

  // ─── 8. REPORTS ──────────────────────────────────────────────────────────────
  {
    id: 'reports',
    title: { en: '8. Reports & Exports', vi: '8. Báo cáo & Xuất file', th: '8. รายงาน & ส่งออก' },
    intro: {
      en: 'Generate summary reports for month-end review and export files for accounting, HR records, and bank transfers.',
      vi: 'Tạo báo cáo tổng hợp để xem xét cuối tháng và xuất file cho kế toán, hồ sơ nhân sự, và chuyển khoản ngân hàng.',
      th: 'สร้างรายงานสรุปสำหรับการตรวจสอบสิ้นเดือนและส่งออกไฟล์สำหรับการบัญชี บันทึก HR และการโอนเงินธนาคาร',
    },
    items: [
      {
        heading: { en: 'Monthly report', vi: 'Báo cáo tháng', th: 'รายงานรายเดือน' },
        body: {
          en: 'Go to "Report" in the navigation. Select the month and warehouse. The report shows:\n• Total gross wages, OT, and deductions for the month\n• Breakdown by department (BM, DW, INTERN, etc.)\n• Worker count and total shifts\n• Comparison with previous month (if data exists)\n\nThe report can be exported as CSV.',
          vi: 'Vào "Report" trong điều hướng. Chọn tháng và kho. Báo cáo hiển thị:\n• Tổng lương gross, OT, và khấu trừ trong tháng\n• Breakdown theo phòng ban (BM, DW, INTERN, ...)\n• Số CTV và tổng ca\n• So sánh với tháng trước (nếu có dữ liệu)\n\nBáo cáo có thể xuất dưới dạng CSV.',
          th: 'ไปที่ "Report" ในการนำทาง เลือกเดือนและคลัง รายงานแสดง:\n• ค่าจ้าง gross รวม OT และการหักสำหรับเดือน\n• แยกตามแผนก (BM, DW, INTERN ฯลฯ)\n• จำนวนพนักงานและกะรวม\n• เปรียบเทียบกับเดือนก่อน (ถ้ามีข้อมูล)\n\nรายงานสามารถส่งออกเป็น CSV',
        },
      },
      {
        heading: { en: 'Export: Daily.xlsx', vi: 'Xuất: Daily.xlsx', th: 'ส่งออก: Daily.xlsx' },
        body: {
          en: 'Click "Daily.xlsx" in the toolbar after uploading a timesheet. This file contains every individual shift record with full calculation details:\n• Worker name, department, date\n• Check-in / check-out / shift\n• Late minutes and deduction (฿)\n• Early-out minutes and deduction (฿)\n• OT hours and pay (฿)\n• Damage / other deductions\n• Gross wage (฿)\n\nUseful for detailed auditing and cross-checking with the original Excel.',
          vi: 'Nhấn "Daily.xlsx" trong toolbar sau khi upload timesheet. File này chứa mọi bản ghi ca riêng lẻ với chi tiết tính toán đầy đủ:\n• Tên CTV, phòng ban, ngày\n• Checkin / checkout / ca\n• Phút trễ và khấu trừ (฿)\n• Phút về sớm và khấu trừ (฿)\n• Giờ OT và tiền OT (฿)\n• Damage / khấu trừ khác\n• Lương gross (฿)\n\nHữu ích để kiểm tra chi tiết và đối chiếu với Excel gốc.',
          th: 'คลิก "Daily.xlsx" ในแถบเครื่องมือหลังอัปโหลด timesheet ไฟล์นี้มีบันทึกกะทุกรายการพร้อมรายละเอียดการคำนวณครบถ้วน:\n• ชื่อพนักงาน แผนก วันที่\n• เวลาเข้า / เวลาออก / กะ\n• นาทีสายและการหัก (฿)\n• นาทีออกก่อนและการหัก (฿)\n• ชั่วโมง OT และค่า OT (฿)\n• ของเสียหาย / การหักอื่น ๆ\n• ค่าจ้าง gross (฿)\n\nมีประโยชน์สำหรับการตรวจสอบโดยละเอียดและการเปรียบเทียบกับ Excel ต้นฉบับ',
        },
      },
      {
        heading: { en: 'Export: Workers.xlsx', vi: 'Xuất: Workers.xlsx', th: 'ส่งออก: Workers.xlsx' },
        body: {
          en: 'Click "Workers.xlsx" in the toolbar. This file contains one row per worker with aggregated totals for the period:\n• Worker code, name, department\n• Total shifts, total workdays\n• Total late/early-out deductions\n• Total OT pay\n• Total damage\n• Net gross wage\n• Bank code and account number\n\nThis file is suitable for HR records and payroll archival.',
          vi: 'Nhấn "Workers.xlsx" trong toolbar. File này có một hàng cho mỗi CTV với tổng hợp cho kỳ:\n• Mã, tên, phòng ban CTV\n• Tổng ca, tổng ngày làm\n• Tổng khấu trừ trễ/về sớm\n• Tổng tiền OT\n• Tổng damage\n• Tổng lương gross\n• Mã ngân hàng và số tài khoản\n\nFile này phù hợp cho hồ sơ HR và lưu trữ lương.',
          th: 'คลิก "Workers.xlsx" ในแถบเครื่องมือ ไฟล์นี้มีหนึ่งแถวต่อพนักงานพร้อมยอดรวมสำหรับรอบ:\n• รหัส ชื่อ แผนกพนักงาน\n• กะรวม วันทำงานรวม\n• การหักสาย/ออกก่อนรวม\n• ค่า OT รวม\n• ของเสียหายรวม\n• ค่าจ้าง gross รวม\n• รหัสธนาคารและหมายเลขบัญชี\n\nไฟล์นี้เหมาะสำหรับบันทึก HR และการเก็บถาวรเงินเดือน',
        },
      },
      {
        heading: { en: 'Export: Bank.csv', vi: 'Xuất: Bank.csv', th: 'ส่งออก: Bank.csv' },
        body: {
          en: 'Click "Bank.csv" in the toolbar. This CSV file is formatted for bank batch upload:\n• One row per worker\n• Columns: account number, bank code, amount, name\n\nNote: the generic CSV format may need to be adjusted to match your specific bank\'s bulk-transfer template. Future versions will include bank-specific format adapters.',
          vi: 'Nhấn "Bank.csv" trong toolbar. File CSV này được định dạng để upload ngân hàng hàng loạt:\n• Một hàng mỗi CTV\n• Cột: số tài khoản, mã ngân hàng, số tiền, tên\n\nLưu ý: định dạng CSV chung có thể cần điều chỉnh cho khớp với template chuyển khoản hàng loạt của ngân hàng cụ thể. Phiên bản sau sẽ có bộ chuyển đổi định dạng riêng theo ngân hàng.',
          th: 'คลิก "Bank.csv" ในแถบเครื่องมือ ไฟล์ CSV นี้ถูกจัดรูปแบบสำหรับการอัปโหลดธนาคารเป็นชุด:\n• หนึ่งแถวต่อพนักงาน\n• คอลัมน์: หมายเลขบัญชี รหัสธนาคาร จำนวน ชื่อ\n\nหมายเหตุ: รูปแบบ CSV ทั่วไปอาจต้องปรับให้ตรงกับเทมเพลตโอนเงินเป็นชุดของธนาคารเฉพาะของคุณ เวอร์ชันอนาคตจะมีตัวแปลงรูปแบบเฉพาะธนาคาร',
        },
      },
    ],
  },

  // ─── 9. FORMULA ──────────────────────────────────────────────────────────────
  {
    id: 'formula',
    title: { en: '9. Wage Calculation Formula', vi: '9. Công thức tính lương', th: '9. สูตรคำนวณค่าจ้าง' },
    intro: {
      en: 'Every calculation is an exact replica of the original Boxme Thailand Excel formula. All values can be reproduced row-by-row in Excel for auditing.',
      vi: 'Mọi tính toán là bản sao chính xác của công thức Excel Boxme Thailand gốc. Tất cả giá trị có thể đối chiếu từng hàng trong Excel để kiểm toán.',
      th: 'การคำนวณทุกอย่างเป็นสำเนาที่แน่นอนของสูตร Excel Boxme Thailand ต้นฉบับ ค่าทั้งหมดสามารถตรวจสอบทีละแถวใน Excel เพื่อการตรวจสอบ',
    },
    items: [
      {
        heading: { en: 'Step 1 — Hours bucket (U)', vi: 'Bước 1 — Hệ số giờ (U)', th: 'ขั้นที่ 1 — ตัวหารชั่วโมง (U)' },
        body: {
          en: 'U = 5 if the shift duration ≤ 6 hours (e.g., half-day shift), otherwise U = 8.\n\nPurpose: U normalises the "wage per minute" calculation so that half-day and full-day workers are treated proportionally.',
          vi: 'U = 5 nếu ca ≤ 6 tiếng (ví dụ: ca nửa ngày), ngược lại U = 8.\n\nMục đích: U chuẩn hoá tính "lương/phút" để CTV ca ngắn và ca dài được tính tỷ lệ.',
          th: 'U = 5 ถ้ากะ ≤ 6 ชั่วโมง (เช่น กะครึ่งวัน) มิฉะนั้น U = 8\n\nวัตถุประสงค์: U ทำให้การคำนวณ "ค่าแรงต่อนาที" เป็นมาตรฐาน เพื่อให้พนักงานกะสั้นและกะเต็มวันได้รับการปฏิบัติตามสัดส่วน',
        },
        code: 'U = IF(shift_hours <= 6, 5, 8)',
      },
      {
        heading: { en: 'Step 2 — Wage per minute', vi: 'Bước 2 — Lương/phút', th: 'ขั้นที่ 2 — ค่าแรงต่อนาที' },
        body: {
          en: 'wage_per_minute = daily_rate ÷ (U × 60)\n\nExample: base rate 500 ฿, U = 8 → 500 ÷ 480 = 1.0417 ฿/minute\n\nThis value is used as the unit for both late deduction and early-out deduction.',
          vi: 'wage_per_minute = lương_ngày ÷ (U × 60)\n\nVí dụ: base 500 ฿, U = 8 → 500 ÷ 480 = 1.0417 ฿/phút\n\nGiá trị này được dùng làm đơn vị cho cả khấu trừ trễ và về sớm.',
          th: 'ค่าแรง/นาที = ค่าแรงต่อวัน ÷ (U × 60)\n\nตัวอย่าง: ค่าแรงพื้นฐาน 500 ฿, U = 8 → 500 ÷ 480 = 1.0417 ฿/นาที\n\nค่านี้ใช้เป็นหน่วยสำหรับทั้งการหักสายและการหักออกก่อน',
        },
        code: 'wage_per_min = daily_rate / (U * 60)',
      },
      {
        heading: { en: 'Step 3 — Late deduction (W)', vi: 'Bước 3 — Khấu trừ trễ (W)', th: 'ขั้นที่ 3 — หักสาย (W)' },
        body: {
          en: 'W = max(0, checkin − shift_start) × wage_per_minute\n\n⚠️ Late deduction applies ONLY to BM and DW workers. Interns (นักศึกษา) and housekeepers (แม่บ้าน) are exempt — they always receive full base pay regardless of check-in time.\n\nA "late buffer" can be configured to tolerate a few minutes of lateness before deduction starts.',
          vi: 'W = max(0, checkin − giờ_bắt_đầu_ca) × lương/phút\n\n⚠️ Khấu trừ trễ CHỈ áp dụng cho BM và DW. Intern (นักศึกษา) và housekeeper (แม่บ้าน) được miễn — luôn nhận đủ lương cơ bản bất kể giờ checkin.\n\nCó thể cấu hình "buffer trễ" để tha vài phút trễ trước khi bắt đầu trừ.',
          th: 'W = max(0, เวลาเข้า − เวลาเริ่มกะ) × ค่าแรง/นาที\n\n⚠️ การหักสายใช้กับ BM และ DW เท่านั้น นักศึกษาและแม่บ้านได้รับการยกเว้น — ได้รับค่าแรงพื้นฐานเต็มเสมอไม่ว่าจะเข้างานกี่โมง\n\nสามารถกำหนด "ช่วงผ่อนผัน" เพื่อยอมรับการมาสายเล็กน้อยก่อนเริ่มหัก',
        },
        code: 'W = max(0, checkin_min - shift_start_min - buffer) * wage_per_min',
      },
      {
        heading: { en: 'Step 4 — Early-out deduction (Z)', vi: 'Bước 4 — Khấu trừ về sớm (Z)', th: 'ขั้นที่ 4 — หักออกก่อน (Z)' },
        body: {
          en: 'Z = max(0, shift_end − checkout) × wage_per_minute\n\nEarly-out deduction applies to ALL departments (BM, DW, INTERN, HOUSEKEEPER). If a worker leaves before the shift end time, they are deducted proportionally.',
          vi: 'Z = max(0, giờ_kết_thúc_ca − checkout) × lương/phút\n\nKhấu trừ về sớm áp dụng cho MỌI phòng ban (BM, DW, INTERN, HOUSEKEEPER). Nếu CTV về trước giờ kết thúc ca, sẽ bị trừ theo tỷ lệ.',
          th: 'Z = max(0, เวลาเลิกกะ − เวลาออก) × ค่าแรง/นาที\n\nการหักออกก่อนใช้กับทุกแผนก (BM, DW, INTERN, HOUSEKEEPER) หากพนักงานออกก่อนเวลาสิ้นสุดกะ จะถูกหักตามสัดส่วน',
        },
        code: 'Z = max(0, shift_end_min - checkout_min) * wage_per_min',
      },
      {
        heading: { en: 'Step 5 — Overtime pay (AG)', vi: 'Bước 5 — Tiền OT (AG)', th: 'ขั้นที่ 5 — ค่า OT (AG)' },
        body: {
          en: 'AG = (daily_rate ÷ U) × OT_multiplier × total_OT_hours\n\nExample: 2 hours OT, base 500 ฿, U = 8, multiplier 1.5:\nAG = (500 ÷ 8) × 1.5 × 2 = 187.5 ฿\n\nOT hours from the spreadsheet can be split into "OT before shift" and "OT after shift" — both are summed.',
          vi: 'AG = (lương_ngày ÷ U) × hệ_số_OT × tổng_giờ_OT\n\nVí dụ: OT 2 giờ, base 500 ฿, U = 8, hệ số 1.5:\nAG = (500 ÷ 8) × 1.5 × 2 = 187.5 ฿\n\nGiờ OT trong bảng tính có thể chia thành "OT trước ca" và "OT sau ca" — cả hai được cộng lại.',
          th: 'AG = (ค่าแรงต่อวัน ÷ U) × ตัวคูณ OT × ชั่วโมง OT รวม\n\nตัวอย่าง: OT 2 ชั่วโมง ค่าแรงพื้นฐาน 500 ฿, U = 8, ตัวคูณ 1.5:\nAG = (500 ÷ 8) × 1.5 × 2 = 187.5 ฿\n\nชั่วโมง OT ในสเปรดชีตสามารถแบ่งเป็น "OT ก่อนกะ" และ "OT หลังกะ" — รวมทั้งสอง',
        },
        code: 'AG = (daily_rate / U) * ot_multiplier * (ot_before + ot_after)',
      },
      {
        heading: { en: 'Step 6 — Damage & other deductions', vi: 'Bước 6 — Damage & khấu trừ khác', th: 'ขั้นที่ 6 — ของเสียหายและการหักอื่น ๆ' },
        body: {
          en: 'Damage and other deductions are entered directly in the timesheet (numeric baht values). They are subtracted directly from gross wage.\n\nIf the sum of deductions exceeds the daily rate, the gross for that day is floored at 0 — workers never receive negative pay.',
          vi: 'Damage và khấu trừ khác được nhập trực tiếp trong timesheet (số tiền baht). Chúng được trừ trực tiếp khỏi lương gross.\n\nNếu tổng khấu trừ vượt lương ngày, gross của ngày đó được làm tròn về 0 — CTV không bao giờ nhận lương âm.',
          th: 'ของเสียหายและการหักอื่น ๆ ถูกกรอกโดยตรงใน timesheet (จำนวนเงินบาท) โดยหักจากค่าจ้าง gross โดยตรง\n\nหากผลรวมการหักเกินค่าแรงรายวัน ค่า gross สำหรับวันนั้นจะถูกจำกัดที่ 0 — พนักงานไม่เคยได้รับค่าจ้างติดลบ',
        },
      },
      {
        heading: { en: 'Step 7 — Gross wage (AH)', vi: 'Bước 7 — Lương gross (AH)', th: 'ขั้นที่ 7 — ค่าจ้าง gross (AH)' },
        body: {
          en: 'AH = daily_rate − W − Z − damage − other + AG\ngross = max(0, AH)\n\nThe period total for each worker is the sum of all their daily gross values across every day in the timesheet.',
          vi: 'AH = lương_ngày − W − Z − damage − other + AG\ngross = max(0, AH)\n\nTổng kỳ cho mỗi CTV là tổng tất cả giá trị gross ngày của họ trong mọi ngày trong timesheet.',
          th: 'AH = ค่าแรงต่อวัน − W − Z − ของเสียหาย − อื่น ๆ + AG\ngross = max(0, AH)\n\nยอดรวมรอบสำหรับพนักงานแต่ละคนคือผลรวมค่า gross รายวันทั้งหมดในทุกวันใน timesheet',
        },
        code: `U  = IF(shift_hours <= 6, 5, 8)
W  = (rate / U / 60) × late_min   [BM/DW only]
Z  = (rate / U / 60) × early_min
AG = (rate / U) × 1.5 × OT_hours
AH = (rate − W − Z − damage − other) + AG
gross = MAX(0, AH)`,
      },
    ],
  },

  // ─── 10. SETTINGS ────────────────────────────────────────────────────────────
  {
    id: 'settings',
    title: { en: '10. Settings (Admin)', vi: '10. Cài đặt (Admin)', th: '10. การตั้งค่า (Admin)' },
    intro: {
      en: 'Settings are accessible to Country Admin and Super Admin roles only. Click the gear icon (⚙️) → Settings.',
      vi: 'Cài đặt chỉ dành cho vai trò Country Admin và Super Admin. Nhấn biểu tượng bánh răng (⚙️) → Settings.',
      th: 'การตั้งค่าเข้าถึงได้โดย Country Admin และ Super Admin เท่านั้น คลิกไอคอนฟันเฟือง (⚙️) → Settings',
    },
    items: [
      {
        heading: { en: 'Rate configs', vi: 'Cấu hình mức lương', th: 'ค่าคอนฟิกอัตราค่าจ้าง' },
        body: {
          en: 'Define custom daily rates and OT multipliers by job type or department. This overrides the default rate for specific worker categories.\n\nExample: Set INTERN daily rate to 350 ฿ instead of the warehouse default 500 ฿.\n\nClick "+ Add rate config", select the job type, enter the daily rate and OT multiplier, then save.',
          vi: 'Định nghĩa mức lương ngày và hệ số OT tuỳ chỉnh theo loại công việc hoặc phòng ban. Điều này ghi đè mức mặc định cho loại CTV cụ thể.\n\nVí dụ: Đặt lương ngày INTERN là 350 ฿ thay vì 500 ฿ mặc định của kho.\n\nNhấn "+ Thêm cấu hình", chọn loại công việc, nhập lương ngày và hệ số OT, rồi lưu.',
          th: 'กำหนดอัตราค่าแรงรายวันและตัวคูณ OT แบบกำหนดเองตามประเภทงานหรือแผนก ซึ่งจะแทนที่อัตราเริ่มต้นสำหรับประเภทพนักงานเฉพาะ\n\nตัวอย่าง: กำหนดอัตราค่าแรงรายวัน INTERN เป็น 350 ฿ แทน 500 ฿ ค่าเริ่มต้นของคลัง\n\nคลิก "+ เพิ่มคอนฟิก" เลือกประเภทงาน ใส่ค่าแรงรายวันและตัวคูณ OT แล้วบันทึก',
        },
      },
      {
        heading: { en: 'Shift definitions', vi: 'Định nghĩa ca', th: 'นิยามกะ' },
        body: {
          en: 'Shifts define the official start and end times for each shift code used in the timesheet. The system uses these to calculate lateness and early-out accurately.\n\nEach shift has: Code (e.g., "D1"), Start time (HH:MM), End time (HH:MM), and Warehouse.\n\nIf no shift is matched for a row, the system falls back to a default 8-hour shift.',
          vi: 'Ca xác định giờ bắt đầu và kết thúc chính thức cho mỗi mã ca dùng trong timesheet. Hệ thống dùng các giờ này để tính trễ và về sớm chính xác.\n\nMỗi ca có: Mã (ví dụ: "D1"), Giờ bắt đầu (HH:MM), Giờ kết thúc (HH:MM), và Kho.\n\nNếu không khớp ca nào cho một hàng, hệ thống dùng ca 8 giờ mặc định.',
          th: 'กะกำหนดเวลาเริ่มต้นและสิ้นสุดอย่างเป็นทางการสำหรับรหัสกะแต่ละรหัสที่ใช้ใน timesheet ระบบใช้เวลาเหล่านี้เพื่อคำนวณการมาสายและออกก่อนอย่างแม่นยำ\n\nแต่ละกะมี: รหัส (เช่น "D1") เวลาเริ่ม (HH:MM) เวลาสิ้นสุด (HH:MM) และคลัง\n\nหากไม่ตรงกับกะใดสำหรับแถว ระบบจะใช้กะ 8 ชั่วโมงเริ่มต้น',
        },
      },
      {
        heading: { en: 'Warehouse management', vi: 'Quản lý kho', th: 'การจัดการคลังสินค้า' },
        body: {
          en: 'Each warehouse has its own configuration: name, country code, currency, default daily rate, OT multiplier, and late buffer minutes.\n\nWorkers are assigned to a warehouse, and payroll periods are scoped to a warehouse. The warehouse selector in the header lets you switch context between warehouses you have access to.',
          vi: 'Mỗi kho có cấu hình riêng: tên, mã quốc gia, tiền tệ, lương ngày mặc định, hệ số OT, và phút buffer trễ.\n\nCTV được gán vào kho, và kỳ lương được giới hạn theo kho. Bộ chọn kho trong header cho phép chuyển ngữ cảnh giữa các kho bạn có quyền truy cập.',
          th: 'คลังแต่ละแห่งมีค่าคอนฟิกของตัวเอง: ชื่อ รหัสประเทศ สกุลเงิน ค่าแรงรายวันเริ่มต้น ตัวคูณ OT และนาทีช่วงผ่อนผันสาย\n\nพนักงานถูกมอบหมายให้คลัง และรอบเงินเดือนถูกจำกัดขอบเขตตามคลัง ตัวเลือกคลังในส่วนหัวช่วยให้สลับบริบทระหว่างคลังที่คุณมีสิทธิ์เข้าถึง',
        },
      },
      {
        heading: { en: 'Legal limits', vi: 'Giới hạn pháp lý', th: 'ข้อจำกัดทางกฎหมาย' },
        body: {
          en: 'Set country-specific legal working limits:\n• Minimum wage per day\n• Maximum daily working hours\n• Maximum weekly overtime hours\n\nThese values are used by the system for validation warnings — if a worker\'s computed wage falls below minimum wage, a warning is flagged.',
          vi: 'Đặt giới hạn làm việc pháp lý theo quốc gia:\n• Lương tối thiểu mỗi ngày\n• Số giờ làm việc tối đa mỗi ngày\n• Số giờ OT tối đa mỗi tuần\n\nCác giá trị này được hệ thống dùng để cảnh báo xác nhận — nếu lương tính của CTV thấp hơn lương tối thiểu, cảnh báo được đánh dấu.',
          th: 'กำหนดข้อจำกัดการทำงานทางกฎหมายเฉพาะประเทศ:\n• ค่าจ้างขั้นต่ำต่อวัน\n• จำนวนชั่วโมงทำงานสูงสุดต่อวัน\n• จำนวนชั่วโมง OT สูงสุดต่อสัปดาห์\n\nค่าเหล่านี้ถูกใช้โดยระบบสำหรับคำเตือนการตรวจสอบ — หากค่าจ้างที่คำนวณของพนักงานต่ำกว่าค่าจ้างขั้นต่ำ คำเตือนจะถูกแจ้ง',
        },
      },
    ],
  },

  // ─── 11. FAQ ─────────────────────────────────────────────────────────────────
  {
    id: 'faq',
    title: { en: '11. FAQ & Troubleshooting', vi: '11. Câu hỏi & Xử lý lỗi', th: '11. คำถามที่พบบ่อย & แก้ปัญหา' },
    intro: {
      en: 'Common issues and how to resolve them.',
      vi: 'Các vấn đề thường gặp và cách giải quyết.',
      th: 'ปัญหาที่พบบ่อยและวิธีแก้ไข',
    },
    items: [
      {
        heading: {
          en: '"No timesheet data found" error after upload',
          vi: 'Lỗi "Không tìm thấy dữ liệu chấm công" sau khi upload',
          th: 'ข้อผิดพลาด "ไม่พบข้อมูล timesheet" หลังอัปโหลด',
        },
        body: {
          en: 'The file was read but no daily sheets matching "วันที่ N" were found. Check that:\n1. Sheet tab names are exactly "วันที่ 1", "วันที่ 2", etc. (Thai characters, no extra spaces)\n2. The file is .xlsx format, not .xls\n3. The file is not password-protected\n\nDownload the official template to compare sheet naming.',
          vi: 'File được đọc nhưng không tìm thấy sheet ngày khớp "วันที่ N". Kiểm tra:\n1. Tên tab sheet phải đúng là "วันที่ 1", "วันที่ 2", v.v. (ký tự Thái, không có dấu cách thừa)\n2. File định dạng .xlsx, không phải .xls\n3. File không bị bảo vệ bằng mật khẩu\n\nTải template chính thức để so sánh cách đặt tên sheet.',
          th: 'ไฟล์ถูกอ่านแต่ไม่พบชีทรายวันที่ตรงกับ "วันที่ N" ตรวจสอบ:\n1. ชื่อแท็บชีทต้องเป็น "วันที่ 1", "วันที่ 2" ฯลฯ (ตัวอักษรไทย ไม่มีช่องว่างเกิน)\n2. ไฟล์เป็นรูปแบบ .xlsx ไม่ใช่ .xls\n3. ไฟล์ไม่ได้รับการป้องกันด้วยรหัสผ่าน\n\nดาวน์โหลดเทมเพลตอย่างเป็นทางการเพื่อเปรียบเทียบการตั้งชื่อชีท',
        },
      },
      {
        heading: {
          en: 'Column mapping dialog appears every upload',
          vi: 'Dialog ánh xạ cột xuất hiện mỗi lần upload',
          th: 'กล่องโต้ตอบแมปคอลัมน์ปรากฏทุกครั้งที่อัปโหลด',
        },
        body: {
          en: 'The column mapping is remembered per header layout via localStorage. If the dialog appears every time:\n1. Check that you are using the same browser (mappings are not shared across browsers)\n2. The browser may have cleared localStorage — re-map once and it will be saved again\n3. If your Excel template changed headers, you need to remap once with the new layout',
          vi: 'Ánh xạ cột được ghi nhớ theo từng header layout qua localStorage. Nếu dialog xuất hiện mỗi lần:\n1. Kiểm tra đang dùng cùng trình duyệt (ánh xạ không chia sẻ giữa các trình duyệt)\n2. Trình duyệt có thể đã xoá localStorage — ánh xạ lại một lần và sẽ được lưu lại\n3. Nếu template Excel thay đổi header, cần ánh xạ lại một lần với layout mới',
          th: 'การแมปคอลัมน์จะจดจำตามเลย์เอาต์หัวคอลัมน์แต่ละแบบผ่าน localStorage หากกล่องโต้ตอบปรากฏทุกครั้ง:\n1. ตรวจสอบว่าใช้เบราว์เซอร์เดิม (การแมปไม่แชร์ข้ามเบราว์เซอร์)\n2. เบราว์เซอร์อาจล้าง localStorage — แมปใหม่ครั้งเดียวและจะถูกบันทึกอีกครั้ง\n3. หากเทมเพลต Excel เปลี่ยนหัวคอลัมน์ ต้องแมปใหม่ครั้งเดียวด้วยเลย์เอาต์ใหม่',
        },
      },
      {
        heading: {
          en: 'Worker names show as "pending" even after adding them',
          vi: 'Tên CTV hiển thị "chờ cập nhật" dù đã thêm vào',
          th: 'ชื่อพนักงานแสดงว่า "รอการอัปเดต" แม้จะเพิ่มแล้ว',
        },
        body: {
          en: 'After adding a new worker, re-upload the Excel file to re-compute payroll. The system matches attendance records to the worker database at upload time — a previously uploaded file will not automatically update.\n\nAlso check that the worker\'s name in the database matches the name in the Excel file exactly (including Thai characters and spacing).',
          vi: 'Sau khi thêm CTV mới, upload lại file Excel để tính lương lại. Hệ thống ghép bản ghi chấm công với database CTV tại thời điểm upload — file đã upload trước đó sẽ không tự cập nhật.\n\nCũng kiểm tra tên CTV trong database khớp chính xác với tên trong file Excel (bao gồm ký tự Thái và dấu cách).',
          th: 'หลังเพิ่มพนักงานใหม่ อัปโหลดไฟล์ Excel ใหม่เพื่อคำนวณเงินเดือนใหม่ ระบบจับคู่บันทึกการเข้างานกับฐานข้อมูลพนักงาน ณ เวลาอัปโหลด — ไฟล์ที่อัปโหลดก่อนหน้าจะไม่อัปเดตอัตโนมัติ\n\nตรวจสอบด้วยว่าชื่อพนักงานในฐานข้อมูลตรงกับชื่อในไฟล์ Excel ทุกตัวอักษร (รวมตัวอักษรไทยและช่องว่าง)',
        },
      },
      {
        heading: {
          en: 'OT shows 0 for all workers',
          vi: 'OT hiển thị 0 cho tất cả CTV',
          th: 'OT แสดงเป็น 0 สำหรับพนักงานทุกคน',
        },
        body: {
          en: 'OT is read from the "OT before" and "OT after" columns in the Excel file. If those columns are missing or unmapped:\n1. Open the mapping dialog (click "Reset saved mappings" or re-upload and map manually)\n2. Map the "OT before (hours)" and "OT after (hours)" fields to the correct columns\n3. If your file uses a single OT column, map it to "OT after" and leave "OT before" unmapped',
          vi: 'OT được đọc từ cột "OT trước" và "OT sau" trong file Excel. Nếu các cột đó bị thiếu hoặc chưa ánh xạ:\n1. Mở dialog ánh xạ (nhấn "Xoá ánh xạ đã lưu" hoặc upload lại và ánh xạ thủ công)\n2. Ánh xạ trường "OT trước (giờ)" và "OT sau (giờ)" vào đúng cột\n3. Nếu file dùng một cột OT duy nhất, ánh xạ vào "OT sau" và để trống "OT trước"',
          th: 'OT อ่านจากคอลัมน์ "OT ก่อน" และ "OT หลัง" ในไฟล์ Excel หากคอลัมน์เหล่านั้นหายไปหรือไม่ได้แมป:\n1. เปิดกล่องโต้ตอบแมป (คลิก "รีเซ็ตแมปที่บันทึกไว้" หรืออัปโหลดใหม่และแมปด้วยตนเอง)\n2. แมปฟิลด์ "OT ก่อน (ชม.)" และ "OT หลัง (ชม.)" กับคอลัมน์ที่ถูกต้อง\n3. หากไฟล์ใช้คอลัมน์ OT คอลัมน์เดียว แมปกับ "OT หลัง" และปล่อย "OT ก่อน" ว่าง',
        },
      },
      {
        heading: {
          en: 'Bank.csv is missing bank details for some workers',
          vi: 'Bank.csv thiếu thông tin ngân hàng của một số CTV',
          th: 'Bank.csv ขาดรายละเอียดธนาคารสำหรับพนักงานบางคน',
        },
        body: {
          en: 'Workers without a bank account number in the database will have empty bank fields in the CSV. To fix:\n1. Go to Workers → find the worker → click edit\n2. Fill in Bank code and Account number\n3. Re-export Bank.csv\n\nAlternatively, include a "Members" sheet in your Excel file with bank details — the system will import them automatically on the next upload.',
          vi: 'CTV không có số tài khoản ngân hàng trong database sẽ có trường ngân hàng trống trong CSV. Để sửa:\n1. Vào Workers → tìm CTV → nhấn sửa\n2. Điền Mã ngân hàng và Số tài khoản\n3. Xuất lại Bank.csv\n\nHoặc bao gồm sheet "Members" trong file Excel với thông tin ngân hàng — hệ thống sẽ tự nhập khi upload tiếp theo.',
          th: 'พนักงานที่ไม่มีหมายเลขบัญชีธนาคารในฐานข้อมูลจะมีช่องธนาคารว่างใน CSV เพื่อแก้ไข:\n1. ไปที่ Workers → หาพนักงาน → คลิกแก้ไข\n2. กรอก รหัสธนาคาร และ หมายเลขบัญชี\n3. ส่งออก Bank.csv ใหม่\n\nหรือรวมชีท "Members" ในไฟล์ Excel พร้อมรายละเอียดธนาคาร — ระบบจะนำเข้าอัตโนมัติในการอัปโหลดครั้งถัดไป',
        },
      },
      {
        heading: {
          en: 'Late deduction is not being applied',
          vi: 'Khấu trừ trễ không được áp dụng',
          th: 'การหักสายไม่ถูกนำมาใช้',
        },
        body: {
          en: 'Late deduction only applies to BM and DW workers. Check:\n1. The worker\'s department is set to BM or DW in the Workers database\n2. The "Note" column in the timesheet contains the department code (bm/dw) for that worker\n3. The column mapping has "Department code (Note)" mapped to the correct column\n\nInterns (นักศึกษา) and housekeepers (แม่บ้าน) are intentionally exempt.',
          vi: 'Khấu trừ trễ chỉ áp dụng cho CTV BM và DW. Kiểm tra:\n1. Phòng ban của CTV được đặt là BM hoặc DW trong database Workers\n2. Cột "Note" trong timesheet chứa mã phòng ban (bm/dw) cho CTV đó\n3. Ánh xạ cột đã ánh xạ "Mã phòng ban (Note)" vào đúng cột\n\nIntern (นักศึกษา) và housekeeper (แม่บ้าน) được miễn theo thiết kế.',
          th: 'การหักสายใช้กับพนักงาน BM และ DW เท่านั้น ตรวจสอบ:\n1. แผนกของพนักงานถูกตั้งเป็น BM หรือ DW ในฐานข้อมูล Workers\n2. คอลัมน์ "Note" ใน timesheet มีรหัสแผนก (bm/dw) สำหรับพนักงานนั้น\n3. การแมปคอลัมน์ได้แมป "รหัสแผนก (Note)" กับคอลัมน์ที่ถูกต้อง\n\nนักศึกษาและแม่บ้านได้รับการยกเว้นโดยเจตนา',
        },
      },
      {
        heading: {
          en: 'Cannot log in / forgot password',
          vi: 'Không đăng nhập được / quên mật khẩu',
          th: 'เข้าสู่ระบบไม่ได้ / ลืมรหัสผ่าน',
        },
        body: {
          en: '1. Click "Forgot password?" on the login screen\n2. Enter your work email address\n3. Check your inbox (and spam folder) for a reset email\n4. The reset link is valid for 1 hour\n\nIf you do not receive the email after 5 minutes, contact your Super Admin to reset your password or check that your email address is registered correctly in the system.',
          vi: '1. Nhấn "Quên mật khẩu?" trên màn hình đăng nhập\n2. Nhập địa chỉ email công việc\n3. Kiểm tra hộp thư (và thư mục spam) để tìm email đặt lại\n4. Đường dẫn đặt lại có hiệu lực trong 1 giờ\n\nNếu không nhận được email sau 5 phút, liên hệ Super Admin để đặt lại mật khẩu hoặc kiểm tra địa chỉ email có được đăng ký đúng không.',
          th: '1. คลิก "ลืมรหัสผ่าน?" ที่หน้าจอเข้าสู่ระบบ\n2. ใส่ที่อยู่อีเมลที่ทำงาน\n3. ตรวจสอบกล่องจดหมาย (และโฟลเดอร์สแปม) สำหรับอีเมลรีเซ็ต\n4. ลิงก์รีเซ็ตใช้ได้ 1 ชั่วโมง\n\nหากไม่ได้รับอีเมลหลังจาก 5 นาที ติดต่อ Super Admin เพื่อรีเซ็ตรหัสผ่าน หรือตรวจสอบว่าที่อยู่อีเมลถูกลงทะเบียนอย่างถูกต้องในระบบ',
        },
      },
      {
        heading: {
          en: 'I do not see my warehouse in the selector',
          vi: 'Tôi không thấy kho của mình trong bộ chọn',
          th: 'ฉันไม่เห็นคลังของฉันในตัวเลือก',
        },
        body: {
          en: 'Each user account is scoped to one or more warehouses. If your warehouse is missing:\n1. Contact your Country Admin to check your account\'s warehouse assignment\n2. The warehouse may not yet be created — ask a Country Admin to add it in Settings → Warehouses\n3. If you are a Super Admin, you can create warehouses directly in Settings.',
          vi: 'Mỗi tài khoản được giới hạn theo một hoặc nhiều kho. Nếu thiếu kho của bạn:\n1. Liên hệ Country Admin để kiểm tra phân công kho của tài khoản\n2. Kho có thể chưa được tạo — yêu cầu Country Admin thêm vào Settings → Warehouses\n3. Nếu bạn là Super Admin, bạn có thể tạo kho trực tiếp trong Settings.',
          th: 'บัญชีผู้ใช้แต่ละบัญชีถูกจำกัดขอบเขตเป็นคลังหนึ่งแห่งหรือมากกว่า หากคลังของคุณหายไป:\n1. ติดต่อ Country Admin เพื่อตรวจสอบการมอบหมายคลังของบัญชีคุณ\n2. คลังอาจยังไม่ถูกสร้าง — ขอให้ Country Admin เพิ่มใน Settings → Warehouses\n3. หากคุณเป็น Super Admin คุณสามารถสร้างคลังได้โดยตรงใน Settings',
        },
      },
    ],
  },
]
