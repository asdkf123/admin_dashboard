import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

/** 점검 일정 등록 — 운영자만 */
export async function POST(req: Request) {
  try {
    const actor = await requireRole('main_admin', 'normal_admin')
    const body = await req.json()
    const { stationId, chargerId, scheduledAt, inspectorUserId, notes } = body

    if (!stationId || !scheduledAt) {
      return NextResponse.json({ error: '충전소와 일정은 필수입니다.' }, { status: 400 })
    }

    const inspection = await prisma.inspection.create({
      data: {
        stationId,
        chargerId: chargerId || null,
        scheduledAt: new Date(scheduledAt),
        inspectorUserId: inspectorUserId || null,
        notes: notes || null,
      },
    })

    await recordAudit({
      userId: actor.id,
      action: 'inspection.create',
      resourceType: 'Inspection',
      resourceId: inspection.id,
      after: { stationId, scheduledAt },
    })

    return NextResponse.json({ ok: true, inspection })
  } catch (e) {
    if (e instanceof Error && e.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (e instanceof Error && e.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[inspections/POST]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
