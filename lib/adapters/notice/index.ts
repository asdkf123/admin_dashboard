import type { NoticeAdapter } from './types'
import { mockNoticeAdapter } from './mock'

function resolveNoticeAdapter(): NoticeAdapter {
  const impl = process.env.ADAPTER_NOTICE ?? 'mock'
  switch (impl) {
    case 'mock':
      return mockNoticeAdapter
    // case 'company-cms': return companyCmsNoticeAdapter  // 운영 시 추가
    default:
      console.warn(`Unknown ADAPTER_NOTICE=${impl}, falling back to mock`)
      return mockNoticeAdapter
  }
}

export const noticeAdapter = resolveNoticeAdapter()
export type { NoticeAdapter, Notice, NoticeType, NoticeQuery } from './types'
export { NOTICE_TYPE_LABEL } from './types'
