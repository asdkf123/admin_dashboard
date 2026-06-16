import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ForbiddenCard } from '@/components/layout/forbidden-card'
import { getCurrentUser } from '@/lib/auth/server'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/adapters/db'
import { stationAdapter } from '@/lib/adapters/station'
import { AccountsStationsClient } from './accounts-stations-client'

export default async function AccountsStationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasPermission(user, 'manage:accounts'))) {
    return <ForbiddenCard title="충전소별 계정 관리" permission="manage:accounts" />
  }

  const [stationsRes, accounts, partners] = await Promise.all([
    stationAdapter.listStations({ limit: 1000 }),
    prisma.account.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),
    prisma.user.findMany({
      where: { role: 'partner_admin' },
      select: { id: true, name: true, email: true, phone: true, businessNo: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // 충전소별로 account 묶기
  const accountsByStation: Record<string, typeof accounts> = {}
  for (const a of accounts) {
    if (!accountsByStation[a.stationId]) accountsByStation[a.stationId] = []
    accountsByStation[a.stationId].push(a)
  }

  const stationDtos = stationsRes.items.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    status: s.status,
    chargerCount: s.chargerCount,
    accounts: (accountsByStation[s.id] ?? []).map((a) => ({
      id: a.id,
      userId: a.userId,
      scopeRole: a.scopeRole,
      userName: a.user.name,
      userEmail: a.user.email,
      userPhone: a.user.phone,
      createdAt: a.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="충전소별 계정 관리" />
      <div className="flex-1 overflow-y-auto p-6">
        <AccountsStationsClient stations={stationDtos} partners={partners} />
      </div>
    </div>
  )
}
