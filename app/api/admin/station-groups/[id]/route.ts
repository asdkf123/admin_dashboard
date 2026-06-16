import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const existing = await prisma.stationGroup.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { name, description, color } = await req.json()

    // 이름 중복 체크 (변경 시)
    if (name && name !== existing.name) {
      const dup = await prisma.stationGroup.findUnique({ where: { name } })
      if (dup) return NextResponse.json({ error: '같은 이름의 그룹이 이미 있습니다.' }, { status: 409 })
    }

    const updated = await prisma.stationGroup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(color !== undefined && { color }),
      },
    })

    await recordAudit({
      userId: actor.id,
      action: 'station_group.update',
      resourceType: 'StationGroup',
      resourceId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json({ ok: true, group: updated })
  } catch (e) {
    return errorResponse(e, '[admin/station-groups/PATCH]')
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const existing = await prisma.stationGroup.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.stationGroup.delete({ where: { id } })
    await recordAudit({
      userId: actor.id,
      action: 'station_group.delete',
      resourceType: 'StationGroup',
      resourceId: id,
      before: existing,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e, '[admin/station-groups/DELETE]')
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
