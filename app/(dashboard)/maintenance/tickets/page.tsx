import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/adapters/db'
import { getVisibleStations } from '@/lib/stations/visible'
import { TicketsClient } from './tickets-client'

export default async function TicketsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const visibleStations = await getVisibleStations(user)
  const stationIds = visibleStations.map((s) => s.id)

  const [tickets, staffList] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where: { stationId: { in: stationIds } },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
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

  const ticketDtos = tickets.map((t) => ({
    id: t.id,
    stationId: t.stationId,
    chargerId: t.chargerId,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    reporter: t.reporter,
    assignee: t.assignee,
    resolution: t.resolution,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    closedAt: t.closedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  }))

  const stationMap = Object.fromEntries(
    visibleStations.map((s) => [s.id, { id: s.id, name: s.name }]),
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="접수,처리 이력" />
      <div className="flex-1 overflow-y-auto p-6">
        <TicketsClient
          tickets={ticketDtos}
          stations={visibleStations.map((s) => ({ id: s.id, name: s.name }))}
          stationMap={stationMap}
          staffList={staffList}
          role={user.role}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
