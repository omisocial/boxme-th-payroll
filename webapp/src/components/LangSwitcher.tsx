import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { LANGS } from '../i18n/dict'
import { useI18n } from '../i18n/I18n'

export default function LangSwitcher() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGS.find(l => l.code === lang)!

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
        aria-label="Language"
      >
        <Globe size={14} />
        <span className="hidden sm:inline text-slate-700 font-medium">{current.flag} {current.label}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-40">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 ${lang === l.code ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {lang === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
