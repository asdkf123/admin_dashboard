import { NextResponse } from 'next/server'
import { prisma } from '@/lib/adapters/db'
import { getCurrentUser } from '@/lib/auth/server'

/**
 * 다운로드 트래킹. 실제 파일 URL은 응답에 포함, 카운트는 증가.
 * 운영 시 storageAdapter에서 signed URL 발급 후 반환.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.resource.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  })

  return NextResponse.json({
    ok: true,
    url: resource.externalUrl ?? (resource.fileKey ? `/api/storage/${resource.fileKey}` : null),
    fileName: resource.fileName,
  })
}
