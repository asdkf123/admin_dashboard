import type { StationAdapter } from './types'
import { mockStationAdapter } from './mock'

function resolveStationAdapter(): StationAdapter {
  const impl = process.env.ADAPTER_STATION ?? 'mock'
  switch (impl) {
    case 'mock':
      return mockStationAdapter
    // case 'company-api':
    //   return companyStationAdapter
    default:
      console.warn(`Unknown ADAPTER_STATION=${impl}, falling back to mock`)
      return mockStationAdapter
  }
}

export const stationAdapter = resolveStationAdapter()
export type { StationAdapter, ChargingStation, Charger, StationQuery } from './types'
