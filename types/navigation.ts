export type UserRole = 'main_admin' | 'normal_admin' | 'partner_admin'

export interface NavSubItem {
  title: string
  href: string
  roles?: UserRole[]
}

export interface NavItem {
  title: string
  href?: string
  icon: string
  roles: UserRole[]
  children?: NavSubItem[]
}
