import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/adapters/db'
import { getVisibleStations } from '@/lib/stations/visible'
import { InspectionClient } from './inspection-client'

export default async function InspectionPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const visibleStations = await getVisibleStations(user)
  const stationIds = visibleStations.map((s) => s.id)

  const [inspections, staffList] = await Promise.all([
    prisma.inspection.findMany({
      where: { stationId: { in: stationIds } },
      orderBy: { scheduledAt: 'desc' },
      include: {
        inspector: { select: { id: true, name: true, email: true } },
      },
    }),
    user.role === 'main_admin' || user.role === 'normal_admin'
      ? prisma.user.findMany({
          where: { role: { in: ['main_admin', 'normal_admin'] } },
          select: { id: true, name: true, email: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  const dto = inspections.map((i) => ({
    id: i.id,
    stationId: i.stationId,
    chargerId: i.chargerId,
    inspector: i.inspector,
    scheduledAt: i.scheduledAt.toISOString(),
    performedAt: i.performedAt?.toISOString() ?? null,
    status: i.status,
    result: i.result,
    notes: i.notes,
    nextScheduledAt: i.nextScheduledAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
  }))

  const stationMap = Object.fromEntries(
    visibleStations.map((s) => [s.id, { id: s.id, name: s.name }]),
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="점검 이력" />
      <div className="flex-1 overflow-y-auto p-6">
        <InspectionClient
          inspections={dto}
          stations={visibleStations.map((s) => ({ id: s.id, name: s.name }))}
          stationMap={stationMap}
          staffList={staffList}
          role={user.role}
        />
      </div>
    </div>
  )
}
