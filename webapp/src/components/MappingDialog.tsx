import { useMemo, useState } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { OPTIONAL_FIELDS, REQUIRED_FIELDS, isMappingComplete, type ColumnMapping, type FieldKey } from '../payroll/mapping'

interface Props {
  headers: (string | null)[]
  initialMapping: ColumnMapping
  onSave: (m: ColumnMapping) => void
  onCancel: () => void
}

const FIELD_LABELS: Record<FieldKey, string> = {
  fullName: 'map.field.fullName',
  checkin: 'map.field.checkin',
  checkout: 'map.field.checkout',
  note: 'map.field.note',
  shiftCode: 'map.field.shift',
  nickname: 'map.field.nickname',
  manualNote: 'map.field.manualNote',
  otBefore: 'map.field.otBefore',
  otAfter: 'map.field.otAfter',
  damage: 'map.field.damage',
  other: 'map.field.other',
}

export default function MappingDialog({ headers, initialMapping, onSave, onCancel }: Props) {
  const { t } = useI18n()
  const [m, setM] = useState<ColumnMapping>(initialMapping)

  const headerOptions = useMemo(() => {
    return headers.map((h, i) => ({ idx: i, label: `${columnLetter(i)} · ${h || '(empty)'}` }))
  }, [headers])

  const complete = isMappingComplete(m)

  function set(field: FieldKey, idx: number) {
    setM(prev => ({ ...prev, [field]: idx }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-600 mb-1.5">
              <AlertTriangle size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">{t('map.title')}</span>
            </div>
            <p className="text-sm text-slate-600">{t('map.desc')}</p>
          </div>
          <button onClick={onCancel} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <Section title={t('map.required')} fields={REQUIRED_FIELDS} required>
            {(field) => (
              <FieldRow
                key={field}
                label={t(FIELD_LABELS[field] as any)}
                value={m[field]}
                options={headerOptions}
                required
                onChange={(v) => set(field, v)}
                placeholder={t('map.notMapped')}
              />
            )}
          </Section>

          <Section title={t('map.optional')} fields={OPTIONAL_FIELDS}>
            {(field) => (
              <FieldRow
                key={field}
                label={t(FIELD_LABELS[field] as any)}
                value={m[field]}
                options={headerOptions}
                onChange={(v) => set(field, v)}
                placeholder={t('map.notMapped')}
              />
            )}
          </Section>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">{t('common.cancel')}</button>
          <button
            onClick={() => onSave(m)}
            disabled={!complete}
            className="btn-primary text-sm"
          >
            <Save size={14} /> {t('map.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, fields, required, children }: {
  title: string
  fields: FieldKey[]
  required?: boolean
  children: (field: FieldKey) => React.ReactNode
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
        <span className={required ? 'text-rose-600' : 'text-slate-500'}>{title}</span>
      </div>
      <div className="space-y-2">
        {fields.map(f => children(f))}
      </div>
    </div>
  )
}

function FieldRow({ label, value, options, onChange, placeholder, required }: {
  label: string
  value: number
  options: { idx: number; label: string }[]
  onChange: (v: number) => void
  placeholder: string
  required?: boolean
}) {
  return (
    <label className="flex items-center gap-3 sm:gap-4">
      <div className="text-sm font-medium text-slate-700 w-1/2 sm:w-1/3 min-w-0">
        {label} {required && <span className="text-rose-500">*</span>}
      </div>
      <select
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${value < 0 && required ? 'border-rose-300' : 'border-slate-200'}`}
      >
        <option value={-1}>{placeholder}</option>
        {options.map(o => (
          <option key={o.idx} value={o.idx}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function columnLetter(idx: number): string {
  let s = ''
  let n = idx
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}
