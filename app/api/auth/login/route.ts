import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/adapters/db'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { getClientInfo } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 1000 * 60 * 30  // 30분

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // 사용자 미존재 시에도 동일한 응답시간/메시지 — 타이밍 공격 방지
    if (!user) {
      // 가짜 비교로 시간 맞추기
      await verifyPassword(password, 'dummy:00')
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    // 계정 잠금 체크
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `계정이 일시 잠금 상태입니다. ${minutesLeft}분 후 다시 시도해주세요.` },
        { status: 423 },
      )
    }

    const passwordOk = await verifyPassword(password, user.passwordHash)

    if (!passwordOk) {
      const failed = user.failedLoginCount + 1
      const shouldLock = failed >= MAX_FAILED_ATTEMPTS
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : failed,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
        },
      })
      await recordAudit({
        userId: user.id,
        action: shouldLock ? 'login.failed_locked' : 'login.failed',
        resourceType: 'User',
        resourceId: user.id,
      })
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 },
      )
    }

    // 성공 → 세션 발급, 실패 카운트 리셋
    const { ipAddress, userAgent } = await getClientInfo()
    const { token, expiresAt } = await createSession({ userId: user.id, ipAddress, userAgent })

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    await recordAudit({
      userId: user.id,
      action: 'login.success',
      resourceType: 'User',
      resourceId: user.id,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    })
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
