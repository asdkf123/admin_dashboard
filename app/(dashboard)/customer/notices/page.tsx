import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getCurrentUser } from '@/lib/auth/server'
import { noticeAdapter } from '@/lib/adapters/notice'
import { NoticesClient } from './notices-client'

export default async function NoticesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { items } = await noticeAdapter.list({ limit: 200 })

  const dto = items.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    publishedAt: n.publishedAt.toISOString(),
    pinned: n.pinned,
  }))

  const canMutate = user.role === 'main_admin' && noticeAdapter.canMutate

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="공지사항" />
      <div className="flex-1 overflow-y-auto p-6">
        <NoticesClient notices={dto} canMutate={canMutate} />
      </div>
    </div>
  )
}
