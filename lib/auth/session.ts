import { randomBytes, createHash } from 'node:crypto'
import { prisma } from '@/lib/adapters/db'
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from './constants'

export { SESSION_COOKIE_NAME }

/**
 * 세션 토큰 발급 + DB에 hash 저장.
 * 반환되는 raw token은 쿠키에 저장 (DB에는 hash만 저장 → DB 유출 시 세션 탈취 방지).
 */
export async function createSession(opts: {
  userId: string
  ipAddress: string
  userAgent: string
}): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({
    data: {
      userId: opts.userId,
      tokenHash,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

/**
 * 쿠키의 raw token으로 세션 검증. 활성 세션 + user 정보 반환.
 */
export async function verifySession(token: string) {
  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt < new Date()) return null

  // last_active_at 갱신 (every-request 부담 줄이려면 throttle 가능)
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  })

  return { session, user: session.user }
}

/** 단일 세션 revoke (로그아웃) */
export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token)
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/** 사용자의 모든 세션 revoke — 비번 변경·관리자 강제로그아웃에 사용 */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
