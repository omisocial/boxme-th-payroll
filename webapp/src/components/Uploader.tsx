import { useCallback, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, Loader2, Download, BookOpen, Calculator } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

interface Props {
  onFile: (buffer: ArrayBuffer, name: string) => Promise<void> | void
  loading?: boolean
  onDownloadTemplate: () => void
  onOpenGuide: () => void
  onOpenFormula: () => void
}

export default function Uploader({ onFile, loading, onDownloadTemplate, onOpenGuide, onOpenFormula }: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return
    const file = files[0]
    const buf = await file.arrayBuffer()
    await onFile(buf, file.name)
  }, [onFile])

  return (
    <div className="space-y-4">
      <div
        className={`card p-6 sm:p-10 flex flex-col items-center justify-center text-center transition border-2 border-dashed ${drag ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
      >
        <div className="h-14 w-14 rounded-2xl bg-blue-50 grid place-items-center text-blue-600 mb-4">
          {loading ? <Loader2 className="animate-spin" /> : <FileSpreadsheet size={26} />}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
          {loading ? t('upload.processing') : t('upload.dropTitle')}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-md">{t('upload.help')}</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="btn-primary mt-5"
        >
          <Upload size={16} /> {t('upload.button')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="text-xs text-slate-400 mt-4">{t('upload.constraint')}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <ActionCard icon={<Download size={18} />} label={t('upload.template')} onClick={onDownloadTemplate} tone="emerald" />
        <ActionCard icon={<BookOpen size={18} />} label={t('upload.guide')} onClick={onOpenGuide} tone="blue" />
        <ActionCard icon={<Calculator size={18} />} label={t('upload.formula')} onClick={onOpenFormula} tone="violet" />
      </div>
    </div>
  )
}

function ActionCard({ icon, label, onClick, tone }: { icon: React.ReactNode; label: string; onClick: () => void; tone: 'emerald' | 'blue' | 'violet' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100',
    violet: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-100',
  }
  return (
    <button
      onClick={onClick}
      className={`card p-3.5 flex items-center gap-3 transition border ${tones[tone]}`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="text-sm font-medium text-left">{label}</div>
    </button>
  )
}
