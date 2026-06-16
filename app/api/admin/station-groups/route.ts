import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

export async function POST(req: Request) {
  try {
    const actor = await requireRole('main_admin')
    const { name, description, color, stationIds } = await req.json()

    if (!name) {
      return NextResponse.json({ error: '그룹명은 필수' }, { status: 400 })
    }

    const existing = await prisma.stationGroup.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: '같은 이름의 그룹이 이미 있습니다.' }, { status: 409 })
    }

    const group = await prisma.stationGroup.create({
      data: {
        name,
        description: description || null,
        color: color || '#1570EF',
      },
    })

    if (Array.isArray(stationIds) && stationIds.length > 0) {
      await prisma.stationGroupMember.createMany({
        data: stationIds.map((sid: string) => ({ groupId: group.id, stationId: sid })),
        skipDuplicates: true,
      })
    }

    await recordAudit({
      userId: actor.id,
      action: 'station_group.create',
      resourceType: 'StationGroup',
      resourceId: group.id,
      after: { name, stationCount: stationIds?.length ?? 0 },
    })

    return NextResponse.json({ ok: true, group })
  } catch (e) {
    return errorResponse(e, '[admin/station-groups/POST]')
  }
}

function errorResponse(e: unknown, tag: string) {
  if (e instanceof Error && e.name === 'UnauthorizedError') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (e instanceof Error && e.name === 'ForbiddenError') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  console.error(tag, e)
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
