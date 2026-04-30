import type { Member, PayrollResult, PeriodSummary, WorkerSummary } from './types'

export function summarizePeriod(rows: PayrollResult[]): PeriodSummary {
  const workers = new Set<string>()
  const days = new Set<string>()
  let gross = 0, ot = 0, late = 0, early = 0, damage = 0
  for (const r of rows) {
    workers.add(r.fullName)
    days.add(r.workDate)
    gross += r.grossWageThb
    ot += r.otPayThb
    late += r.lateDeductionThb
    early += r.earlyOutDeductionThb
    damage += r.damageThb
  }
  return {
    totalDays: days.size,
    totalWorkers: workers.size,
    totalShifts: rows.length,
    totalGrossThb: round2(gross),
    totalOtThb: round2(ot),
    totalLateThb: round2(late),
    totalEarlyOutThb: round2(early),
    totalDamageThb: round2(damage),
  }
}

export function summarizeWorkers(
  rows: PayrollResult[],
  members: Member[]
): WorkerSummary[] {
  const memberByName = new Map<string, Member>()
  for (const m of members) memberByName.set(m.fullName, m)

  const groups = new Map<string, WorkerSummary>()
  for (const r of rows) {
    const key = r.fullName
    let g = groups.get(key)
    if (!g) {
      const m = memberByName.get(key)
      g = {
        fullName: r.fullName,
        nickname: r.nickname || m?.nickname,
        bankAccount: m?.bankAccount,
        bankCode: m?.bankCode,
        department: m?.department || r.note,
        shifts: 0,
        totalGross: 0,
        totalOt: 0,
        totalLate: 0,
        totalEarlyOut: 0,
        totalDamage: 0,
        rows: [],
      }
      groups.set(key, g)
    }
    g.shifts += 1
    g.totalGross += r.grossWageThb
    g.totalOt += r.otPayThb
    g.totalLate += r.lateDeductionThb
    g.totalEarlyOut += r.earlyOutDeductionThb
    g.totalDamage += r.damageThb
    g.rows.push(r)
  }

  for (const g of groups.values()) {
    g.totalGross = round2(g.totalGross)
    g.totalOt = round2(g.totalOt)
    g.totalLate = round2(g.totalLate)
    g.totalEarlyOut = round2(g.totalEarlyOut)
    g.totalDamage = round2(g.totalDamage)
  }

  return Array.from(groups.values()).sort((a, b) => b.totalGross - a.totalGross)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
