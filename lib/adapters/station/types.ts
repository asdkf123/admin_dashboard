/**
 * 충전소 데이터 어댑터.
 * 17,000 충전소 데이터는 결국 회사 DB API에서 가져온다. 지금은 mock seed.
 */

export interface ChargingStation {
  id: string                  // 충전소 ID
  name: string                // 충전소명
  address: string
  businessNo?: string         // 소유주 사업자번호
  ownerName?: string          // 소유주명/상호
  contactPhone?: string
  installedAt?: string        // 'YYYY-MM-DD'
  status: 'active' | 'inactive' | 'maintenance' | 'fault'
  chargerCount: number
}

export interface Charger {
  id: string
  stationId: string
  serial: string
  type: 'fast' | 'slow'       // 급속/완속
  capacity: number            // kW
  status: 'normal' | 'fault' | 'maintenance' | 'offline'
  firmwareVersion?: string
  lastSeenAt?: Date
}

export interface StationQuery {
  ownerBusinessNo?: string
  ids?: string[]
  status?: ChargingStation['status']
  search?: string
  limit?: number
  offset?: number
}

export interface StationAdapter {
  listStations(q: StationQuery): Promise<{ items: ChargingStation[]; total: number }>
  getStation(id: string): Promise<ChargingStation | null>
  /** 사업자번호로 해당 파트너 소유의 충전소 후보 조회 — 가입 시 자동매칭에 사용 */
  findStationsByBusinessNo(businessNo: string): Promise<ChargingStation[]>
  listChargers(stationId: string): Promise<Charger[]>
}
