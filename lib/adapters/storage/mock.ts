import type { StorageAdapter, StoredFile, UploadRequest } from './types'

/**
 * 메모리 기반 mock. 프로세스 재시작 시 사라짐.
 * 운영 전환 시 local-fs / nas / s3 구현체로 교체.
 */
const store = new Map<string, StoredFile & { data: Uint8Array }>()

export const mockStorageAdapter: StorageAdapter = {
  async upload(req: UploadRequest): Promise<StoredFile> {
    const key = crypto.randomUUID()
    const data = req.data instanceof Buffer ? new Uint8Array(req.data) : req.data
    const stored: StoredFile & { data: Uint8Array } = {
      key,
      filename: req.filename,
      mimeType: req.mimeType,
      size: data.byteLength,
      uploadedAt: new Date(),
      url: `/api/storage/${key}`,
      data,
    }
    store.set(key, stored)
    return toMeta(stored)
  },

  async get(key: string): Promise<StoredFile | null> {
    const entry = store.get(key)
    if (!entry) return null
    return toMeta(entry)
  },

  async delete(key: string): Promise<void> {
    store.delete(key)
  },
}

function toMeta(entry: StoredFile & { data: Uint8Array }): StoredFile {
  return {
    key: entry.key,
    filename: entry.filename,
    mimeType: entry.mimeType,
    size: entry.size,
    uploadedAt: entry.uploadedAt,
    url: entry.url,
  }
}
