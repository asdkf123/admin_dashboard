'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from '@/lib/navigation'
import { UserRole } from '@/types/navigation'
import {
  Building2,
  Users,
  LayoutDashboard,
  Zap,
  Calculator,
  Wrench,
  Headphones,
  FlaskConical,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  building: Building2,
  users: Users,
  'layout-dashboard': LayoutDashboard,
  zap: Zap,
  calculator: Calculator,
  wrench: Wrench,
  headphones: Headphones,
  'flask-conical': FlaskConical,
}

interface SidebarProps {
  userRole?: UserRole
}

export function Sidebar({ userRole = 'main_admin' }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set(['대시보드']))

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="text-lg font-bold tracking-tight text-white">
          차지비 관리자
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filteredItems.map((item) => {
          const Icon = iconMap[item.icon]

          if (item.href) {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{item.title}</span>
              </Link>
            )
          }

          const isOpen = openMenus.has(item.title)
          const isActive = item.children?.some((child) =>
            pathname.startsWith(child.href)
          )

          return (
            <div key={item.title}>
              <button
                onClick={() => toggleMenu(item.title)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="flex-1 text-left">{item.title}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </button>

              {isOpen && item.children && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                  {item.children
                    .filter((child) => !child.roles || child.roles.includes(userRole))
                    .map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.href + child.title}
                          href={child.href}
                          className={cn(
                            'block rounded-md px-3 py-1.5 text-sm transition-colors',
                            isChildActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                          )}
                        >
                          {child.title}
                        </Link>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-white">
            관
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              관리자
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {userRole === 'main_admin'
                ? '차지비 관리자'
                : userRole === 'partner_admin'
                  ? '위탁 관리자'
                  : '일반 관리자'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
