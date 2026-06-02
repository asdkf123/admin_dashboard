'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Pin,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Megaphone,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NoticeKind = 'maintenance' | 'feature' | 'announcement' | 'security' | 'event'

const KIND_LABEL: Record<NoticeKind, string> = {
  maintenance: '점검',
  feature: '신규',
  announcement: '공지',
  security: '보안',
  event: '이벤트',
}

const KIND_TONE: Record<NoticeKind, string> = {
  maintenance: 'bg-warning-soft text-warning-soft-foreground',
  feature: 'bg-info-soft text-info-soft-foreground',
  announcement: 'bg-muted text-muted-foreground',
  security: 'bg-danger-soft text-danger-soft-foreground',
  event: 'bg-success-soft text-success-soft-foreground',
}

interface NoticeDto {
  id: string
  type: NoticeKind
  title: string
  body: string | null
  publishedAt: string
  pinned: boolean
}

interface Props {
  notices: NoticeDto[]
  canMutate: boolean
}

export function NoticesClient({ notices, canMutate }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | NoticeKind>('all')
  const [editing, setEditing] = useState<NoticeDto | 'new' | null>(null)

  const filtered = useMemo(() => {
    let items = notices
    if (kindFilter !== 'all') items = items.filter((n) => n.type === kindFilter)
    if (search) {
      const k = search.toLowerCase()
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(k) ||
          (n.body?.toLowerCase().includes(k) ?? false),
      )
    }
    return items
  }, [notices, search, kindFilter])

  const remove = async (notice: NoticeDto) => {
    if (!confirm(`"${notice.title}" 공지를 삭제합니다.`)) return
    const r = await fetch(`/api/admin/notices/${notice.id}`, { method: 'DELETE' })
    if (r.ok) router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* 필터 + 신규 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목 또는 본문 검색"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(['all', ...(Object.keys(KIND_LABEL) as NoticeKind[])] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition',
                  kindFilter === k
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {k === 'all' ? '전체' : KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        {canMutate && (
          <Button onClick={() => setEditing('new')} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            신규 작성
          </Button>
        )}
      </div>

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">공지사항이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className={cn('shadow-sm', n.pinned && 'border-warning/40')}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    {n.pinned && <Pin className="mt-1 h-3.5 w-3.5 shrink-0 text-warning" />}
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                        KIND_TONE[n.type],
                      )}
                    >
                      {KIND_LABEL[n.type]}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{n.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(n.publishedAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  {canMutate && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setEditing(n)}
                        title="수정"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(n)}
                        title="삭제"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {n.body && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && canMutate && (
        <EditModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function EditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: NoticeDto | null
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<NoticeKind>(initial?.type ?? 'announcement')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = initial ? `/api/admin/notices/${initial.id}` : '/api/admin/notices'
      const method = initial ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, body, pinned }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? '저장 실패')
        return
      }
      onSaved()
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b p-4">
          <h3 className="text-base font-semibold">
            {initial ? '공지 수정' : '신규 공지 작성'}
          </h3>
        </div>
        <div className="space-y-3 p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger-soft-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium">분류</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NoticeKind)}
              className={inputCls}
            >
              {(Object.keys(KIND_LABEL) as NoticeKind[]).map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">본문</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className={inputCls}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            상단 고정 (로그인 페이지에 우선 노출)
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={submit} disabled={!title || loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'
