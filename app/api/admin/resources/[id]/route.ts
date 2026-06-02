import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const existing = await prisma.resource.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { category, title, description, fileKey, fileName, externalUrl, pinned } = await req.json()
    const updated = await prisma.resource.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(fileKey !== undefined && { fileKey }),
        ...(fileName !== undefined && { fileName }),
        ...(externalUrl !== undefined && { externalUrl }),
        ...(pinned !== undefined && { pinned }),
      },
    })

    await recordAudit({
      userId: actor.id,
      action: 'resource.update',
      resourceType: 'Resource',
      resourceId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json({ ok: true, resource: updated })
  } catch (e) {
    return errorResponse(e, '[admin/resources/PATCH]')
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const existing = await prisma.resource.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.resource.delete({ where: { id } })
    await recordAudit({
      userId: actor.id,
      action: 'resource.delete',
      resourceType: 'Resource',
      resourceId: id,
      before: existing,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e, '[admin/resources/DELETE]')
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
