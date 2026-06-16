import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { requireRole } from '@/lib/auth/server'
import { ALL_PERMISSIONS, type Permission } from '@/lib/permissions/keys'
import { recordAudit } from '@/lib/audit/log'

const VALID_PERMS = new Set<string>(ALL_PERMISSIONS)

/** 사용자에게 추가 권한 부여 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const { permission } = await req.json()

    if (!permission || !VALID_PERMS.has(permission)) {
      return NextResponse.json({ error: '유효하지 않은 권한 키' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const created = await prisma.userPermission.upsert({
      where: { userId_permission: { userId: id, permission } },
      update: {},
      create: { userId: id, permission, grantedByUserId: actor.id },
    })

    await recordAudit({
      userId: actor.id,
      action: 'permission.grant',
      resourceType: 'UserPermission',
      resourceId: created.id,
      after: { targetUserId: id, permission },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e, '[admin/users/permissions/POST]')
  }
}

/** 사용자의 추가 권한 회수 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole('main_admin')
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const permission = searchParams.get('permission') as Permission | null

    if (!permission || !VALID_PERMS.has(permission)) {
      return NextResponse.json({ error: '유효하지 않은 권한 키' }, { status: 400 })
    }

    await prisma.userPermission.deleteMany({
      where: { userId: id, permission },
    })

    await recordAudit({
      userId: actor.id,
      action: 'permission.revoke',
      resourceType: 'UserPermission',
      resourceId: id,
      before: { targetUserId: id, permission },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e, '[admin/users/permissions/DELETE]')
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
