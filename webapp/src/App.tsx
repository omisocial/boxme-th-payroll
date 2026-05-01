import { useMemo, useState } from 'react'
import Header from './components/Header'
import Uploader from './components/Uploader'
import StatCards from './components/StatCards'
import Toolbar from './components/Toolbar'
import WorkerTable from './components/WorkerTable'
import WorkerDetail from './components/WorkerDetail'
import MappingDialog from './components/MappingDialog'
import HelpPanel from './components/HelpPanel'
import LoginPage from './components/LoginPage'
import ChangePasswordPage from './components/ChangePasswordPage'
import { parseWorkbook } from './payroll/parser'
import { computePayroll } from './payroll/engine'
import { summarizePeriod, summarizeWorkers } from './payroll/aggregate'
import { exportDailyXlsx, exportWorkerSummaryXlsx, exportBankCsv } from './payroll/exporter'
import { downloadTemplate } from './payroll/template'
import { saveMapping, type ColumnMapping } from './payroll/mapping'
import type { ParsedWorkbook, PayrollResult, WorkerSummary } from './payroll/types'
import { AlertTriangle, Sparkles, Settings, CheckCircle2, LogOut, User, Users, Shield, Leaf, SlidersHorizontal } from 'lucide-react'
import { useI18n } from './i18n/I18n'
import { useAuth } from './auth/useAuth'
import { useEngineConfig } from './context/ConfigContext'
import PayrollBadges from './features/payroll/PayrollBadges'
import WorkersPage from './components/workers/WorkersPage'
import AdminPage from './components/admin/AdminPage'
import SeasonalWorkersPage from './components/seasonal/SeasonalWorkersPage'
import SettingsPage from './components/settings/SettingsPage'

type View = 'payroll' | 'workers' | 'seasonal' | 'settings' | 'admin'

function App() {
  const { t } = useI18n()
  const auth = useAuth()
  const { config, setConfig } = useEngineConfig()

  const [view, setView] = useState<View>('payroll')
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [pendingBuffer, setPendingBuffer] = useState<{ buf: ArrayBuffer; name: string } | null>(null)
  const [pendingHeaders, setPendingHeaders] = useState<{ headers: (string | null)[]; mapping: ColumnMapping } | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<WorkerSummary | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [helpTab, setHelpTab] = useState<'guide' | 'formula' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const computed = useMemo(() => {
    if (!workbook || workbook.requiresMapping) return null
    const rows: PayrollResult[] = workbook.attendance.map(a => computePayroll(a, config))
    const summary = summarizePeriod(rows)
    const workers = summarizeWorkers(rows, workbook.members)
    return { rows, summary, workers }
  }, [workbook, config])

  // Auth gates
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!auth.user) {
    return <LoginPage onLogin={auth.login} />
  }

  if (auth.user.force_password_change) {
    return <ChangePasswordPage onChangePassword={auth.changePassword} />
  }

  async function handleFile(buf: ArrayBuffer, name: string) {
    setLoading(true)
    setErr(null)
    try {
      const parsed = parseWorkbook(buf, name)
      if (parsed.requiresMapping) {
        setPendingBuffer({ buf, name })
        setPendingHeaders({ headers: parsed.sampleHeaders || [], mapping: parsed.suggestedMapping! })
        setWorkbook(null)
      } else if (parsed.attendance.length === 0) {
        setErr(t('err.noData'))
        setWorkbook(null)
      } else {
        setWorkbook(parsed)
      }
    } catch (e) {
      setErr((e as Error).message || t('err.parse'))
    } finally {
      setLoading(false)
    }
  }

  function applyMapping(mapping: ColumnMapping) {
    if (!pendingBuffer || !pendingHeaders) return
    saveMapping(pendingHeaders.headers, mapping)
    setToast(t('map.savedToast'))
    setTimeout(() => setToast(null), 3000)
    try {
      const parsed = parseWorkbook(pendingBuffer.buf, pendingBuffer.name, mapping)
      if (parsed.attendance.length === 0) {
        setErr(t('err.noData'))
      } else {
        setWorkbook(parsed)
      }
    } catch (e) {
      setErr((e as Error).message || t('err.parse'))
    }
    setPendingHeaders(null)
    setPendingBuffer(null)
  }

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    country_admin: 'Country Admin',
    hr: 'HR',
    supervisor: 'Supervisor',
    viewer: 'Viewer',
  }

  const canAdmin = auth.user.role === 'super_admin' || auth.user.role === 'country_admin'

  const navTabs: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'payroll', label: 'Payroll', icon: <Sparkles size={14} /> },
    { id: 'workers', label: 'Workers', icon: <Users size={14} /> },
    { id: 'seasonal', label: 'Seasonal', icon: <Leaf size={14} /> },
    ...(canAdmin ? [{ id: 'settings' as View, label: 'Settings', icon: <SlidersHorizontal size={14} /> }] : []),
    ...(canAdmin ? [{ id: 'admin' as View, label: 'Admin', icon: <Shield size={14} /> }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenHelp={() => setHelpTab('guide')}>
        {/* User badge in header */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
            <User size={12} />
            <span>{auth.user.email}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {roleLabel[auth.user.role] ?? auth.user.role}
            </span>
          </div>
          <button
            onClick={auth.logout}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </Header>

      {/* Tab navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] sm:top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex gap-0.5 overflow-x-auto">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition -mb-px ${
                view === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {view === 'workers' && <WorkersPage user={auth.user} />}
        {view === 'seasonal' && <SeasonalWorkersPage user={auth.user} />}
        {view === 'settings' && canAdmin && <SettingsPage user={auth.user} />}
        {view === 'admin' && canAdmin && <AdminPage user={auth.user} />}

        {view === 'payroll' && !workbook && !pendingHeaders && (
          <>
            <div className="text-center max-w-2xl mx-auto pt-2 sm:pt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3 sm:mb-4">
                <Sparkles size={12} /> {t('hero.badge')}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">{t('hero.title')}</h1>
              <p className="text-slate-600 mt-3 text-sm sm:text-base px-2">{t('hero.desc')}</p>
            </div>
            <Uploader
              onFile={handleFile}
              loading={loading}
              onDownloadTemplate={() => downloadTemplate()}
              onOpenGuide={() => setHelpTab('guide')}
              onOpenFormula={() => setHelpTab('formula')}
            />
            {err && (
              <div className="card p-4 bg-rose-50/50 border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {err}
              </div>
            )}
          </>
        )}

        {view === 'payroll' && workbook && computed && (
          <>
            <Toolbar
              fileName={workbook.fileName}
              daysCount={workbook.daysFound.length}
              onReset={() => { setWorkbook(null); setErr(null) }}
              onExportDaily={() => exportDailyXlsx(computed.rows, `payroll-daily-${stamp()}.xlsx`)}
              onExportWorkers={() => exportWorkerSummaryXlsx(computed.workers, `payroll-workers-${stamp()}.xlsx`)}
              onExportBank={() => exportBankCsv(computed.workers, 'ALL', `bank-export-${stamp()}.csv`)}
            />

            {workbook.warnings.length > 0 && (
              <div className="card p-4 bg-amber-50/50 border-amber-200">
                <div className="flex items-start gap-2 text-amber-800 text-sm font-medium">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {t('warn.title')}
                </div>
                <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                  {workbook.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <PayrollBadges
              rows={computed.rows}
              workers={computed.workers}
              members={workbook.members}
              currencySymbol={config.currencySymbol}
              onOpenPendingWorkers={() => setView('workers')}
            />

            <StatCards summary={computed.summary} />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-slate-900">{t('summary')}</h2>
              <div className="flex gap-2">
                <button onClick={() => setHelpTab('formula')} className="btn-secondary text-xs">
                  {t('upload.formula')}
                </button>
                <button onClick={() => setShowConfig(!showConfig)} className="btn-secondary text-xs">
                  <Settings size={14} /> {t('cfg.title')}
                </button>
              </div>
            </div>

            {showConfig && (
              <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ConfigField label={t('cfg.dailyRate')} value={config.defaultDailyRate} onChange={v => setConfig({ ...config, defaultDailyRate: v })} />
                <ConfigField label={t('cfg.otMul')} value={config.otMultiplier} step={0.1} onChange={v => setConfig({ ...config, otMultiplier: v })} />
                <ConfigField label={t('cfg.lateBuf')} value={config.lateBufferMinutes} onChange={v => setConfig({ ...config, lateBufferMinutes: v })} />
                <ConfigField label={t('cfg.lateRound')} value={config.lateRoundingUnit} onChange={v => setConfig({ ...config, lateRoundingUnit: v })} />
              </div>
            )}

            <WorkerTable workers={computed.workers} onSelect={setSelected} />
          </>
        )}

        <footer className="text-center text-xs text-slate-400 pt-6 pb-4">
          {t('footer')} · {new Date().getFullYear()}
        </footer>
      </main>

      {selected && <WorkerDetail worker={selected} onClose={() => setSelected(null)} />}
      {pendingHeaders && (
        <MappingDialog
          headers={pendingHeaders.headers}
          initialMapping={pendingHeaders.mapping}
          onSave={applyMapping}
          onCancel={() => { setPendingHeaders(null); setPendingBuffer(null) }}
        />
      )}
      {helpTab && <HelpPanel tab={helpTab} onClose={() => setHelpTab(null)} />}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  )
}

function ConfigField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 tabular-nums"
      />
    </label>
  )
}

function stamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
}

export default App
