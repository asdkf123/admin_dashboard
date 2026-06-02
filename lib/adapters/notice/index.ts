import type { NoticeAdapter } from './types'
import { mockNoticeAdapter } from './mock'
import { prismaNoticeAdapter } from './prisma'

/**
 * 기본은 Prisma 기반 (우리 Postgres에 저장).
 * 환경변수로 인메모리(mock-memory)나 사내 CMS 등으로 전환.
 */
function resolveNoticeAdapter(): NoticeAdapter {
  const impl = process.env.ADAPTER_NOTICE ?? 'prisma'
  switch (impl) {
    case 'prisma':
    case 'mock':
      return prismaNoticeAdapter
    case 'mock-memory':
      return mockNoticeAdapter
    // case 'company-cms': return companyCmsNoticeAdapter
    default:
      console.warn(`Unknown ADAPTER_NOTICE=${impl}, falling back to prisma`)
      return prismaNoticeAdapter
  }
}

export const noticeAdapter = resolveNoticeAdapter()
export type { NoticeAdapter, Notice, NoticeType, NoticeQuery } from './types'
export { NOTICE_TYPE_LABEL } from './types'
