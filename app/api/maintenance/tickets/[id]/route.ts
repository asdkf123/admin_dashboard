import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { getCurrentUser } from '@/lib/auth/server'
import { canAccessStation } from '@/lib/stations/visible'
import { recordAudit } from '@/lib/audit/log'

const VALID_STATUS = new Set(['open', 'in_progress', 'resolved', 'closed', 'cancelled'])

/** 티켓 상세·상태변경·배정·해결 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  // 권한: 본인 접근 가능 충전소이거나, 운영자
  const allowed = await canAccessStation(user, ticket.stationId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { status, priority, assigneeUserId, resolution } = body

    if (status && !VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // 파트너는 status 변경 못 함 (cancel만 가능). 운영자만 처리 진행 가능.
    if (user.role === 'partner_admin' && status && status !== 'cancelled') {
      return NextResponse.json(
        { error: '파트너는 처리 진행을 변경할 수 없습니다. 취소만 가능합니다.' },
        { status: 403 },
      )
    }

    const data: Record<string, unknown> = {}
    if (status !== undefined) {
      data.status = status
      if (status === 'resolved' && !ticket.resolvedAt) data.resolvedAt = new Date()
      if (status === 'closed' && !ticket.closedAt) data.closedAt = new Date()
    }
    if (priority !== undefined && user.role !== 'partner_admin') data.priority = priority
    if (assigneeUserId !== undefined && user.role !== 'partner_admin') data.assigneeUserId = assigneeUserId || null
    if (resolution !== undefined) data.resolution = resolution

    const updated = await prisma.maintenanceTicket.update({ where: { id }, data })
    await recordAudit({
      userId: user.id,
      action: 'ticket.update',
      resourceType: 'MaintenanceTicket',
      resourceId: id,
      before: ticket,
      after: data,
    })

    return NextResponse.json({ ok: true, ticket: updated })
  } catch (e) {
    console.error('[tickets/PATCH]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
