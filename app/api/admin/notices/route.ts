import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { noticeAdapter } from '@/lib/adapters/notice'
import { recordAudit } from '@/lib/audit/log'

const VALID_KINDS = new Set(['maintenance', 'feature', 'announcement', 'security', 'event'])

export async function POST(req: Request) {
  try {
    const actor = await requireRole('main_admin')
    const { type, title, body, pinned, publishedAt } = await req.json()

    if (!title || !type) {
      return NextResponse.json({ error: '제목과 분류는 필수입니다.' }, { status: 400 })
    }
    if (!VALID_KINDS.has(type)) {
      return NextResponse.json({ error: '잘못된 분류' }, { status: 400 })
    }
    if (!noticeAdapter.create) {
      return NextResponse.json({ error: '이 어댑터는 작성을 지원하지 않습니다.' }, { status: 400 })
    }

    const created = await noticeAdapter.create({
      type,
      title,
      body: body || undefined,
      pinned: !!pinned,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })

    await recordAudit({
      userId: actor.id,
      action: 'notice.create',
      resourceType: 'Notice',
      resourceId: created.id,
      after: { type, title, pinned },
    })

    return NextResponse.json({ ok: true, notice: created })
  } catch (e) {
    return errorResponse(e, '[admin/notices/POST]')
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
