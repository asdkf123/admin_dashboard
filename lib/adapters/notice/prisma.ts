import { prisma } from '@/lib/adapters/db'
import type { Notice, NoticeAdapter, NoticeQuery } from './types'

/**
 * Prisma 기반 NoticeAdapter — 우리 Postgres에 저장.
 * 운영 전환 시 사내 CMS 어댑터로 교체.
 */
export const prismaNoticeAdapter: NoticeAdapter = {
  canMutate: true,

  async listRecent(limit = 5) {
    const items = await prisma.notice.findMany({
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    })
    return items.map(toDto)
  },

  async list(query: NoticeQuery = {}) {
    const where: Record<string, unknown> = {}
    if (query.type) where.kind = query.type
    if (query.pinned !== undefined) where.pinned = query.pinned

    const [items, total] = await Promise.all([
      prisma.notice.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      prisma.notice.count({ where }),
    ])
    return { items: items.map(toDto), total }
  },

  async get(id) {
    const row = await prisma.notice.findUnique({ where: { id } })
    return row ? toDto(row) : null
  },

  async create(data) {
    const row = await prisma.notice.create({
      data: {
        kind: data.type,
        title: data.title,
        body: data.body ?? null,
        publishedAt: data.publishedAt ?? new Date(),
        pinned: data.pinned,
      },
    })
    return toDto(row)
  },

  async update(id, data) {
    const row = await prisma.notice.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { kind: data.type }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body ?? null }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
      },
    })
    return toDto(row)
  },

  async delete(id) {
    await prisma.notice.delete({ where: { id } })
  },
}

type Row = {
  id: string
  kind: 'maintenance' | 'feature' | 'announcement' | 'security' | 'event'
  title: string
  body: string | null
  publishedAt: Date
  pinned: boolean
}

function toDto(row: Row): Notice {
  return {
    id: row.id,
    type: row.kind,
    title: row.title,
    body: row.body ?? undefined,
    publishedAt: row.publishedAt,
    pinned: row.pinned,
  }
}
