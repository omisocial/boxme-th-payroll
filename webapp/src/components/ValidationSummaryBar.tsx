import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Wrench } from 'lucide-react'
import type { Flag, PayrollResult } from '../payroll/types'
import { useI18n } from '../i18n/I18n'

interface Props {
  rows: PayrollResult[]
  // Called when user applies a batch shift-code fix for all UNKNOWN_SHIFT rows
  onFixShift: (shiftCode: string) => void
}

// Flags that are actionable / noteworthy (exclude purely informational ones)
const WARN_FLAGS: Flag[] = [
  'NO_CHECKIN', 'NO_CHECKOUT', 'UNKNOWN_SHIFT',
  'ABSENT', 'NEGATIVE_FLOORED', 'DAMAGE_OFFSETS_WAGE',
]

export default function ValidationSummaryBar({ rows, onFixShift }: Props) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(true)
  const [shiftInput, setShiftInput] = useState('08:30 - 17:30')

  // Count rows per flag type (a row can have multiple flags)
  const flagCounts: Partial<Record<Flag, number>> = {}
  for (const row of rows) {
    for (const f of row.flags) {
      if (WARN_FLAGS.includes(f)) {
        flagCounts[f] = (flagCounts[f] ?? 0) + 1
      }
    }
  }

  const warningEntries = Object.entries(flagCounts) as [Flag, number][]
  if (warningEntries.length === 0) return null

  const unknownShiftCount = flagCounts['UNKNOWN_SHIFT'] ?? 0

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/60 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle size={14} />
          <span className="text-xs font-semibold">
            {warningEntries.length} issue type{warningEntries.length !== 1 ? 's' : ''} detected
            {' · '}{warningEntries.reduce((s, [, n]) => s + n, 0)} rows affected
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-amber-600" /> : <ChevronDown size={14} className="text-amber-600" />}
      </button>

      {expanded && (
        <div className="border-t border-amber-200 px-4 py-3 space-y-3">
          {/* Flag list */}
          <div className="space-y-1">
            {warningEntries.map(([flag, count]) => (
              <div key={flag} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-amber-800 font-medium">{count} rows</span>
                <span className="text-amber-700">— {t(('flag.' + flag) as any)}</span>
              </div>
            ))}
          </div>

          {/* Batch shift fix — only shown when there are UNKNOWN_SHIFT rows */}
          {unknownShiftCount > 0 && (
            <div className="border border-amber-300 bg-white rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <Wrench size={12} />
                {t('validation.quickFix').replace('{count}', String(unknownShiftCount))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1 text-xs font-mono"
                  placeholder="HH:MM - HH:MM"
                  value={shiftInput}
                  onChange={e => setShiftInput(e.target.value)}
                />
                <button
                  className="btn-primary text-xs px-3"
                  onClick={() => {
                    if (shiftInput.trim()) onFixShift(shiftInput.trim())
                  }}
                  disabled={!shiftInput.trim()}
                >
                  {t('validation.apply')}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">{t('validation.formatHint')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
