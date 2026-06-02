/**
 * 본인인증 어댑터 — NICE/PASS 등 외부 본인인증 + 사업자번호 진위확인.
 */

export interface IdentityRequest {
  name: string
  phone: string
  birthDate: string  // 'YYYY-MM-DD'
}

export interface IdentityResult {
  success: boolean
  ci?: string          // 본인 식별값 (연계정보)
  di?: string          // 중복가입 확인값
  verifiedAt: Date
  failureReason?: string
}

export interface BusinessInfoRequest {
  businessNo: string   // '###-##-#####' 또는 숫자만
}

export interface BusinessInfo {
  valid: boolean
  businessNo: string
  companyName?: string
  representativeName?: string
  status?: 'active' | 'closed' | 'suspended'
  openedAt?: string
}

export interface AuthAdapter {
  verifyIdentity(req: IdentityRequest): Promise<IdentityResult>
  verifyBusinessNo(req: BusinessInfoRequest): Promise<BusinessInfo>
}
