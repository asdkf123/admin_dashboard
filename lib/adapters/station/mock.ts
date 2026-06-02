import type {
  StationAdapter,
  ChargingStation,
  Charger,
  StationQuery,
} from './types'

const MOCK_STATIONS: ChargingStation[] = [
  { id: 'CS001', name: '강남 충전소', address: '서울 강남구 테헤란로 152', businessNo: '1234567890', ownerName: '(주)강남파트너', contactPhone: '010-1111-1111', installedAt: '2023-04-12', status: 'active', chargerCount: 4 },
  { id: 'CS023', name: '신촌 충전소', address: '서울 서대문구 연세로 50', businessNo: '2234567890', ownerName: '신촌상사', contactPhone: '010-2222-2222', installedAt: '2023-08-01', status: 'maintenance', chargerCount: 3 },
  { id: 'CS047', name: '홍대 충전소', address: '서울 마포구 와우산로 94', businessNo: '3234567890', ownerName: '홍대모빌리티', contactPhone: '010-3333-3333', installedAt: '2024-01-15', status: 'fault', chargerCount: 6 },
  { id: 'CS089', name: '잠실 충전소', address: '서울 송파구 올림픽로 240', businessNo: '4234567890', ownerName: '잠실에너지', contactPhone: '010-4444-4444', installedAt: '2022-11-22', status: 'maintenance', chargerCount: 4 },
  { id: 'CS112', name: '판교 충전소', address: '경기 성남시 분당구 판교역로 235', businessNo: '5234567890', ownerName: '판교플랫폼', contactPhone: '010-5555-5555', installedAt: '2024-03-10', status: 'active', chargerCount: 8 },
  { id: 'CS128', name: '서초 충전소', address: '서울 서초구 강남대로 373', businessNo: '1234567890', ownerName: '(주)강남파트너', contactPhone: '010-1111-1111', installedAt: '2024-06-01', status: 'active', chargerCount: 2 },
]

export const mockStationAdapter: StationAdapter = {
  async listStations(q: StationQuery) {
    let items = MOCK_STATIONS.slice()
    if (q.ownerBusinessNo) {
      items = items.filter(s => s.businessNo === q.ownerBusinessNo)
    }
    if (q.ids?.length) {
      const ids = new Set(q.ids)
      items = items.filter(s => ids.has(s.id))
    }
    if (q.status) {
      items = items.filter(s => s.status === q.status)
    }
    if (q.search) {
      const k = q.search.toLowerCase()
      items = items.filter(s =>
        s.name.toLowerCase().includes(k) || s.id.toLowerCase().includes(k),
      )
    }
    const total = items.length
    const offset = q.offset ?? 0
    const limit = q.limit ?? 50
    return { items: items.slice(offset, offset + limit), total }
  },

  async getStation(id) {
    return MOCK_STATIONS.find(s => s.id === id) ?? null
  },

  async findStationsByBusinessNo(businessNo) {
    return MOCK_STATIONS.filter(s => s.businessNo === businessNo)
  },

  async listChargers(stationId): Promise<Charger[]> {
    const station = MOCK_STATIONS.find(s => s.id === stationId)
    if (!station) return []
    return Array.from({ length: station.chargerCount }, (_, i) => ({
      id: `${stationId}-${i + 1}`,
      stationId,
      serial: `SN-${stationId}-${(i + 1).toString().padStart(3, '0')}`,
      type: i % 2 === 0 ? 'fast' : 'slow',
      capacity: i % 2 === 0 ? 100 : 7,
      status: 'normal',
      firmwareVersion: '1.4.2',
      lastSeenAt: new Date(),
    }))
  },
}
