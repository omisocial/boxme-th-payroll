import { useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, ToggleLeft, ToggleRight, Eye } from 'lucide-react'
import { useSeasonal } from '../../api/useSeasonal'
import { useWarehouses } from '../../api/usePeriods'
import type { Worker } from '../../api/useWorkers'
import type { AuthUser } from '../../auth/useAuth'
import SeasonalWorkerModal from './SeasonalWorkerModal'
import SeasonalWorkerDetail from './SeasonalWorkerDetail'

interface Props {
  user: AuthUser
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    resigned: 'bg-slate-100 text-slate-600',
    suspended: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

interface ToggleConfirm {
  worker: Worker
  targetStatus: 'active' | 'resigned' | 'suspended'
}

export default function SeasonalWorkersPage({ user }: Props) {
  const country = user.country_scope === '*' ? 'TH' : user.country_scope
  const {
    workers, total, loading,
    q, setQ,
    status, setStatus,
    warehouseId, setWarehouseId,
    page, setPage,
    createWorker, updateWorker, toggleStatus,
  } = useSeasonal(country)
  const warehouses = useWarehouses(country)

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; worker: Partial<Worker> | null } | null>(null)
  const [detail, setDetail] = useState<Worker | null>(null)
  const [toggleConfirm, setToggleConfirm] = useState<ToggleConfirm | null>(null)
  const [toggling, setToggling] = useState(false)

  const canHr = ['super_admin', 'country_admin', 'hr'].includes(user.role)
  const limit = 50

  async function handleSave(data: Record<string, unknown>) {
    if (modal?.mode === 'create') return createWorker(data)
    if (modal?.worker?.id) return updateWorker(modal.worker.id, data)
    return { success: false, message: 'Unknown mode' }
  }

  async function handleToggle() {
    if (!toggleConfirm) return
    setToggling(true)
    await toggleStatus(toggleConfirm.worker, toggleConfirm.targetStatus, user.email)
    setToggling(false)
    setToggleConfirm(null)
    if (detail?.id === toggleConfirm.worker.id) setDetail(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Seasonal Workers</h2>
          <p className="text-xs text-slate-500 mt-0.5">Cộng tác viên thời vụ — {total} records</p>
        </div>
        {canHr && (
          <button className="btn-primary text-sm" onClick={() => setModal({ mode: 'create', worker: null })}>
            <Plus size={14} /> Add Seasonal Worker
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8 w-56 text-sm"
            placeholder="Search name / code..."
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="active">Active</option>
          <option value="resigned">Resigned</option>
          <option value="suspended">Suspended</option>
          <option value="all">All Status</option>
        </select>
        {warehouses.length > 0 && (
          <select className="input text-sm" value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1) }}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}

      {!loading && workers.length === 0 && (
        <div className="card p-10 text-center text-slate-500 text-sm">
          No seasonal workers found.
        </div>
      )}

      {workers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Dept / Shift</th>
                  <th className="px-4 py-3 text-left">Contract</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map(w => (
                  <tr
                    key={w.id}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setDetail(w)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{w.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{w.name_local}</div>
                      {w.name_en && <div className="text-xs text-slate-400">{w.name_en}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <div>{w.department_code ?? '—'}</div>
                      {w.shift_code && <div className="text-slate-400">{w.shift_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{w.start_date ?? '—'}</div>
                      {w.end_date && <div className="text-slate-400">→ {w.end_date}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                          title="View details"
                          onClick={() => setDetail(w)}
                        >
                          <Eye size={13} />
                        </button>
                        {canHr && (
                          <button
                            className={`p-1.5 rounded-lg transition ${w.status === 'active' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={w.status === 'active' ? 'Deactivate' : 'Activate'}
                            onClick={() => setToggleConfirm({
                              worker: w,
                              targetStatus: w.status === 'active' ? 'resigned' : 'active',
                            })}
                          >
                            {w.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{total} workers</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span>Page {page} of {Math.ceil(total / limit) || 1}</span>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker detail slide-in */}
      {detail && (
        <SeasonalWorkerDetail
          worker={detail}
          country={country}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setModal({ mode: 'edit', worker: detail })
            setDetail(null)
          }}
        />
      )}

      {/* Add/Edit modal */}
      {modal && (
        <SeasonalWorkerModal
          worker={modal.mode === 'edit' ? modal.worker : null}
          country={country}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Toggle status confirm */}
      {toggleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              {toggleConfirm.targetStatus === 'active' ? 'Activate Worker?' : 'Deactivate Worker?'}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Change <strong>{toggleConfirm.worker.name_local}</strong> from{' '}
              <strong>{toggleConfirm.worker.status}</strong> to{' '}
              <strong>{toggleConfirm.targetStatus}</strong>? This will be logged in the worker's notes.
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setToggleConfirm(null)}>Cancel</button>
              <button
                disabled={toggling}
                className={`flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                  toggleConfirm.targetStatus === 'active'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
                onClick={handleToggle}
              >
                {toggling ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
