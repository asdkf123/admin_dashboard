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
  CalendarPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/navigation'

type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
type InspectionResult = 'pass' | 'fail' | 'needs_repair'

const STATUS_LABEL: Record<InspectionStatus, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
}

const RESULT_LABEL: Record<InspectionResult, string> = {
  pass: '정상',
  fail: '실패',
  needs_repair: '수리 필요',
}

const RESULT_TONE: Record<InspectionResult, '정상' | '고장' | '점검중'> = {
  pass: '정상',
  fail: '고장',
  needs_repair: '점검중',
}

interface InspectionDto {
  id: string
  stationId: string
  chargerId: string | null
  inspector: { id: string; name: string; email: string } | null
  scheduledAt: string
  performedAt: string | null
  status: InspectionStatus
  result: InspectionResult | null
  notes: string | null
  nextScheduledAt: string | null
  createdAt: string
}

interface Props {
  inspections: InspectionDto[]
  stations: Array<{ id: string; name: string }>
  stationMap: Record<string, { id: string; name: string }>
  staffList: Array<{ id: string; name: string; email: string }>
  role: UserRole
}

export function InspectionClient({ inspections, stations, stationMap, staffList, role }: Props) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<'all' | InspectionStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<InspectionDto | null>(null)
  // 마운트 시점 1회 시각 (useState lazy initializer로 purity 우회)
  const [currentTime] = useState(() => Date.now())

  const isStaff = role === 'main_admin' || role === 'normal_admin'

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return inspections
    return inspections.filter((i) => i.status === statusFilter)
  }, [inspections, statusFilter])

  const counts = useMemo(() => {
    const r = { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0 }
    for (const i of inspections) r[i.status]++
    return r
  }, [inspections])

  const upcoming = useMemo(() => {
    return inspections
      .filter(
        (i) =>
          i.status === 'scheduled' &&
          new Date(i.scheduledAt).getTime() >= currentTime &&
          new Date(i.scheduledAt).getTime() <= currentTime + 30 * 24 * 60 * 60 * 1000,
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [inspections, currentTime])

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div data-annotate="status-counter" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={CalendarPlus} label="예정" count={counts.scheduled} tone="info" />
        <Kpi icon={Wrench} label="진행중" count={counts.in_progress} tone="warning" />
        <Kpi icon={CheckCircle2} label="완료" count={counts.completed} tone="success" />
        <Kpi icon={AlertCircle} label="취소" count={counts.cancelled} tone="muted" />
      </div>

      {/* 임박한 점검 */}
      {upcoming.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-warning" />
              임박한 점검 ({upcoming.length})
            </p>
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium">{stationMap[i.stationId]?.name ?? i.stationId}</p>
                    {i.notes && <p className="line-clamp-1 text-xs text-muted-foreground">{i.notes}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {new Date(i.scheduledAt).toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 + 신규 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {(['all', 'scheduled', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
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
        {isStaff && (
          <Button onClick={() => setShowCreate(true)} className="gap-1">
            <CalendarPlus className="h-3.5 w-3.5" />
            점검 일정 등록
          </Button>
        )}
      </div>

      {/* 테이블 */}
      <Card data-annotate="inspection-table" className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              정기정검 이력이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>예정일</TableHead>
                  <TableHead>충전소</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-center">결과</TableHead>
                  <TableHead>점검자</TableHead>
                  <TableHead>실시일</TableHead>
                  <TableHead>다음 점검</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setSelected(i)}
                  >
                    <TableCell className="text-xs" suppressHydrationWarning>
                      {new Date(i.scheduledAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {stationMap[i.stationId]?.name ?? i.stationId}
                      {i.chargerId && (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {i.chargerId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        status={
                          i.status === 'scheduled'
                            ? '접수완료'
                            : i.status === 'in_progress'
                              ? '진행중'
                              : i.status === 'completed'
                                ? '처리완료'
                                : '취소'
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {i.result ? (
                        <StatusBadge status={RESULT_TONE[i.result]}>{RESULT_LABEL[i.result]}</StatusBadge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {i.inspector ? i.inspector.name : <span className="text-muted-foreground">미배정</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {i.performedAt
                        ? new Date(i.performedAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {i.nextScheduledAt
                        ? new Date(i.nextScheduledAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCreate && isStaff && (
        <CreateModal
          stations={stations}
          staffList={staffList}
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false)
            router.refresh()
          }}
        />
      )}

      {selected && (
        <DetailModal
          inspection={selected}
          station={stationMap[selected.stationId]}
          staffList={staffList}
          isStaff={isStaff}
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
  tone: 'success' | 'warning' | 'info' | 'muted'
}) {
  const wrapCls = {
    success: 'bg-success-soft text-success-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
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

function CreateModal({
  stations,
  staffList,
  onClose,
  onDone,
}: {
  stations: Array<{ id: string; name: string }>
  staffList: Array<{ id: string; name: string; email: string }>
  onClose: () => void
  onDone: () => void
}) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? '')
  const [chargerId, setChargerId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [inspectorUserId, setInspectorUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/maintenance/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          chargerId: chargerId || null,
          scheduledAt,
          inspectorUserId: inspectorUserId || null,
          notes: notes || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? '등록 실패')
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
        <h3 className="text-base font-semibold">점검 일정 등록</h3>
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
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>
        </Field>
        <Field label="충전기 ID (선택)">
          <input value={chargerId} onChange={(e) => setChargerId(e.target.value)} placeholder="비우면 충전소 전체" className={inputCls} />
        </Field>
        <Field label="예정 일시 *">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="점검자 (선택)">
          <select value={inspectorUserId} onChange={(e) => setInspectorUserId(e.target.value)} className={inputCls}>
            <option value="">미배정 (나중에 지정)</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </Field>
        <Field label="메모 (선택)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="점검 사유, 체크리스트 등"
            className={inputCls}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={submit} disabled={!stationId || !scheduledAt || loading}>
          {loading ? '등록 중...' : '등록'}
        </Button>
      </div>
    </Modal>
  )
}

function DetailModal({
  inspection,
  station,
  staffList,
  isStaff,
  onClose,
  onUpdated,
}: {
  inspection: InspectionDto
  station?: { id: string; name: string }
  staffList: Array<{ id: string; name: string; email: string }>
  isStaff: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus] = useState<InspectionStatus>(inspection.status)
  const [result, setResult] = useState<InspectionResult | ''>(inspection.result ?? '')
  const [inspectorUserId, setInspectorUserId] = useState(inspection.inspector?.id ?? '')
  const [notes, setNotes] = useState(inspection.notes ?? '')
  const [nextScheduledAt, setNextScheduledAt] = useState(
    inspection.nextScheduledAt ? inspection.nextScheduledAt.slice(0, 16) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/maintenance/inspections/${inspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          result: result || null,
          notes: notes || null,
          nextScheduledAt: nextScheduledAt || null,
          inspectorUserId: inspectorUserId || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? '저장 실패')
        return
      }
      onUpdated()
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }

  const readOnly = !isStaff

  return (
    <Modal onClose={onClose} wide>
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">
              {station?.name ?? inspection.stationId} 점검
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
              예정 {new Date(inspection.scheduledAt).toLocaleString('ko-KR')}
              {inspection.chargerId && ` · ${inspection.chargerId}`}
            </p>
          </div>
          <StatusBadge
            status={
              inspection.status === 'scheduled'
                ? '접수완료'
                : inspection.status === 'in_progress'
                  ? '진행중'
                  : inspection.status === 'completed'
                    ? '처리완료'
                    : '취소'
            }
          />
        </div>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger-soft-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="상태">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InspectionStatus)}
            disabled={readOnly}
            className={inputCls}
          >
            <option value="scheduled">예정</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </Field>

        <Field label="점검 결과">
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as InspectionResult | '')}
            disabled={readOnly}
            className={inputCls}
          >
            <option value="">미입력</option>
            <option value="pass">정상</option>
            <option value="needs_repair">수리 필요</option>
            <option value="fail">실패</option>
          </select>
        </Field>

        {isStaff && (
          <Field label="점검자">
            <select
              value={inspectorUserId}
              onChange={(e) => setInspectorUserId(e.target.value)}
              className={inputCls}
            >
              <option value="">미배정</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="다음 점검 예정일">
          <input
            type="datetime-local"
            value={nextScheduledAt}
            onChange={(e) => setNextScheduledAt(e.target.value)}
            disabled={readOnly}
            className={inputCls}
          />
        </Field>

        <Field label="메모 / 결과 상세">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly}
            rows={5}
            placeholder="점검 결과, 발견 사항, 후속 조치 등"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-2 border-t p-4">
        <Button
          variant="outline"
          disabled={inspection.status !== 'completed'}
          onClick={() => {
            const blob = new Blob(
              [
                `정기 점검 내역서\n\n점검 ID: ${inspection.id}\n점검 일자: ${inspection.performedAt ?? inspection.scheduledAt}\n충전소: ${station?.name ?? inspection.stationId}\n담당자: ${inspection.inspector?.name ?? '-'}\n결과: ${inspection.result ?? '-'}\n메모: ${inspection.notes ?? '-'}\n`,
              ],
              { type: 'text/plain;charset=utf-8' },
            )
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `inspection-${inspection.id}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          title={inspection.status !== 'completed' ? '점검 완료 후 다운로드 가능' : '점검 내역서 다운로드'}
          className="gap-1"
        >
          내역서 다운로드
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>닫기</Button>
          {!readOnly && (
            <Button onClick={submit} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          )}
        </div>
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

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'
