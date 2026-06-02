import type { ContractAdapter, Contract, ContractQuery } from './types'

const MOCK_CONTRACTS: Contract[] = [
  { id: 'CT-001', stationId: 'CS001', partyBusinessNo: '1234567890', partyName: '(주)강남파트너', startDate: '2023-04-01', endDate: '2026-03-31', autoRenew: true, revenueShareRate: 0.14, settlementCycle: 'monthly', status: 'active' },
  { id: 'CT-002', stationId: 'CS023', partyBusinessNo: '2234567890', partyName: '신촌상사', startDate: '2023-08-01', endDate: '2026-07-31', autoRenew: false, revenueShareRate: 0.12, monthlyRent: 800000, settlementCycle: 'monthly', status: 'active' },
  { id: 'CT-003', stationId: 'CS047', partyBusinessNo: '3234567890', partyName: '홍대모빌리티', startDate: '2024-01-01', endDate: '2026-06-30', autoRenew: true, revenueShareRate: 0.15, settlementCycle: 'monthly', status: 'active' },
]

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export const mockContractAdapter: ContractAdapter = {
  async listContracts(q: ContractQuery) {
    let items = MOCK_CONTRACTS.slice()
    if (q.stationId) items = items.filter(c => c.stationId === q.stationId)
    if (q.businessNo) items = items.filter(c => c.partyBusinessNo === q.businessNo)
    if (q.status) items = items.filter(c => c.status === q.status)
    if (q.expiringWithinDays !== undefined) {
      const n = q.expiringWithinDays
      items = items.filter(c => {
        const d = daysUntil(c.endDate)
        return d >= 0 && d <= n
      })
    }
    return items
  },
  async getContract(id) {
    return MOCK_CONTRACTS.find(c => c.id === id) ?? null
  },
  async getContractsByStation(stationId) {
    return MOCK_CONTRACTS
      .filter(c => c.stationId === stationId)
      .sort((a, b) => b.endDate.localeCompare(a.endDate))
  },
}
