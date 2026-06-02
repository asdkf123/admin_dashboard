import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

/** 점검 결과 입력 / 상태 변경 — 운영자만 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin', 'normal_admin')
    const { id } = await params
    const existing = await prisma.inspection.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })

    const body = await req.json()
    const { status, result, notes, performedAt, nextScheduledAt, inspectorUserId } = body

    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (result !== undefined) data.result = result
    if (notes !== undefined) data.notes = notes
    if (performedAt !== undefined) data.performedAt = performedAt ? new Date(performedAt) : null
    if (nextScheduledAt !== undefined) data.nextScheduledAt = nextScheduledAt ? new Date(nextScheduledAt) : null
    if (inspectorUserId !== undefined) data.inspectorUserId = inspectorUserId || null

    // 완료 처리 시 performedAt 자동 채움
    if (status === 'completed' && !existing.performedAt && !data.performedAt) {
      data.performedAt = new Date()
    }

    const updated = await prisma.inspection.update({ where: { id }, data })
    await recordAudit({
      userId: actor.id,
      action: 'inspection.update',
      resourceType: 'Inspection',
      resourceId: id,
      before: existing,
      after: data,
    })

    return NextResponse.json({ ok: true, inspection: updated })
  } catch (e) {
    if (e instanceof Error && e.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (e instanceof Error && e.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[inspections/PATCH]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
