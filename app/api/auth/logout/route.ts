import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revokeSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { getCurrentUser } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUser()

  if (token) {
    await revokeSession(token)
  }
  if (user) {
    await recordAudit({
      userId: user.id,
      action: 'logout',
      resourceType: 'User',
      resourceId: user.id,
    })
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
