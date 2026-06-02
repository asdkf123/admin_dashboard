import type { StorageAdapter } from './types'
import { mockStorageAdapter } from './mock'

function resolveStorageAdapter(): StorageAdapter {
  const impl = process.env.ADAPTER_STORAGE ?? 'mock'
  switch (impl) {
    case 'mock':
      return mockStorageAdapter
    // case 'nas': return nasStorageAdapter
    // case 's3':  return s3StorageAdapter
    default:
      console.warn(`Unknown ADAPTER_STORAGE=${impl}, falling back to mock`)
      return mockStorageAdapter
  }
}

export const storageAdapter = resolveStorageAdapter()
export type { StorageAdapter, StoredFile, UploadRequest } from './types'
