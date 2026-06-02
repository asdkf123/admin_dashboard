import type { AuthAdapter } from './types'
import { mockAuthAdapter } from './mock'

/**
 * 본인인증 어댑터 진입점.
 * 환경에 따라 구현체 선택. NICE 연동되면 여기에 분기 추가.
 */
function resolveAuthAdapter(): AuthAdapter {
  const impl = process.env.ADAPTER_AUTH ?? 'mock'
  switch (impl) {
    case 'mock':
      return mockAuthAdapter
    // case 'nice':
    //   return niceAuthAdapter  // 추후 추가
    default:
      console.warn(`Unknown ADAPTER_AUTH=${impl}, falling back to mock`)
      return mockAuthAdapter
  }
}

export const authAdapter = resolveAuthAdapter()
export type { AuthAdapter, IdentityRequest, IdentityResult, BusinessInfo } from './types'
