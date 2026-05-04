import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, BookOpen, ChevronRight,
  Info, AlertTriangle, Code2, Menu, X
} from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { GUIDE_SECTIONS, type GL } from '../i18n/guideDict'

interface Props {
  onBack: () => void
}

// Role matrix: rows = action, cols = [viewer, hr, country_admin, super_admin]
const ROLE_MATRIX: { action: Record<GL, string>; cols: boolean[] }[] = [
  { action: { en: 'View reports & exports', vi: 'Xem báo cáo & xuất file', th: 'ดูรายงานและส่งออก' }, cols: [true, true, true, true] },
  { action: { en: 'Upload timesheet', vi: 'Upload timesheet', th: 'อัปโหลด timesheet' }, cols: [false, true, true, true] },
  { action: { en: 'Manage workers', vi: 'Quản lý CTV', th: 'จัดการพนักงาน' }, cols: [false, true, true, true] },
  { action: { en: 'Create & lock periods', vi: 'Tạo & khoá kỳ', th: 'สร้างและล็อกรอบ' }, cols: [false, true, true, true] },
  { action: { en: 'Mark payments', vi: 'Đánh dấu thanh toán', th: 'ทำเครื่องหมายชำระเงิน' }, cols: [false, true, true, true] },
  { action: { en: 'Approve periods', vi: 'Duyệt kỳ lương', th: 'อนุมัติรอบเงินเดือน' }, cols: [false, false, true, true] },
  { action: { en: 'Manage settings', vi: 'Quản lý cài đặt', th: 'จัดการการตั้งค่า' }, cols: [false, false, true, true] },
  { action: { en: 'Manage users', vi: 'Quản lý người dùng', th: 'จัดการผู้ใช้' }, cols: [false, false, false, true] },
  { action: { en: 'Reset demo data', vi: 'Reset demo', th: 'รีเซ็ตข้อมูลทดสอบ' }, cols: [false, false, false, true] },
]

const ROLE_HEADERS: Record<GL, string[]> = {
  en: ['Action', 'Viewer', 'HR', 'Country Admin', 'Super Admin'],
  vi: ['Thao tác', 'Viewer', 'HR', 'Country Admin', 'Super Admin'],
  th: ['การดำเนินการ', 'Viewer', 'HR', 'Country Admin', 'Super Admin'],
}

export default function UserGuidePage({ onBack }: Props) {
  const { lang, t } = useI18n()
  const gl = lang as GL
  const [activeId, setActiveId] = useState<string>(GUIDE_SECTIONS[0].id)
  const [tocOpen, setTocOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRefs = useRef<Record<string, HTMLElement | null>>({})
  const isScrollingRef = useRef(false)

  // Intersection observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    GUIDE_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  function jumpTo(id: string) {
    isScrollingRef.current = true
    setActiveId(id)
    setTocOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => { isScrollingRef.current = false }, 800)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('common.cancel')}</span>
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600" />
            <span className="font-semibold text-slate-900 text-sm">{t('nav.guide')}</span>
          </div>
        </div>

        {/* Mobile ToC toggle */}
        <button
          onClick={() => setTocOpen(v => !v)}
          className="sm:hidden flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {tocOpen ? <X size={16} /> : <Menu size={16} />}
          <span>{t('guide.toc')}</span>
        </button>
      </div>

      {/* Mobile ToC dropdown */}
      {tocOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 z-10">
          <TocList sections={GUIDE_SECTIONS} activeId={activeId} gl={gl} onJump={jumpTo} />
        </div>
      )}

      {/* Main layout */}
      <div className="flex max-w-7xl w-full mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden sm:flex flex-col w-56 shrink-0 sticky top-[105px] self-start max-h-[calc(100vh-110px)] overflow-y-auto py-6 pl-4 pr-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            {t('guide.toc')}
          </div>
          <TocList sections={GUIDE_SECTIONS} activeId={activeId} gl={gl} onJump={jumpTo} />
        </aside>

        {/* Content */}
        <div ref={contentRef} className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8 space-y-12">
          {GUIDE_SECTIONS.map(section => (
            <section key={section.id} id={section.id} ref={el => { headingRefs.current[section.id] = el }} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900 mb-2">{section.title[gl]}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{section.intro[gl]}</p>

              <div className="space-y-5">
                {section.items.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <ChevronRight size={14} className="text-blue-500 shrink-0" />
                        {item.heading[gl]}
                      </h3>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.body[gl]}</p>

                      {item.code && (
                        <div className="bg-slate-900 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Code2 size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-400 font-mono uppercase tracking-wide">formula</span>
                          </div>
                          <pre className="text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">{item.code}</pre>
                        </div>
                      )}

                      {item.tip && (
                        <div className="flex gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                          <Info size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-800 leading-relaxed">{item.tip[gl]}</p>
                        </div>
                      )}

                      {item.warn && (
                        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 leading-relaxed">{item.warn[gl]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Role matrix inside login section */}
              {section.id === 'login' && <RoleMatrix gl={gl} />}
            </section>
          ))}

          <footer className="text-center text-xs text-slate-400 pt-4 pb-8 border-t border-slate-100">
            {t('footer')}
          </footer>
        </div>
      </div>
    </div>
  )
}

// ─── Table of Contents List ───────────────────────────────────────────────────

function TocList({
  sections, activeId, gl, onJump,
}: {
  sections: typeof GUIDE_SECTIONS
  activeId: string
  gl: GL
  onJump: (id: string) => void
}) {
  return (
    <nav className="space-y-0.5">
      {sections.map(s => (
        <button
          key={s.id}
          onClick={() => onJump(s.id)}
          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors leading-snug ${
            s.id === activeId
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          {s.title[gl]}
        </button>
      ))}
    </nav>
  )
}

// ─── Role Matrix Table ────────────────────────────────────────────────────────

function RoleMatrix({ gl }: { gl: GL }) {
  const headers = ROLE_HEADERS[gl]
  return (
    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm">
          {gl === 'en' ? 'Role Permissions Matrix' : gl === 'vi' ? 'Ma trận quyền hạn' : 'ตารางสิทธิ์ตามบทบาท'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((h, i) => (
                <th key={i} className={`py-2 px-3 font-semibold text-slate-700 ${i === 0 ? 'text-left' : 'text-center'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_MATRIX.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="py-2 px-3 text-slate-700">{row.action[gl]}</td>
                {row.cols.map((allowed, j) => (
                  <td key={j} className="py-2 px-3 text-center">
                    {allowed
                      ? <span className="text-emerald-600 font-bold">✓</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

