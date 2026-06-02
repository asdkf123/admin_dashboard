import { prisma } from '@/lib/adapters/db'
import { getClientInfo } from '@/lib/auth/server'

/**
 * 감사 로그 기록 — 모든 write 작업에서 호출.
 * 운영 전환 시 별도 시스템(예: 사내 SIEM)으로 fanout 가능 — 어댑터로 분리할 수 있음.
 */
export async function recordAudit(opts: {
  userId: string | null
  action: string
  resourceType: string
  resourceId: string
  before?: unknown
  after?: unknown
}): Promise<void> {
  const { ipAddress, userAgent } = await getClientInfo()

  await prisma.auditLog.create({
    data: {
      userId: opts.userId,
      action: opts.action,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      before: (opts.before as object | undefined) ?? undefined,
      after: (opts.after as object | undefined) ?? undefined,
      ipAddress,
      userAgent,
    },
  })
}
