import type {
  AuthAdapter,
  IdentityRequest,
  IdentityResult,
  BusinessInfo,
  BusinessInfoRequest,
} from './types'

/**
 * 개발용 Mock. 항상 성공. NICE 연동 전까지 가입 흐름 검증에 사용.
 */
export const mockAuthAdapter: AuthAdapter = {
  async verifyIdentity(req: IdentityRequest): Promise<IdentityResult> {
    return {
      success: true,
      ci: `mock-ci-${hash(req.name + req.phone)}`,
      di: `mock-di-${hash(req.phone)}`,
      verifiedAt: new Date(),
    }
  },

  async verifyBusinessNo(req: BusinessInfoRequest): Promise<BusinessInfo> {
    const cleaned = req.businessNo.replace(/[^0-9]/g, '')
    return {
      valid: cleaned.length === 10,
      businessNo: cleaned,
      companyName: '(주)차지비 파트너',
      representativeName: '홍길동',
      status: 'active',
      openedAt: '2020-01-01',
    }
  },
}

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}
