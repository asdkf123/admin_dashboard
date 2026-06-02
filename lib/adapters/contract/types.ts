/**
 * 계약 어댑터 — 사내 Salesforce 시스템과 동기화 예정.
 * 현재는 mock. 운영에서는 read-only 일 수도 (Salesforce가 source-of-truth).
 */

export type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending'

export interface Contract {
  id: string
  stationId: string
  partyBusinessNo: string
  partyName: string
  startDate: string             // 'YYYY-MM-DD'
  endDate: string
  autoRenew: boolean
  revenueShareRate: number      // 0.0 ~ 1.0
  monthlyRent?: number          // 원
  settlementCycle: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  status: ContractStatus
  documentUrl?: string
  notes?: string
}

export interface ContractQuery {
  stationId?: string
  businessNo?: string
  status?: ContractStatus
  expiringWithinDays?: number   // 만료 D-N 이내 필터
}

export interface ContractAdapter {
  listContracts(q: ContractQuery): Promise<Contract[]>
  getContract(id: string): Promise<Contract | null>
  /** 충전소 단위 계약 이력 (최신순) */
  getContractsByStation(stationId: string): Promise<Contract[]>
}
