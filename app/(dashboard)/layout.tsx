import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'
import { getCurrentUser } from '@/lib/auth/server'
import { getEffectivePermissions } from '@/lib/permissions'

const PASSWORD_CHANGE_PATH = '/me/change-password'
const ALLOWED_DURING_FORCED_CHANGE = [PASSWORD_CHANGE_PATH]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // 임시 비번 강제 변경: 비번 변경 페이지 외 다른 dashboard 접근 차단
  if (user.mustChangePassword) {
    const h = await headers()
    const pathname = h.get('x-pathname') ?? ''
    const allowed = ALLOWED_DURING_FORCED_CHANGE.some((p) => pathname.startsWith(p))
    if (!allowed) redirect(PASSWORD_CHANGE_PATH)
  }

  // role 기본 + 사용자별 추가 grant 합쳐서 effective permissions 계산
  const permissions = await getEffectivePermissions(user)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
        permissions={Array.from(permissions)}
      />
      <main className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        {children}
      </main>
    </div>
  )
}
