import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ForbiddenCard } from '@/components/layout/forbidden-card'
import { getCurrentUser } from '@/lib/auth/server'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/adapters/db'
import { stationAdapter } from '@/lib/adapters/station'
import { StationGroupsClient } from './station-groups-client'

export default async function StationGroupsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasPermission(user, 'manage:stations'))) {
    return <ForbiddenCard title="충전소그룹 관리" permission="manage:stations" />
  }

  const [groups, stationsRes] = await Promise.all([
    prisma.stationGroup.findMany({
      include: { members: { select: { stationId: true } } },
      orderBy: { name: 'asc' },
    }),
    stationAdapter.listStations({ limit: 1000 }),
  ])

  const stationMap = Object.fromEntries(
    stationsRes.items.map((s) => [s.id, { id: s.id, name: s.name, address: s.address }]),
  )

  const dto = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    color: g.color,
    stationIds: g.members.map((m) => m.stationId),
    createdAt: g.createdAt.toISOString(),
  }))

  const allStations = stationsRes.items.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="충전소그룹 관리" />
      <div className="flex-1 overflow-y-auto p-6">
        <StationGroupsClient
          groups={dto}
          allStations={allStations}
          stationMap={stationMap}
        />
      </div>
    </div>
  )
}
