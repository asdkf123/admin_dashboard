'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Pencil,
  Trash2,
  Pin,
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ResourceCategory =
  | 'manual'
  | 'form'
  | 'guide'
  | 'contract_template'
  | 'marketing'
  | 'other'

const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  manual: '매뉴얼',
  form: '양식',
  guide: '안내문',
  contract_template: '계약서식',
  marketing: '마케팅',
  other: '기타',
}

interface ResourceDto {
  id: string
  category: ResourceCategory
  title: string
  description: string | null
  fileKey: string | null
  fileName: string | null
  externalUrl: string | null
  publishedAt: string
  pinned: boolean
  downloadCount: number
}

interface Props {
  resources: ResourceDto[]
  canMutate: boolean
}

export function BoardClient({ resources, canMutate }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | ResourceCategory>('all')
  const [editing, setEditing] = useState<ResourceDto | 'new' | null>(null)

  const filtered = useMemo(() => {
    let items = resources
    if (categoryFilter !== 'all') items = items.filter((r) => r.category === categoryFilter)
    if (search) {
      const k = search.toLowerCase()
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(k) ||
          (r.description?.toLowerCase().includes(k) ?? false),
      )
    }
    return items
  }, [resources, search, categoryFilter])

  const download = async (resource: ResourceDto) => {
    const r = await fetch(`/api/resources/${resource.id}/download`, { method: 'POST' })
    const data = await r.json()
    if (data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
    router.refresh()
  }

  const remove = async (resource: ResourceDto) => {
    if (!confirm(`"${resource.title}" 자료를 삭제합니다.`)) return
    const r = await fetch(`/api/admin/resources/${resource.id}`, { method: 'DELETE' })
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
              placeholder="제목 또는 설명 검색"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(['all', ...(Object.keys(CATEGORY_LABEL) as ResourceCategory[])] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition',
                  categoryFilter === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {c === 'all' ? '전체' : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        {canMutate && (
          <Button onClick={() => setEditing('new')} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            자료 등록
          </Button>
        )}
      </div>

      {/* 그리드 */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">자료가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className={cn('shadow-sm', r.pinned && 'border-warning/40')}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {r.pinned && <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {CATEGORY_LABEL[r.category]}
                      </p>
                      <h3 className="line-clamp-2 text-sm font-semibold">{r.title}</h3>
                    </div>
                  </div>
                  {canMutate && (
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        onClick={() => setEditing(r)}
                        title="수정"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(r)}
                        title="삭제"
                        className="rounded-md p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {r.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                )}
                <div className="flex items-center justify-between border-t pt-2 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(r.publishedAt).toLocaleDateString('ko-KR')} ·{' '}
                    {r.downloadCount}회 다운로드
                  </span>
                  <button
                    onClick={() => download(r)}
                    className="flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {r.externalUrl ? (
                      <>
                        <ExternalLink className="h-3 w-3" />
                        열기
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        다운로드
                      </>
                    )}
                  </button>
                </div>
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
  initial: ResourceDto | null
  onClose: () => void
  onSaved: () => void
}) {
  const [category, setCategory] = useState<ResourceCategory>(initial?.category ?? 'manual')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl ?? '')
  const [fileKey, setFileKey] = useState(initial?.fileKey ?? '')
  const [fileName, setFileName] = useState(initial?.fileName ?? '')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!externalUrl && !fileKey) {
      setError('외부 링크 또는 파일 key 중 하나는 필수입니다.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = initial ? `/api/admin/resources/${initial.id}` : '/api/admin/resources'
      const method = initial ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description: description || null,
          externalUrl: externalUrl || null,
          fileKey: fileKey || null,
          fileName: fileName || null,
          pinned,
        }),
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
            {initial ? '자료 수정' : '신규 자료 등록'}
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
            <label className="mb-1 block text-xs font-medium">카테고리 *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className={inputCls}
            >
              {(Object.keys(CATEGORY_LABEL) as ResourceCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">외부 링크 (URL)</label>
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Notion / Confluence / Google Drive 등 외부 자료 링크
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium">파일 key (선택)</label>
              <input
                value={fileKey}
                onChange={(e) => setFileKey(e.target.value)}
                placeholder="storage adapter key"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">파일명 (선택)</label>
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="example.pdf"
                className={inputCls}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            상단 고정
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
