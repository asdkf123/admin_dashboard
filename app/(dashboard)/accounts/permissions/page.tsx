import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ForbiddenCard } from '@/components/layout/forbidden-card'
import { getCurrentUser } from '@/lib/auth/server'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/adapters/db'
import { AccountsPermissionsClient } from './accounts-permissions-client'

export default async function PermissionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasPermission(user, 'manage:accounts'))) {
    return <ForbiddenCard title="계정별 권한 관리" permission="manage:accounts" />
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: {
          accounts: true,
          sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
        },
      },
      extraPermissions: { select: { permission: true } },
    },
  })

  const dto = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    businessNo: u.businessNo,
    role: u.role,
    lockedUntil: u.lockedUntil?.toISOString() ?? null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    mustChangePassword: u.mustChangePassword,
    failedLoginCount: u.failedLoginCount,
    accountCount: u._count.accounts,
    activeSessionCount: u._count.sessions,
    extraPermissions: u.extraPermissions.map((p) => p.permission),
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="계정별 권한 관리" />
      <div className="flex-1 overflow-y-auto p-6">
        <AccountsPermissionsClient users={dto} currentUserId={user.id} />
      </div>
    </div>
  )
}
