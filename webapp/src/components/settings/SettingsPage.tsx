import { useState } from 'react'
import { DollarSign, Clock, Warehouse, Scale } from 'lucide-react'
import type { AuthUser } from '../../auth/useAuth'
import RateConfigsTab from './tabs/RateConfigsTab'
import ShiftsTab from './tabs/ShiftsTab'
import WarehousesTab from './tabs/WarehousesTab'
import LegalLimitsTab from './tabs/LegalLimitsTab'

interface Props {
  user: AuthUser
}

type SettingsTab = 'rates' | 'shifts' | 'warehouses' | 'legal'

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'rates', label: 'Rate & Pay', icon: <DollarSign size={14} /> },
  { id: 'shifts', label: 'Shifts & Depts', icon: <Clock size={14} /> },
  { id: 'warehouses', label: 'Warehouses', icon: <Warehouse size={14} /> },
  { id: 'legal', label: 'Legal Limits', icon: <Scale size={14} /> },
]

export default function SettingsPage({ user }: Props) {
  const [tab, setTab] = useState<SettingsTab>('rates')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage system configuration and reference data</p>
      </div>

      <div className="flex gap-0 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
              tab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="pt-1">
        {tab === 'rates' && <RateConfigsTab user={user} />}
        {tab === 'shifts' && <ShiftsTab user={user} />}
        {tab === 'warehouses' && <WarehousesTab user={user} />}
        {tab === 'legal' && <LegalLimitsTab user={user} />}
      </div>
    </div>
  )
}
