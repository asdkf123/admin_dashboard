import type { Notice, NoticeAdapter, NoticeQuery } from './types'

/**
 * 인메모리 mock. 프로세스 재시작 시 초기 시드로 리셋.
 * 운영 전환 시 사내 CMS API를 가리키는 구현체로 교체.
 *
 * 추후 DB 기반으로 옮기려면 prisma에 Notice 모델 추가 후 PrismaNoticeAdapter로 교체.
 */

const seed: Notice[] = [
  {
    id: 'n-001',
    type: 'maintenance',
    title: '6/15 새벽 2-4시 정기점검 — 서비스 일시 중단',
    body: '시스템 안정성 향상을 위한 정기점검이 진행됩니다. 점검 시간 동안 로그인 및 대시보드 접근이 제한됩니다.',
    publishedAt: new Date('2026-05-20T09:00:00Z'),
    pinned: true,
  },
  {
    id: 'n-002',
    type: 'feature',
    title: '월간 운영 리포트 PDF 자동 발송 기능 추가',
    body: '매월 1일 전월 운영 현황 리포트가 등록된 이메일로 자동 발송됩니다. 마이페이지에서 수신 여부를 설정할 수 있습니다.',
    publishedAt: new Date('2026-05-15T09:00:00Z'),
    pinned: false,
  },
]

let store = seed.slice()

export const mockNoticeAdapter: NoticeAdapter = {
  canMutate: true,

  async listRecent(limit = 5): Promise<Notice[]> {
    return store
      .slice()
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.publishedAt.getTime() - a.publishedAt.getTime()
      })
      .slice(0, limit)
  },

  async list(query: NoticeQuery = {}) {
    let items = store.slice()
    if (query.type) items = items.filter(n => n.type === query.type)
    if (query.pinned !== undefined) items = items.filter(n => n.pinned === query.pinned)
    items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.publishedAt.getTime() - a.publishedAt.getTime()
    })
    const total = items.length
    const offset = query.offset ?? 0
    const limit = query.limit ?? 50
    return { items: items.slice(offset, offset + limit), total }
  },

  async get(id) {
    return store.find(n => n.id === id) ?? null
  },

  async create(data) {
    const notice: Notice = { id: `n-${Date.now().toString(36)}`, ...data }
    store = [notice, ...store]
    return notice
  },

  async update(id, data) {
    const idx = store.findIndex(n => n.id === id)
    if (idx === -1) throw new Error(`Notice not found: ${id}`)
    const updated = { ...store[idx], ...data }
    store = [...store.slice(0, idx), updated, ...store.slice(idx + 1)]
    return updated
  },

  async delete(id) {
    store = store.filter(n => n.id !== id)
  },
}
