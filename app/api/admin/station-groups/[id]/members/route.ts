import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

/** 그룹에 충전소 추가 (다수 가능) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const { stationIds } = await req.json()

    if (!Array.isArray(stationIds) || stationIds.length === 0) {
      return NextResponse.json({ error: '충전소 ID 배열 필요' }, { status: 400 })
    }

    const group = await prisma.stationGroup.findUnique({ where: { id } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const result = await prisma.stationGroupMember.createMany({
      data: stationIds.map((sid: string) => ({ groupId: id, stationId: sid })),
      skipDuplicates: true,
    })

    await recordAudit({
      userId: actor.id,
      action: 'station_group.add_members',
      resourceType: 'StationGroup',
      resourceId: id,
      after: { added: stationIds, count: result.count },
    })

    return NextResponse.json({ ok: true, added: result.count })
  } catch (e) {
    return errorResponse(e, '[station-groups/members/POST]')
  }
}

/** 그룹에서 충전소 제거 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const stationId = searchParams.get('stationId')
    if (!stationId) return NextResponse.json({ error: 'stationId 필수' }, { status: 400 })

    await prisma.stationGroupMember.deleteMany({
      where: { groupId: id, stationId },
    })

    await recordAudit({
      userId: actor.id,
      action: 'station_group.remove_member',
      resourceType: 'StationGroup',
      resourceId: id,
      before: { stationId },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e, '[station-groups/members/DELETE]')
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
