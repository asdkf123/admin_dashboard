'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  AlertCircle,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/navigation'

type TicketCategory = 'fault' | 'maintenance_request' | 'inquiry' | 'other'
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  fault: '고장 신고',
  maintenance_request: '유지보수 요청',
  inquiry: '문의',
  other: '기타',
}

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  urgent: '긴급',
}

const PRIORITY_TONE: Record<TicketPriority, 'muted' | 'info' | 'warning' | 'danger'> = {
  low: 'muted',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: '접수완료',
  in_progress: '수리중',
  resolved: '처리완료',
  closed: '종료',
  cancelled: '취소',
}

interface TicketDto {
  id: string
  stationId: string
  chargerId: string | null
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  reporter: { id: string; name: string; email: string }
  assignee: { id: string; name: string; email: string } | null
  resolution: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
}

interface Props {
  tickets: TicketDto[]
  stations: Array<{ id: string; name: string }>
  stationMap: Record<string, { id: string; name: string }>
  staffList: Array<{ id: string; name: string; email: string }>
  role: UserRole
  currentUserId: string
}

export function TicketsClient({ tickets, stations, stationMap, staffList, role, currentUserId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<TicketDto | null>(null)

  const filtered = useMemo(() => {
    let items = tickets
    if (statusFilter !== 'all') items = items.filter((t) => t.status === statusFilter)
    if (search) {
      const k = search.toLowerCase()
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(k) ||
          t.description.toLowerCase().includes(k) ||
          (stationMap[t.stationId]?.name.toLowerCase().includes(k) ?? false),
      )
    }
    return items
  }, [tickets, search, statusFilter, stationMap])

  const counts = useMemo(() => {
    const r = { open: 0, in_progress: 0, resolved: 0, closed: 0, cancelled: 0 }
    for (const t of tickets) r[t.status]++
    return r
  }, [tickets])

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Kpi icon={AlertCircle} label="접수완료" count={counts.open} tone="info" />
        <Kpi icon={Wrench} label="수리중" count={counts.in_progress} tone="warning" />
        <Kpi icon={CheckCircle2} label="처리완료" count={counts.resolved} tone="success" />
        <Kpi icon={CheckCircle2} label="종료" count={counts.closed} tone="muted" />
        <Kpi icon={X} label="취소" count={counts.cancelled} tone="muted" />
      </div>

      {/* 검색 + 필터 + 신규 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 설명, 충전소 검색"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition',
                  statusFilter === s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {s === 'all' ? '전체' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          신규 접수
        </Button>
      </div>

      {/* 테이블 */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              조건에 맞는 티켓이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>접수일</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>충전소</TableHead>
                  <TableHead className="text-center">우선순위</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>접수자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setSelected(t)}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-xs">{CATEGORY_LABEL[t.category]}</TableCell>
                    <TableCell className="font-medium">
                      <div className="line-clamp-1">{t.title}</div>
                      {t.chargerId && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {t.chargerId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {stationMap[t.stationId]?.name ?? t.stationId}
                    </TableCell>
                    <TableCell className="text-center">
                      <PriorityBadge priority={t.priority} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={STATUS_LABEL[t.status]} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.assignee ? (
                        t.assignee.name
                      ) : (
                        <span className="text-muted-foreground">미배정</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{t.reporter.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCreate && (
        <CreateModal
          stations={stations}
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false)
            router.refresh()
          }}
        />
      )}

      {selected && (
        <DetailModal
          ticket={selected}
          station={stationMap[selected.stationId]}
          staffList={staffList}
          role={role}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  count,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  tone: 'success' | 'warning' | 'danger' | 'info' | 'muted'
}) {
  const wrapCls = {
    success: 'bg-success-soft text-success-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
    danger: 'bg-danger-soft text-danger-soft-foreground',
    info: 'bg-info-soft text-info-soft-foreground',
    muted: 'bg-muted text-muted-foreground',
  }[tone]
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={cn('rounded-md p-1.5', wrapCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums">{count}</p>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const tone = PRIORITY_TONE[priority]
  const cls = {
    muted: 'bg-muted text-muted-foreground',
    info: 'bg-info-soft text-info-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
    danger: 'bg-danger text-danger-foreground font-semibold',
  }[tone]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs', cls)}>
      {priority === 'urgent' && <AlertTriangle className="h-3 w-3" />}
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

// ─── 신규 접수 모달 ─────────────────────────────────────────────────

function CreateModal({
  stations,
  onClose,
  onDone,
}: {
  stations: Array<{ id: string; name: string }>
  onClose: () => void
  onDone: () => void
}) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? '')
  const [chargerId, setChargerId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('fault')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, chargerId: chargerId || null, title, description, category, priority }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? '접수 실패')
        return
      }
      onDone()
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="border-b p-4">
        <h3 className="text-base font-semibold">신규 티켓 접수</h3>
      </div>
      <div className="space-y-3 p-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger-soft-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label="충전소 *">
          <select value={stationId} onChange={(e) => setStationId(e.target.value)} className={inputCls}>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </Field>
        <Field label="충전기 ID (선택)" hint="특정 충전기 문제면 ID 입력. 예: CS001-1">
          <input value={chargerId} onChange={(e) => setChargerId(e.target.value)} placeholder="비워두면 충전소 전체" className={inputCls} />
        </Field>
        <Field label="분류">
          <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className={inputCls}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="우선순위">
          <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={inputCls}>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="제목 *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="간단한 한 줄 설명" className={inputCls} />
        </Field>
        <Field label="상세 설명 *">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="현상, 발생 시점, 시도해본 것 등"
            className={inputCls}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={submit} disabled={!title || !description || !stationId || loading}>
          {loading ? '접수 중...' : '접수'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── 상세/처리 모달 ────────────────────────────────────────────────

function DetailModal({
  ticket,
  station,
  staffList,
  role,
  currentUserId,
  onClose,
  onUpdated,
}: {
  ticket: TicketDto
  station?: { id: string; name: string }
  staffList: Array<{ id: string; name: string; email: string }>
  role: UserRole
  currentUserId: string
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority)
  const [assigneeUserId, setAssigneeUserId] = useState<string>(ticket.assignee?.id ?? '')
  const [resolution, setResolution] = useState(ticket.resolution ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isStaff = role === 'main_admin' || role === 'normal_admin'
  const isReporter = ticket.reporter.id === currentUserId
  const canCancel = isReporter && ticket.status === 'open'
  const finished = ticket.status === 'closed' || ticket.status === 'cancelled'

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      if (status !== ticket.status) payload.status = status
      if (isStaff && priority !== ticket.priority) payload.priority = priority
      if (isStaff && assigneeUserId !== (ticket.assignee?.id ?? '')) {
        payload.assigneeUserId = assigneeUserId
      }
      if (resolution !== (ticket.resolution ?? '')) payload.resolution = resolution

      if (Object.keys(payload).length === 0) {
        onClose()
        return
      }

      const r = await fetch(`/api/maintenance/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? '업데이트 실패')
        return
      }
      onUpdated()
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{ticket.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {station?.name ?? ticket.stationId}
              {ticket.chargerId && ` · ${ticket.chargerId}`}
              {' · '}
              {new Date(ticket.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={STATUS_LABEL[ticket.status]} />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger-soft-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">상세 설명</p>
          <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">{ticket.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">접수자</p>
            <p className="text-sm font-medium">{ticket.reporter.name}</p>
            <p className="text-muted-foreground">{ticket.reporter.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">분류</p>
            <p className="text-sm font-medium">{CATEGORY_LABEL[ticket.category]}</p>
          </div>
        </div>

        {!finished && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-semibold">처리</p>

            <Field label="상태">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className={inputCls}
              >
                <option value="open">접수완료</option>
                {isStaff && <option value="in_progress">수리중</option>}
                {isStaff && <option value="resolved">처리완료</option>}
                {isStaff && <option value="closed">종료</option>}
                {canCancel && <option value="cancelled">취소 (접수 철회)</option>}
              </select>
            </Field>

            {isStaff && (
              <>
                <Field label="우선순위">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className={inputCls}
                  >
                    {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="담당자">
                  <select
                    value={assigneeUserId}
                    onChange={(e) => setAssigneeUserId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">미배정</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <Field label="처리 내역">
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                placeholder="해결 방법, 교체 부품, 결과 등"
                className={inputCls}
                disabled={!isStaff}
              />
            </Field>
          </div>
        )}

        {finished && ticket.resolution && (
          <div className="border-t pt-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">처리 내역</p>
            <p className="whitespace-pre-wrap rounded-md bg-success-soft/40 p-3 text-sm">
              {ticket.resolution}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outline" onClick={onClose}>닫기</Button>
        {!finished && (
          <Button onClick={submit} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ─── Modal/Field helpers ───────────────────────────────────────────

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

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'
