import type { ContractAdapter } from './types'
import { mockContractAdapter } from './mock'

function resolveContractAdapter(): ContractAdapter {
  const impl = process.env.ADAPTER_CONTRACT ?? 'mock'
  switch (impl) {
    case 'mock':
      return mockContractAdapter
    // case 'salesforce':
    //   return salesforceContractAdapter
    default:
      console.warn(`Unknown ADAPTER_CONTRACT=${impl}, falling back to mock`)
      return mockContractAdapter
  }
}

export const contractAdapter = resolveContractAdapter()
export type { ContractAdapter, Contract, ContractStatus, ContractQuery } from './types'
