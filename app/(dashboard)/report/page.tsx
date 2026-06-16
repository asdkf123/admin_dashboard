import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ForbiddenCard } from '@/components/layout/forbidden-card'
import { getCurrentUser } from '@/lib/auth/server'
import { hasPermission } from '@/lib/permissions'
import { ReportContent } from './report-content'

export default async function ReportPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasPermission(user, 'view:audit_log'))) {
    return <ForbiddenCard title="내부 보고" permission="view:audit_log" />
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="중간 보고" />
      <div className="flex-1 overflow-hidden bg-muted/20">
        <ReportContent />
      </div>
    </div>
  )
}
