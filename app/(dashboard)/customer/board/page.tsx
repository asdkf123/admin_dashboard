import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/adapters/db'
import { BoardClient } from './board-client'

export default async function BoardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const items = await prisma.resource.findMany({
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: 200,
  })

  const dto = items.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    fileKey: r.fileKey,
    fileName: r.fileName,
    externalUrl: r.externalUrl,
    publishedAt: r.publishedAt.toISOString(),
    pinned: r.pinned,
    downloadCount: r.downloadCount,
  }))

  const canMutate = user.role === 'main_admin'

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="자료게시판" />
      <div className="flex-1 overflow-y-auto p-6">
        <BoardClient resources={dto} canMutate={canMutate} />
      </div>
    </div>
  )
}
