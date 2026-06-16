'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Activity,
  Zap,
  AlertCircle,
  Battery,
  Clock,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type {
  Charger,
  ChargerStatus,
  ChargerType,
  ChargingStation,
} from '@/lib/adapters/station/types'
import {
  CHARGER_STATUS_LABEL,
  CONNECTOR_TYPE_LABEL,
} from '@/lib/adapters/station/types'

const POLL_INTERVAL_MS = 10_000

const STATUS_FILTERS: Array<{ key: 'all' | ChargerStatus; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'normal', label: '대기' },
  { key: 'charging', label: '충전중' },
  { key: 'maintenance', label: '점검중' },
  { key: 'fault', label: '고장' },
  { key: 'offline', label: '통신장애' },
]

const TYPE_FILTERS: Array<{ key: 'all' | ChargerType; label: string }> = [
  { key: 'all', label: '전체 타입' },
  { key: 'fast', label: '급속' },
  { key: 'slow', label: '완속' },
]

interface Props {
  chargers: Charger[]
  stations: ChargingStation[]
  stationMap: Record<string, ChargingStation>
  initialStationFilter: string
}

export function ChargersClient({
  chargers: initialChargers,
  stations,
  stationMap,
  initialStationFilter,
}: Props) {
  const [view, setView] = useState<'realtime' | 'inventory'>('realtime')
  const [chargers, setChargers] = useState<Charger[]>(initialChargers)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stationFilter, setStationFilter] = useState<string>(initialStationFilter)

  // 실시간 모드에서만 10초 polling
  useEffect(() => {
    if (view !== 'realtime') return
    let cancelled = false

    const fetchData = async () => {
      try {
        const url =
          stationFilter === 'all'
            ? '/api/stations/realtime'
            : `/api/stations/realtime?stationId=${stationFilter}`
        const r = await fetch(url, { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const json = await r.json()
        json.chargers.forEach((c: Charger) => {
          if (c.lastSeenAt) c.lastSeenAt = new Date(c.lastSeenAt)
          if (c.currentSession?.startedAt) {
            c.currentSession.startedAt = new Date(c.currentSession.startedAt)
          }
        })
        if (!cancelled) {
          setChargers(json.chargers)
          setLastFetched(new Date(json.fetchedAt))
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '데이터 불러오기 실패')
      }
    }
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [view, stationFilter])

  const counts = useMemo(() => {
    const byStatus: Record<ChargerStatus, number> = {
      normal: 0,
      charging: 0,
      maintenance: 0,
      fault: 0,
      offline: 0,
    }
    for (const c of chargers) byStatus[c.status]++
    return byStatus
  }, [chargers])

  return (
    <div className="space-y-4">
      {/* 보기 토글 + 라이브 인디케이터 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded border bg-card p-0.5">
          <ViewTab
            active={view === 'realtime'}
            onClick={() => setView('realtime')}
            icon={LayoutGrid}
            label="실시간 상태"
          />
          <ViewTab
            active={view === 'inventory'}
            onClick={() => setView('inventory')}
            icon={List}
            label="충전기 인벤토리"
          />
        </div>

        {view === 'realtime' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span>10초마다 자동 갱신</span>
            {lastFetched && (
              <>
                <span>/</span>
                <span suppressHydrationWarning>
                  마지막 갱신 {lastFetched.toLocaleTimeString('ko-KR')}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && view === 'realtime' && (
        <div className="flex items-center gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* KPI 공통 */}
      <div data-annotate="kpi" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Kpi
          icon={Zap}
          label="충전중"
          count={counts.charging}
          tone="info"
          highlight={view === 'realtime'}
        />
        <Kpi icon={Activity} label="대기" count={counts.normal} tone="success" />
        <Kpi icon={Activity} label="점검중" count={counts.maintenance} tone="warning" />
        <Kpi icon={AlertCircle} label="고장" count={counts.fault} tone="danger" />
        <Kpi icon={Activity} label="통신장애" count={counts.offline} tone="muted" />
      </div>

      {view === 'realtime' ? (
        <RealtimeView
          chargers={chargers}
          stations={stations}
          stationMap={stationMap}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
        />
      ) : (
        <InventoryView
          chargers={chargers}
          stations={stations}
          stationMap={stationMap}
          initialStationFilter={initialStationFilter}
        />
      )}
    </div>
  )
}

// ─── 실시간 뷰: 충전소별 섹션 + 카드 ─────────────────

function RealtimeView({
  chargers,
  stations,
  stationMap,
  stationFilter,
  setStationFilter,
}: {
  chargers: Charger[]
  stations: ChargingStation[]
  stationMap: Record<string, ChargingStation>
  stationFilter: string
  setStationFilter: (v: string) => void
}) {
  const groups = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, { station: ChargingStation; chargers: Charger[] }>()
    const filtered =
      stationFilter === 'all' ? chargers : chargers.filter((c) => c.stationId === stationFilter)
    for (const c of filtered) {
      const station = stationMap[c.stationId]
      if (!station) continue
      if (!map.has(c.stationId)) {
        order.push(c.stationId)
        map.set(c.stationId, { station, chargers: [] })
      }
      map.get(c.stationId)!.chargers.push(c)
    }
    return order.map((id) => map.get(id)!)
  }, [chargers, stationMap, stationFilter])

  return (
    <div className="space-y-4">
      <select
        value={stationFilter}
        onChange={(e) => setStationFilter(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="all">모든 충전소</option>
        {stations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.id})
          </option>
        ))}
      </select>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          <RefreshCw className="mx-auto h-4 w-4 animate-spin" />
          <p className="mt-2">데이터 불러오는 중...</p>
        </div>
      ) : (
        <div data-annotate="stations" className="space-y-4">
          {groups.map((g) => (
            <StationSection key={g.station.id} station={g.station} chargers={g.chargers} />
          ))}
        </div>
      )}
    </div>
  )
}

function StationSection({
  station,
  chargers,
}: {
  station: ChargingStation
  chargers: Charger[]
}) {
  const c = chargers.reduce(
    (acc, ch) => {
      acc[ch.status]++
      return acc
    },
    { normal: 0, charging: 0, maintenance: 0, fault: 0, offline: 0 } as Record<ChargerStatus, number>,
  )
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{station.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {station.id} {station.address ? `/ ${station.address}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-xs text-muted-foreground">총 {chargers.length}대</span>
          {c.charging > 0 && <MiniPill label="충전중" count={c.charging} tone="info" />}
          {c.fault > 0 && <MiniPill label="고장" count={c.fault} tone="danger" />}
          {c.maintenance > 0 && <MiniPill label="점검중" count={c.maintenance} tone="warning" />}
          {c.normal > 0 && <MiniPill label="대기" count={c.normal} tone="success" />}
          {c.offline > 0 && <MiniPill label="통신장애" count={c.offline} tone="muted" />}
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {chargers.map((ch) => (
          <ChargerCard key={ch.id} charger={ch} />
        ))}
      </div>
    </section>
  )
}

function ChargerCard({ charger }: { charger: Charger }) {
  const session = charger.currentSession
  return (
    <Card className={cn('shadow-sm', charger.status === 'charging' && 'border-info/40')}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium">{charger.id}</p>
          </div>
          <StatusBadge
            status={CHARGER_STATUS_LABEL[charger.status]}
            solid={charger.status === 'charging' || charger.status === 'fault'}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {charger.type === 'fast' ? '급속' : '완속'} {charger.capacity}kW
          </span>
          <span>/</span>
          <span>{CONNECTOR_TYPE_LABEL[charger.connectorType]}</span>
        </div>

        {session ? (
          <div className="space-y-2 rounded-md bg-info-soft/40 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-info-soft-foreground">
                <Battery className="h-3.5 w-3.5" />
                충전율
              </span>
              <span className="font-bold tabular-nums text-info-soft-foreground">
                {session.soc}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-info transition-all"
                style={{ width: `${session.soc}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatElapsed(session.startedAt)}
              </span>
              <span>
                {session.energyKwh}kWh / {session.userAlias}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>오늘 사용 {charger.todayUsageCount ?? 0}건</span>
            {charger.lastSeenAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(charger.lastSeenAt)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── 인벤토리 뷰: 검색,필터 + 테이블 ─────────────────

function InventoryView({
  chargers,
  stations,
  stationMap,
  initialStationFilter,
}: {
  chargers: Charger[]
  stations: ChargingStation[]
  stationMap: Record<string, ChargingStation>
  initialStationFilter: string
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ChargerStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ChargerType>('all')
  const [stationFilter, setStationFilter] = useState<string>(initialStationFilter)

  const filtered = useMemo(() => {
    let items = chargers
    if (stationFilter !== 'all') items = items.filter((c) => c.stationId === stationFilter)
    if (statusFilter !== 'all') items = items.filter((c) => c.status === statusFilter)
    if (typeFilter !== 'all') items = items.filter((c) => c.type === typeFilter)
    if (search) {
      const k = search.toLowerCase()
      items = items.filter(
        (c) =>
          c.id.toLowerCase().includes(k) ||
          c.serial.toLowerCase().includes(k) ||
          (stationMap[c.stationId]?.name.toLowerCase().includes(k) ?? false),
      )
    }
    return items
  }, [chargers, search, statusFilter, typeFilter, stationFilter, stationMap])

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="충전기 ID, 시리얼, 충전소명 검색"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">모든 충전소</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              {TYPE_FILTERS.map((f) => (
                <FilterBtn
                  key={f.key}
                  active={typeFilter === f.key}
                  onClick={() => setTypeFilter(f.key)}
                  label={f.label}
                />
              ))}
            </div>
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <FilterBtn
                  key={f.key}
                  active={statusFilter === f.key}
                  onClick={() => setStatusFilter(f.key)}
                  label={f.label}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-annotate="inventory-table" className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              조건에 맞는 충전기가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>충전기 ID</TableHead>
                  <TableHead>충전소</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>커넥터</TableHead>
                  <TableHead className="text-right">용량</TableHead>
                  <TableHead>펌웨어</TableHead>
                  <TableHead>마지막 통신</TableHead>
                  <TableHead className="text-right">오늘 사용</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const station = stationMap[c.stationId]
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell>
                        {station ? (
                          <Link
                            href={`/station-info/info?id=${station.id}`}
                            className="text-sm font-medium hover:text-primary"
                          >
                            {station.name}
                          </Link>
                        ) : (
                          c.stationId
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-xs font-medium',
                            c.type === 'fast'
                              ? 'bg-info-soft text-info-soft-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {c.type === 'fast' ? '급속' : '완속'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CONNECTOR_TYPE_LABEL[c.connectorType]}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {c.capacity}kW
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        v{c.firmwareVersion ?? '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {c.lastSeenAt ? formatRelativeTime(c.lastSeenAt) : '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.todayUsageCount ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={CHARGER_STATUS_LABEL[c.status]} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 공통 컴포넌트 ─────────────────────────────────

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted/60',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function Kpi({
  icon: Icon,
  label,
  count,
  tone,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  tone: 'success' | 'warning' | 'danger' | 'info' | 'muted'
  highlight?: boolean
}) {
  const wrapCls = {
    success: 'bg-success-soft text-success-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
    danger: 'bg-danger-soft text-danger-soft-foreground',
    info: 'bg-info-soft text-info-soft-foreground',
    muted: 'bg-muted text-muted-foreground',
  }[tone]
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4',
        highlight && 'border-info/40 ring-2 ring-info/15',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={cn('rounded-md p-1.5', wrapCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{count}</p>
    </div>
  )
}

function MiniPill({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: 'success' | 'warning' | 'danger' | 'info' | 'muted'
}) {
  const cls = {
    info: 'bg-info-soft text-info-soft-foreground',
    danger: 'bg-danger-soft text-danger-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
    success: 'bg-success-soft text-success-soft-foreground',
    muted: 'bg-muted text-muted-foreground',
  }[tone]
  return (
    <span className={cn('rounded px-2 py-0.5 text-[11px] font-medium tabular-nums', cls)}>
      {label} {count}
    </span>
  )
}

function FilterBtn({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-muted-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

function formatElapsed(start: Date): string {
  const sec = Math.floor((Date.now() - start.getTime()) / 1000)
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 경과`
  return `${Math.floor(min / 60)}시간 ${min % 60}분 경과`
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}초 전`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  return `${day}일 전`
}
