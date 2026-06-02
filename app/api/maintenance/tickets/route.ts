import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { getCurrentUser } from '@/lib/auth/server'
import { canAccessStation, getVisibleStations } from '@/lib/stations/visible'
import { recordAudit } from '@/lib/audit/log'

/** 티켓 접수 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { stationId, chargerId, title, description, category, priority } = body

    if (!stationId || !title || !description) {
      return NextResponse.json({ error: '충전소, 제목, 설명은 필수입니다.' }, { status: 400 })
    }

    // 권한 체크: 본인이 접근 가능한 충전소에만 접수 가능 (운영자는 모두)
    const allowed = await canAccessStation(user, stationId)
    if (!allowed) {
      return NextResponse.json({ error: '해당 충전소에 권한이 없습니다.' }, { status: 403 })
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        stationId,
        chargerId: chargerId || null,
        title,
        description,
        category: category ?? 'fault',
        priority: priority ?? 'normal',
        reporterUserId: user.id,
      },
    })

    await recordAudit({
      userId: user.id,
      action: 'ticket.create',
      resourceType: 'MaintenanceTicket',
      resourceId: ticket.id,
      after: { stationId, title, category, priority },
    })

    return NextResponse.json({ ok: true, ticket })
  } catch (e) {
    console.error('[tickets/POST]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/** 티켓 목록 — 본인 접근 가능 충전소만 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const visible = await getVisibleStations(user)
  const stationIds = visible.map((s) => s.id)

  const tickets = await prisma.maintenanceTicket.findMany({
    where: { stationId: { in: stationIds } },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ tickets })
}
