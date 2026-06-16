'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  MapPin,
  AlertCircle,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StationLite {
  id: string
  name: string
  address: string
}

interface GroupDto {
  id: string
  name: string
  description: string | null
  color: string
  stationIds: string[]
  createdAt: string
}

interface Props {
  groups: GroupDto[]
  allStations: StationLite[]
  stationMap: Record<string, { id: string; name: string; address: string }>
}

const PRESET_COLORS = [
  '#1570EF', // blue
  '#12B76A', // green
  '#F79009', // amber
  '#F04438', // red
  '#7A5AF8', // indigo
  '#06AED4', // cyan
  '#0F1729', // slate
  '#98A2B3', // gray
]

export function StationGroupsClient({ groups, allStations, stationMap }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<GroupDto | 'new' | null>(null)
  const [managingMembers, setManagingMembers] = useState<GroupDto | null>(null)
  const [banner, setBanner] = useState<{ tone: 'success' | 'danger'; msg: string } | null>(null)

  const filtered = useMemo(() => {
    if (!search) return groups
    const k = search.toLowerCase()
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(k) ||
        (g.description?.toLowerCase().includes(k) ?? false),
    )
  }, [groups, search])

  const stationsInAnyGroup = useMemo(() => {
    const s = new Set<string>()
    for (const g of groups) for (const id of g.stationIds) s.add(id)
    return s
  }, [groups])

  const remove = async (group: GroupDto) => {
    if (!confirm(`"${group.name}" 그룹을 삭제합니다. 그룹에 매핑된 충전소는 보존됩니다.`)) return
    const r = await fetch(`/api/admin/station-groups/${group.id}`, { method: 'DELETE' })
    if (r.ok) {
      setBanner({ tone: 'success', msg: '그룹이 삭제되었습니다.' })
      router.refresh()
    } else {
      const data = await r.json().catch(() => ({}))
      setBanner({ tone: 'danger', msg: data.error ?? '삭제 실패' })
    }
  }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryItem label="전체 그룹" value={groups.length} tone="primary" />
        <SummaryItem
          label="그룹 매핑된 충전소"
          value={stationsInAnyGroup.size}
          tone="info"
        />
        <SummaryItem
          label="미분류 충전소"
          value={allStations.length - stationsInAnyGroup.size}
          tone={allStations.length - stationsInAnyGroup.size > 0 ? 'warning' : 'success'}
        />
        <SummaryItem label="전체 충전소" value={allStations.length} tone="muted" />
      </div>

      {banner && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-md p-3 text-sm',
            banner.tone === 'success'
              ? 'bg-success-soft text-success-soft-foreground'
              : 'bg-danger-soft text-danger-soft-foreground',
          )}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {banner.msg}
        </div>
      )}

      {/* 검색 + 신규 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="그룹명 또는 설명 검색"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <Button onClick={() => setEditing('new')} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          신규 그룹
        </Button>
      </div>

      {/* 그룹 카드 그리드 */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Layers className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {groups.length === 0
                ? '아직 그룹이 없습니다. 신규 그룹을 만들어보세요.'
                : '조건에 맞는 그룹이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => (
            <Card key={g.id} className="shadow-sm">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ background: g.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold">{g.name}</h3>
                      {g.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => setEditing(g)}
                      title="수정"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => remove(g)}
                      title="삭제"
                      className="rounded-md p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      매핑된 충전소 ({g.stationIds.length})
                    </p>
                    <button
                      onClick={() => setManagingMembers(g)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      관리 →
                    </button>
                  </div>
                  {g.stationIds.length === 0 ? (
                    <p className="text-xs text-muted-foreground">아직 매핑된 충전소가 없습니다.</p>
                  ) : (
                    <ul className="space-y-1">
                      {g.stationIds.slice(0, 4).map((sid) => {
                        const s = stationMap[sid]
                        return (
                          <li key={sid} className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {s?.name ?? sid} <span className="font-mono text-muted-foreground">({sid})</span>
                            </span>
                          </li>
                        )
                      })}
                      {g.stationIds.length > 4 && (
                        <li className="text-xs text-muted-foreground">+{g.stationIds.length - 4}개 더</li>
                      )}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}

      {managingMembers && (
        <MembersModal
          group={managingMembers}
          allStations={allStations}
          onClose={() => setManagingMembers(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  )
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'primary' | 'info' | 'success' | 'warning' | 'muted'
}) {
  const dotCls = {
    primary: 'bg-primary',
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    muted: 'bg-muted-foreground',
  }[tone]
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotCls)} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold tabular-nums">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

// ─── 생성/수정 모달 ──────────────────────────────────────────────

function EditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: GroupDto | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = initial
        ? `/api/admin/station-groups/${initial.id}`
        : '/api/admin/station-groups'
      const method = initial ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null, color }),
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
    <Modal onClose={onClose}>
      <div className="border-b p-4">
        <h3 className="text-base font-semibold">
          {initial ? '그룹 수정' : '신규 그룹'}
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
          <label className="mb-1 block text-xs font-medium">그룹명 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">색상</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition',
                  color === c && 'ring-2 ring-foreground ring-offset-2',
                )}
                style={{ background: c }}
              >
                {color === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={submit} disabled={!name || loading}>
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── 멤버십 관리 모달 ────────────────────────────────────────────

function MembersModal({
  group,
  allStations,
  onClose,
  onChanged,
}: {
  group: GroupDto
  allStations: StationLite[]
  onClose: () => void
  onChanged: () => void
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(group.stationIds))
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return allStations
    const k = search.toLowerCase()
    return allStations.filter(
      (s) =>
        s.name.toLowerCase().includes(k) ||
        s.id.toLowerCase().includes(k) ||
        s.address.toLowerCase().includes(k),
    )
  }, [allStations, search])

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      const current = new Set(group.stationIds)
      const toAdd = [...selected].filter((id) => !current.has(id))
      const toRemove = [...current].filter((id) => !selected.has(id))

      if (toAdd.length > 0) {
        await fetch(`/api/admin/station-groups/${group.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stationIds: toAdd }),
        })
      }
      for (const sid of toRemove) {
        await fetch(`/api/admin/station-groups/${group.id}/members?stationId=${sid}`, {
          method: 'DELETE',
        })
      }
      onChanged()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: group.color }} />
          <h3 className="text-base font-semibold">{group.name} 멤버 관리</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          체크된 충전소를 그룹에 매핑합니다. 한 충전소는 여러 그룹에 속할 수 있습니다.
        </p>
      </div>

      <div className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, ID, 주소 검색"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="max-h-96 space-y-1 overflow-y-auto rounded-md border p-1">
          {filtered.map((s) => {
            const checked = selected.has(s.id)
            return (
              <label
                key={s.id}
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/40',
                  checked && 'bg-accent',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s.id)}
                  className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {s.name} <span className="font-mono text-xs text-muted-foreground">({s.id})</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{s.address}</p>
                </div>
              </label>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              조건에 맞는 충전소가 없습니다.
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          선택됨: <span className="font-semibold text-foreground">{selected.size}개</span>
          {selected.size !== group.stationIds.length && (
            <span className="ml-2 text-warning">
              (변경 사항 {Math.abs(selected.size - group.stationIds.length)}건)
            </span>
          )}
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={save} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </Modal>
  )
}

function Modal({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className={cn('w-full rounded-lg bg-card shadow-lg', wide ? 'max-w-2xl' : 'max-w-md')}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'
