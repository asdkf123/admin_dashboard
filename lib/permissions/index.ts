import { prisma } from '@/lib/adapters/db'
import type { User } from '@prisma/client'
import type { Permission } from './keys'
import { ROLE_PERMISSIONS } from './role-templates'

export type { Permission } from './keys'
export { ALL_PERMISSIONS, PERMISSION_LABEL, PERMISSION_GROUP } from './keys'
export { ROLE_PERMISSIONS } from './role-templates'

/**
 * 사용자의 실효 권한 = role 기본 + 추가 grant.
 */
export async function getEffectivePermissions(user: User): Promise<Set<Permission>> {
  const base = ROLE_PERMISSIONS[user.role] ?? []
  const extras = await prisma.userPermission.findMany({
    where: { userId: user.id },
    select: { permission: true },
  })
  const set = new Set<Permission>(base)
  for (const e of extras) set.add(e.permission as Permission)
  return set
}

export async function hasPermission(user: User, permission: Permission): Promise<boolean> {
  const base = ROLE_PERMISSIONS[user.role] ?? []
  if (base.includes(permission)) return true
  const extra = await prisma.userPermission.findUnique({
    where: { userId_permission: { userId: user.id, permission } },
  })
  return extra !== null
}

/**
 * 권한 없으면 throw — API/페이지에서 사용.
 */
export class PermissionDeniedError extends Error {
  constructor(public permission: Permission) {
    super(`Permission denied: ${permission}`)
    this.name = 'PermissionDeniedError'
  }
}

export async function requirePermission(user: User, permission: Permission): Promise<void> {
  const ok = await hasPermission(user, permission)
  if (!ok) throw new PermissionDeniedError(permission)
}
