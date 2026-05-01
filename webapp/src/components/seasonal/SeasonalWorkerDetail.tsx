import { useState } from 'react'
import { X, Loader2, ChevronLeft, ChevronRight, Edit2, Clock, CreditCard, CalendarDays } from 'lucide-react'
import { useWorkerPayments, useWorkerAttendance } from '../../api/useSeasonal'
import type { Worker } from '../../api/useWorkers'

interface Props {
  worker: Worker
  country: string
  onClose: () => void
  onEdit: () => void
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    resigned: 'bg-slate-100 text-slate-600',
    suspended: 'bg-amber-100 text-amber-700',
    pending: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    open: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

function ProfileTab({ worker }: { worker: Worker }) {
  const rows = [
    { label: 'Code', value: worker.code },
    { label: 'Name (Thai)', value: worker.name_local },
    { label: 'Name (EN)', value: worker.name_en },
    { label: 'Department', value: worker.department_code },
    { label: 'Shift', value: worker.shift_code },
    { label: 'Start Date', value: worker.start_date },
    { label: 'End Date', value: worker.end_date },
    { label: 'Phone', value: worker.phone },
    { label: 'Bank', value: worker.bank_code ? `${worker.bank_code} ${worker.bank_account ?? ''}`.trim() : null },
  ]

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map(r => (
          <div key={r.label}>
            <dt className="text-xs text-slate-500">{r.label}</dt>
            <dd className="text-sm font-medium text-slate-900 mt-0.5">{r.value ?? '—'}</dd>
          </div>
        ))}
      </dl>

      {worker.notes && (
        <div className="mt-3">
          <div className="text-xs text-slate-500 mb-1">Notes / Status History</div>
          <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed border border-slate-100">
            {worker.notes}
          </pre>
        </div>
      )}
    </div>
  )
}

function PaymentsTab({ workerId, country }: { workerId: string; country: string }) {
  const { payments, loading } = useWorkerPayments(workerId, country)

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
  if (payments.length === 0) return <p className="text-sm text-slate-500 text-center py-8">No payment history found.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
            <th className="py-2 pr-3 text-left">Period</th>
            <th className="py-2 px-2 text-right">Shifts</th>
            <th className="py-2 px-2 text-right">Gross</th>
            <th className="py-2 px-2 text-right">Net Pay</th>
            <th className="py-2 pl-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {payments.map(p => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="py-2 pr-3 text-slate-900 font-medium">{p.payroll_periods?.name ?? '—'}</td>
              <td className="py-2 px-2 text-right tabular-nums text-slate-600">{p.shifts}</td>
              <td className="py-2 px-2 text-right tabular-nums text-slate-700">฿{p.total_gross_thb.toLocaleString()}</td>
              <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-900">฿{p.net_pay_thb.toLocaleString()}</td>
              <td className="py-2 pl-2"><StatusBadge status={p.payroll_periods?.status ?? ''} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AttendanceTab({ workerId, country }: { workerId: string; country: string }) {
  const { records, total, loading, page, setPage } = useWorkerAttendance(workerId, country)
  const limit = 30

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
  if (records.length === 0) return <p className="text-sm text-slate-500 text-center py-8">No attendance records found.</p>

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="py-2 pr-3 text-left">Date</th>
              <th className="py-2 px-2 text-left">Check In</th>
              <th className="py-2 px-2 text-left">Check Out</th>
              <th className="py-2 px-2 text-right">OT</th>
              <th className="py-2 pl-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-2 pr-3 font-medium text-slate-900">{r.work_date}</td>
                <td className="py-2 px-2 tabular-nums text-slate-600">{r.checkin ?? '—'}</td>
                <td className="py-2 px-2 tabular-nums text-slate-600">{r.checkout ?? '—'}</td>
                <td className="py-2 px-2 text-right tabular-nums text-slate-600">
                  {(r.ot_before_hours + r.ot_after_hours) > 0
                    ? `+${(r.ot_before_hours + r.ot_after_hours).toFixed(1)}h`
                    : '—'}
                </td>
                <td className="py-2 pl-2"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>{total} records</span>
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40"><ChevronLeft size={13} /></button>
          <span>{page} / {Math.ceil(total / limit) || 1}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40"><ChevronRight size={13} /></button>
        </div>
      </div>
    </div>
  )
}

type DetailTab = 'profile' | 'payments' | 'attendance'

export default function SeasonalWorkerDetail({ worker, country, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<DetailTab>('profile')

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <CalendarDays size={13} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={13} /> },
    { id: 'attendance', label: 'Attendance', icon: <Clock size={13} /> },
  ]

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-slate-500">{worker.code}</span>
                <StatusBadge status={worker.status} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{worker.name_local}</h2>
              {worker.name_en && <p className="text-sm text-slate-500">{worker.name_en}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} className="btn-secondary text-xs gap-1.5"><Edit2 size={13} /> Edit</button>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-0 border-b border-slate-100 px-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'profile' && <ProfileTab worker={worker} />}
          {tab === 'payments' && <PaymentsTab workerId={worker.id} country={country} />}
          {tab === 'attendance' && <AttendanceTab workerId={worker.id} country={country} />}
        </div>
      </div>
    </div>
  )
}
