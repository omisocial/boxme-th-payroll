# Boxme Thailand — Seasonal Payroll MVP (Phase 1)

Web app tính lương cộng tác viên Boxme Thailand từ file Excel timesheet hiện hành (`Thailand_Sessonal_Payment.xlsx`).

> **Phase 1 scope**: TH only · base + OT · xử lý file Excel local · responsive web (mobile-first) · deploy lên Cloudflare Pages.

## Tính năng

- **Upload Excel** drag-drop, parse tất cả sheet `วันที่ X` + `Members` + `สินค้าเสียหาย`.
- **Tính toán theo spec**: base 500 ฿ · OT 1.5× · phạt trễ chỉ áp dụng cho BM/DW (intern/แม่บ้าน miễn) · floor 0 nếu damage > daily rate.
- **Dashboard period**: KPI cards (gross, OT, deduction, số CTV, số ngày, số ca).
- **Bảng worker summary**: search, filter theo phòng ban; click vào để xem drill-down từng ngày.
- **Drill-down per worker**: late/early/OT/damage breakdown + flags.
- **Configurable**: HR override daily rate, OT multiplier, late buffer.
- **Export**: daily.xlsx, workers.xlsx, bank-export.csv.
- **Privacy**: file xử lý hoàn toàn local — không gửi server.
- **Responsive**: mobile-first, table → cards trên mobile.

## Tech stack

- Vite + React 19 + TypeScript
- Tailwind CSS 3
- SheetJS (`xlsx`) — parse Excel client-side
- Lucide React — icons

## Local dev

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # → dist/
```

## Deploy Cloudflare Pages

### Wrangler CLI

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name boxme-th-payroll
```

### Git integration

1. Push repo → GitHub.
2. Cloudflare Dashboard → Pages → Connect to Git.
3. Build: framework `Vite`, command `npm run build`, output `dist`, root `webapp`.

## Cấu trúc

```
src/
├── App.tsx                       # main
├── components/                   # Header, Uploader, StatCards, WorkerTable, WorkerDetail, Toolbar
├── payroll/
│   ├── types.ts
│   ├── engine.ts                 # formula engine — mirror spec/formulas.md
│   ├── parser.ts                 # SheetJS parser
│   ├── aggregate.ts              # period + worker summary
│   └── exporter.ts               # xlsx / CSV
└── utils/format.ts
```

## Mapping spec → code

| Spec | Code |
|---|---|
| `formulas.md` Step 1–7 | `payroll/engine.ts::computePayroll()` |
| `formulas.md` Step 8 (period) | `payroll/aggregate.ts` |
| `analysis/01_analysis_report.md` §3 | `payroll/parser.ts` |
| BM/DW/intern/housekeeper classification | `engine.ts::classifyDept()` |

## Phase 1 limitations

- Chưa có holiday/sick leave config (Q-12, Q-13)
- Bank export là CSV generic, chưa per-bank format
- Chưa có persistence / audit log (cần backend Phase 2)
- Damage carryover chưa implement — chỉ floor 0

## Liên hệ

Boxme Vietnam BA — mark@boxme.tech
