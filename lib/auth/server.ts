import { cookies, headers } from 'next/headers'
import { SESSION_COOKIE_NAME, verifySession } from './session'
import type { User } from '@prisma/client'

/**
 * 서버 컴포넌트 / API 라우트에서 현재 사용자 조회.
 * 세션 없거나 만료되면 null.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const result = await verifySession(token)
  return result?.user ?? null
}

/**
 * 보호 라우트 — 비로그인이면 throw. API 라우트에서 사용.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user
}

/**
 * 시스템 권한 검증.
 */
export async function requireRole(
  ...roles: Array<User['role']>
): Promise<User> {
  const user = await requireUser()
  if (!roles.includes(user.role)) throw new ForbiddenError()
  return user
}

/**
 * 클라이언트 정보 추출 — AuditLog/Session 기록용.
 */
export async function getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
  const h = await headers()
  const ipAddress =
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown'
  const userAgent = h.get('user-agent') ?? 'unknown'
  return { ipAddress, userAgent }
}

// ─── 에러 타입 ──────────────────────────────────────────────────────

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden')
    this.name = 'ForbiddenError'
  }
}
