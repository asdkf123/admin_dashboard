/**
 * 파일 스토리지 어댑터 — 증빙·계약서·리포트 등.
 * 개발: 로컬 파일시스템(또는 메모리). 운영: 사내 NAS 또는 S3.
 */

export interface StoredFile {
  key: string                  // 식별자 (UUID 등)
  filename: string
  mimeType: string
  size: number
  uploadedAt: Date
  url: string                  // 다운로드 URL
}

export interface UploadRequest {
  filename: string
  mimeType: string
  data: Buffer | Uint8Array
  uploadedBy?: string
}

export interface StorageAdapter {
  upload(req: UploadRequest): Promise<StoredFile>
  get(key: string): Promise<StoredFile | null>
  delete(key: string): Promise<void>
}
