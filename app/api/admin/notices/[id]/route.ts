import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { noticeAdapter } from '@/lib/adapters/notice'
import { recordAudit } from '@/lib/audit/log'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    if (!noticeAdapter.update) {
      return NextResponse.json({ error: '이 어댑터는 수정을 지원하지 않습니다.' }, { status: 400 })
    }
    const existing = await noticeAdapter.get(id)
    if (!existing) return NextResponse.json({ error: '공지를 찾을 수 없습니다.' }, { status: 404 })

    const { type, title, body, pinned, publishedAt } = await req.json()
    const updated = await noticeAdapter.update(id, {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(body !== undefined && { body }),
      ...(pinned !== undefined && { pinned }),
      ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
    })

    await recordAudit({
      userId: actor.id,
      action: 'notice.update',
      resourceType: 'Notice',
      resourceId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json({ ok: true, notice: updated })
  } catch (e) {
    return errorResponse(e, '[admin/notices/PATCH]')
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    if (!noticeAdapter.delete) {
      return NextResponse.json({ error: '삭제 미지원' }, { status: 400 })
    }
    const existing = await noticeAdapter.get(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await noticeAdapter.delete(id)
    await recordAudit({
      userId: actor.id,
      action: 'notice.delete',
      resourceType: 'Notice',
      resourceId: id,
      before: existing,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e, '[admin/notices/DELETE]')
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
