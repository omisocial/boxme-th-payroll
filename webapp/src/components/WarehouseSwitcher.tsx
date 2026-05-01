import { useState, useRef, useEffect } from 'react'
import { Warehouse, ChevronDown, Check } from 'lucide-react'
import { useWarehouse } from '../context/WarehouseContext'

export default function WarehouseSwitcher() {
  const { current, accessible, setCurrent, loading } = useWarehouse()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (loading && !current) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400">
        <Warehouse size={14} /> ...
      </div>
    )
  }

  if (!current) return null

  // Hide switcher entirely when there's only one warehouse.
  if (accessible.length <= 1) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 bg-slate-100">
        <Warehouse size={13} />
        <span className="font-medium">{current.code}</span>
        <span className="text-slate-400">{current.countryCode}</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 transition"
      >
        <Warehouse size={13} className="text-slate-500" />
        <span className="text-slate-900">{current.code}</span>
        <span className="text-slate-400 hidden sm:inline">· {current.countryCode}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 max-h-80 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-lg z-40 py-1">
          {accessible.map(w => {
            const active = w.id === current.id
            return (
              <button
                key={w.id}
                onClick={() => { setCurrent(w.id); setOpen(false) }}
                className={`w-full flex items-start justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 transition ${active ? 'bg-blue-50/40' : ''}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{w.code} — {w.name}</div>
                  <div className="text-xs text-slate-500">
                    {w.countryName ?? w.countryCode} · {w.currency}
                  </div>
                </div>
                {active && <Check size={14} className="text-blue-600 mt-1 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
