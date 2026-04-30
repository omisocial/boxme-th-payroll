import { Download, FileSpreadsheet, RefreshCw, FileText } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

interface Props {
  fileName: string
  daysCount: number
  onReset: () => void
  onExportDaily: () => void
  onExportWorkers: () => void
  onExportBank: () => void
}

export default function Toolbar({ fileName, daysCount, onReset, onExportDaily, onExportWorkers, onExportBank }: Props) {
  const { t } = useI18n()
  return (
    <div className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-emerald-50 grid place-items-center text-emerald-600 shrink-0">
          <FileSpreadsheet size={18} />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm text-slate-900 truncate">{fileName}</div>
          <div className="text-xs text-slate-500">{daysCount} {t('tb.fileLabel')}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onExportDaily} className="btn-secondary text-xs sm:text-sm py-2 sm:py-2.5">
          <Download size={14} /> {t('tb.exportDaily')}
        </button>
        <button onClick={onExportWorkers} className="btn-secondary text-xs sm:text-sm py-2 sm:py-2.5">
          <Download size={14} /> {t('tb.exportWorkers')}
        </button>
        <button onClick={onExportBank} className="btn-secondary text-xs sm:text-sm py-2 sm:py-2.5">
          <FileText size={14} /> {t('tb.exportBank')}
        </button>
        <button onClick={onReset} className="btn-secondary text-xs sm:text-sm py-2 sm:py-2.5 text-slate-600">
          <RefreshCw size={14} /> {t('tb.reset')}
        </button>
      </div>
    </div>
  )
}
