/**
 * 공지사항 어댑터.
 *
 * SoT 전략:
 *   - 개발/임시: mock (우리 Postgres) — 어드민에서 CRUD 가능
 *   - 운영: 사내 CMS API — 우리 admin은 read-only listing
 *
 * mock 구현체는 create/update/delete를 노출하지만, 운영 어댑터는
 * 인터페이스 차원에서 빠질 수 있다. 호출부는 try/catch 또는 capability flag로 처리.
 */

export type NoticeType = 'maintenance' | 'feature' | 'announcement' | 'security' | 'event'

export interface Notice {
  id: string
  type: NoticeType
  title: string
  body?: string
  publishedAt: Date
  pinned: boolean
}

export interface NoticeQuery {
  type?: NoticeType
  pinned?: boolean
  limit?: number
  offset?: number
}

export interface NoticeAdapter {
  listRecent(limit?: number): Promise<Notice[]>
  list(query?: NoticeQuery): Promise<{ items: Notice[]; total: number }>
  get(id: string): Promise<Notice | null>
  /** mock에서만 사용. 운영 어댑터는 read-only일 수 있음 — 호출 전 capability 체크 권장. */
  create?(data: Omit<Notice, 'id'>): Promise<Notice>
  update?(id: string, data: Partial<Omit<Notice, 'id'>>): Promise<Notice>
  delete?(id: string): Promise<void>
  /** 이 어댑터가 CRUD를 지원하는지. 운영 CMS 어댑터에서는 false. */
  readonly canMutate: boolean
}

/** UI에 노출할 한글 라벨 매핑 */
export const NOTICE_TYPE_LABEL: Record<NoticeType, string> = {
  maintenance: '점검',
  feature: '신규',
  announcement: '공지',
  security: '보안',
  event: '이벤트',
}
