import type { Permission } from '@/lib/permissions/keys'

export type UserRole = 'main_admin' | 'normal_admin' | 'partner_admin'

export interface NavSubItem {
  title: string
  href: string
  roles?: UserRole[]
  /** 이 메뉴 노출에 필요한 권한. role이 통과되더라도 권한 없으면 hidden. */
  requiredPermissions?: Permission[]
}

export interface NavItem {
  title: string
  href?: string
  icon: string
  roles: UserRole[]
  requiredPermissions?: Permission[]
  children?: NavSubItem[]
}
