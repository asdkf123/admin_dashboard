import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { recordAudit } from '@/lib/audit/log'

const VALID_CATEGORY = new Set([
  'manual',
  'form',
  'guide',
  'contract_template',
  'marketing',
  'other',
])

export async function POST(req: Request) {
  try {
    const actor = await requireRole('main_admin')
    const { category, title, description, fileKey, fileName, externalUrl, pinned } = await req.json()

    if (!title || !category) {
      return NextResponse.json({ error: '제목과 카테고리는 필수' }, { status: 400 })
    }
    if (!VALID_CATEGORY.has(category)) {
      return NextResponse.json({ error: '잘못된 카테고리' }, { status: 400 })
    }
    if (!fileKey && !externalUrl) {
      return NextResponse.json({ error: '파일 또는 외부 링크 중 하나는 필수' }, { status: 400 })
    }

    const created = await prisma.resource.create({
      data: {
        category,
        title,
        description: description || null,
        fileKey: fileKey || null,
        fileName: fileName || null,
        externalUrl: externalUrl || null,
        pinned: !!pinned,
      },
    })

    await recordAudit({
      userId: actor.id,
      action: 'resource.create',
      resourceType: 'Resource',
      resourceId: created.id,
      after: { category, title, fileKey, externalUrl, pinned },
    })

    return NextResponse.json({ ok: true, resource: created })
  } catch (e) {
    return errorResponse(e, '[admin/resources/POST]')
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
