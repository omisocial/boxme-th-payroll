# Glossary — Thai / English / Vietnamese
## คลังคำศัพท์ — ไทย / อังกฤษ / เวียดนาม

Use this glossary in every conversation between Boxme Vietnam BA team and Boxme Thailand operations team to avoid translation drift. ใช้ตอนคุยกับทีม BA Vietnam ป้องกันแปลเพี้ยน. Sử dụng để giao tiếp giữa BA team Việt Nam và team vận hành Thái Lan, tránh dịch sai nghĩa.

---

## 1. Worker / Identity / พนักงาน

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| พนักงาน / คนงาน | worker / employee | nhân viên / công nhân | Generic |
| พนักงานชั่วคราว | seasonal / part-time worker | nhân viên thời vụ | Boxme: BM, DW, แม่บ้าน, นักศึกษา |
| สังกัด | department code | mã phòng ban | E.g. BM1, DW1 |
| ชื่อ - สกุล / ชื่อ-นามสกุล | full name | họ và tên | Primary join key in Excel |
| ชื่อเล่น | nickname | biệt danh / tên gọi thân mật | **93 collisions in Members** — not a unique key |
| เบอร์โทร | phone number | số điện thoại | PII — mask last 4 |
| เลขที่บัญชี / เลขบัญชี | bank account number | số tài khoản ngân hàng | PII |
| ตัวย่อธนาคาร | bank code | mã ngân hàng | K-BANK, SCB, BBL, KTB, BAY, GSB, TTB, KKP, BAAC, UOB |
| ชื่อธนาคาร | bank name | tên ngân hàng | Lookup from bank code |
| วันที่เริ่มงาน | start date / hire date | ngày bắt đầu làm việc | |
| ลาออกไปแล้ว | already resigned / left | đã nghỉ việc | Affects unpaid damage collection |
| BM | Boxme staff | nhân viên Boxme | |
| DW | Daily Worker | công nhân nhật / công nhân thuê ngày | Walk-in temp |
| แม่บ้าน | housekeeper / cleaner | tạp vụ / lao công | Late penalty exempt |
| นักศึกษาฝึกงาน | intern (student) | thực tập sinh (sinh viên) | Late penalty exempt; pay status TBD |

## 2. Time & Attendance / เวลาและการเข้าทำงาน

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| Checkin / เข้างาน | check-in | chấm công vào | Date+time |
| Checkout / เลิกงาน | check-out | chấm công ra | Time |
| กะการทำงาน / กะ | shift | ca làm việc | E.g. `08:30-17:30` |
| กะเช้า | morning shift | ca sáng | |
| กะดึก | night shift | ca đêm / ca khuya | Crosses midnight |
| เวลาเริ่ม | shift start | giờ bắt đầu ca | |
| เวลาเลิก | shift end | giờ kết thúc ca | |
| ชั่วโมงทำงาน | hours-worked bucket | giờ làm việc (chuẩn hoá) | **5 or 8** in Excel — not actual hours |
| ตรงเวลา | on time | đúng giờ | |
| สาย / มาสาย | late | đi trễ / đi muộn | |
| สาย (นาที) | late minutes | số phút đi trễ | Decimal precision |
| นาทีที่หักจริง | minutes actually deducted | số phút bị trừ thực tế | BM/DW only |
| ออกก่อน / เลิกก่อน | early leave / early-out | về sớm | |
| นาทีที่ออกก่อน | early-out minutes | số phút về sớm | |
| โทรศัพท์เข้าแอปไม่ได้เช็คอิน | phone app failed, manual checkin | điện thoại không vào được app, chấm công thủ công | |

## 3. Wage / Pay / ค่าแรง

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| ค่าแรง | wage / daily rate | tiền công / lương ngày | Excel col AA = THB 500 (placeholder) |
| ค่าแรง/นาที | wage per minute | lương theo phút | `daily_rate / (U × 60)` |
| ค่าแรง OT / ค่าโอที | OT pay | tiền OT / tiền tăng ca | |
| OT ก่อน | OT before (pre-shift) | OT trước ca | E.g. 05:00-07:00 before a 07:00 shift |
| OT หลัง | OT after (post-shift) | OT sau ca | E.g. 18:00-20:00 after a 17:30 shift |
| รวม OT | total OT (hours) | tổng OT (giờ) | `OT_before_hr + OT_after_hr` |
| รวมค่าแรง | gross wage / total | tổng tiền công | After all deductions, plus OT |

## 4. Deductions / การหักเงิน

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| จำนวนเงินหักสาย | late deduction | tiền trừ đi trễ | `wage_per_min × late_min` |
| จำนวนเงินหักออกก่อน | early-leave deduction | tiền trừ về sớm | `wage_per_min × early_min` |
| สินค้าเสียหาย | damaged goods | hàng hư hỏng / hàng lỗi | Worker-caused damage |
| ค่าเสียหาย | damage cost | tiền bồi thường thiệt hại | THB amount in damage log |
| หักสินค้าชำรุด | damaged-goods deduction | trừ tiền hàng hư | Excel col AI |
| คลังที่ | warehouse # | kho số | Damage log col F |
| สถานะ | status | trạng thái | |
| หักเงินแล้ว | deducted (already) | đã trừ | Damage status |
| ยังไม่ได้หักเงิน | not yet deducted | chưa trừ | Damage status |
| วันที่ทำผิด | incident date | ngày phát sinh sự cố | |
| วันที่หักค่าเสียหาย | deduction date | ngày tiến hành trừ | |
| แพ็คผิด | mis-pack / wrong packing | đóng gói sai | Common damage cause |

## 5. Leave / การลา

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| ลา | leave | nghỉ phép | Generic |
| ลาป่วย | sick leave | nghỉ ốm / nghỉ bệnh | Currently unpaid (treated as early-out) — confirm |
| ลากิจ | personal leave | nghỉ việc riêng | Currently unpaid |
| ลาบ่าย / ลาช่วงบ่าย | afternoon leave / half-day off | nghỉ buổi chiều | |
| ลาเช้า / ลาช่วงเช้า | morning leave | nghỉ buổi sáng | |
| เข้างานบ่าย | start work in afternoon | bắt đầu làm buổi chiều | Half-day late |
| ลาไปหาหมอ | medical leave (doctor visit) | nghỉ đi khám bác sĩ | |
| แจ้งลา | leave notice | báo nghỉ | |

## 6. Roles & Process / บทบาทและกระบวนการ

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| ฝ่ายบุคคล / HR | HR | Phòng nhân sự | |
| ผู้จัดการ | manager | quản lý | |
| หัวหน้ากะ | shift supervisor | trưởng ca | |
| อนุมัติ | approve | phê duyệt | |
| ตรวจสอบ | verify / audit | kiểm tra | |
| รอบจ่ายเงิน | pay period | kỳ trả lương | weekly/biweekly/monthly |

## 7. Calendar / ปฏิทิน

| Thai (ไทย) | English | Vietnamese (Tiếng Việt) | Notes |
|---|---|---|---|
| พ.ศ. (พุทธศักราช) | Buddhist Era (BE) | Phật lịch | Gregorian + 543 |
| ค.ศ. (คริสต์ศักราช) | CE / AD (Gregorian) | Dương lịch / Tây lịch | Standard for system internal storage |
| วันที่ | date / day | ngày | E.g. `วันที่ 1` = Day 1 |

## 8. Banks / ธนาคาร (Boxme TH used)

| Code | Thai full name | English | Vietnamese |
|---|---|---|---|
| K-BANK | ธนาคารกสิกรไทย | Kasikornbank | Ngân hàng Kasikornbank |
| SCB | ธนาคารไทยพาณิชย์ | Siam Commercial Bank | Ngân hàng SCB |
| BBL | ธนาคารกรุงเทพ | Bangkok Bank | Ngân hàng Bangkok |
| KTB | ธนาคารกรุงไทย | Krung Thai Bank | Ngân hàng Krung Thai |
| BAY | ธนาคารกรุงศรีอยุธยา | Bank of Ayudhya | Ngân hàng Krungsri |
| GSB | ธนาคารออมสิน | Government Savings Bank | Ngân hàng Tiết kiệm Chính phủ |
| TTB | ธนาคารทหารไทยธนชาต | TMBThanachart Bank | Ngân hàng TMBThanachart |
| KKP | ธนาคารเกียรตินาคินภัทร | Kiatnakin Phatra Bank | Ngân hàng Kiatnakin |
| BAAC | ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร | Bank for Agriculture and Agricultural Cooperatives | Ngân hàng Nông nghiệp |
| UOB | ธนาคารยูโอบี | UOB | Ngân hàng UOB |

---

**Reminder / เตือน**: Original column headers in Excel use Thai. New system UI should support both Thai and English labels per user preference. Internal database column names use **English snake_case**. ฐานข้อมูลภายในใช้ snake_case อังกฤษ. Header gốคใน Excel เป็นภาษาไทย — UI รองรับสองภาษา.
