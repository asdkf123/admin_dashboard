'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Lock, Unlock, LogOut, KeyRound, AlertCircle, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/navigation'
import {
  ALL_PERMISSIONS,
  PERMISSION_LABEL,
  PERMISSION_GROUP,
  type Permission,
} from '@/lib/permissions/keys'
import { ROLE_PERMISSIONS } from '@/lib/permissions/role-templates'

const ROLE_LABEL: Record<UserRole, string> = {
  main_admin: '본사 운영팀',
  normal_admin: '상면관리자',
  partner_admin: '파트너',
}

const ROLE_FILTERS: Array<{ key: 'all' | UserRole; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'main_admin', label: '본사 운영팀' },
  { key: 'normal_admin', label: '상면관리자' },
  { key: 'partner_admin', label: '파트너' },
]

interface UserDto {
  id: string
  name: string
  email: string
  phone: string
  businessNo: string | null
  role: UserRole
  lockedUntil: string | null
  lastLoginAt: string | null
  createdAt: string
  mustChangePassword: boolean
  failedLoginCount: number
  accountCount: number
  activeSessionCount: number
  extraPermissions: string[]
}

interface Props {
  users: UserDto[]
  currentUserId: string
}

export function AccountsPermissionsClient({ users, currentUserId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ tone: 'success' | 'danger'; msg: string } | null>(null)
  const [managingPermsFor, setManagingPermsFor] = useState<UserDto | null>(null)

  const filtered = useMemo(() => {
    let items = users
    if (roleFilter !== 'all') items = items.filter((u) => u.role === roleFilter)
    if (search) {
      const k = search.toLowerCase()
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(k) ||
          u.email.toLowerCase().includes(k) ||
          u.phone.includes(k) ||
          (u.businessNo?.includes(k) ?? false),
      )
    }
    return items
  }, [users, search, roleFilter])

  const counts = useMemo(() => {
    const r: Record<UserRole, number> = { main_admin: 0, normal_admin: 0, partner_admin: 0 }
    for (const u of users) r[u.role]++
    return r
  }, [users])

  const callAction = async (
    label: string,
    fn: () => Promise<Response>,
    successMsg: string,
  ) => {
    setBusyId(label)
    setBanner(null)
    try {
      const r = await fn()
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setBanner({ tone: 'danger', msg: data.error ?? '요청 실패' })
        return
      }
      setBanner({ tone: 'success', msg: data.tempPassword ? `${successMsg} 임시 비밀번호: ${data.tempPassword}` : successMsg })
      router.refresh()
    } catch {
      setBanner({ tone: 'danger', msg: '네트워크 오류' })
    } finally {
      setBusyId(null)
    }
  }

  const lockUser = (u: UserDto) =>
    callAction(
      `lock-${u.id}`,
      () => fetch(`/api/admin/users/${u.id}/lock`, { method: 'POST' }),
      `${u.name} 계정을 잠갔습니다.`,
    )

  const unlockUser = (u: UserDto) =>
    callAction(
      `unlock-${u.id}`,
      () => fetch(`/api/admin/users/${u.id}/lock`, { method: 'DELETE' }),
      `${u.name} 계정 잠금을 해제했습니다.`,
    )

  const forceLogout = (u: UserDto) =>
    callAction(
      `logout-${u.id}`,
      () => fetch(`/api/admin/users/${u.id}/sessions`, { method: 'DELETE' }),
      `${u.name}의 모든 세션을 종료했습니다.`,
    )

  const resetPassword = (u: UserDto) => {
    if (!confirm(`${u.name}의 비밀번호를 재발급합니다. 사용자는 다음 로그인 시 변경이 강제됩니다.`)) return
    callAction(
      `pwreset-${u.id}`,
      () => fetch(`/api/admin/users/${u.id}/password-reset`, { method: 'POST' }),
      `${u.name}의 비밀번호를 재발급했습니다.`,
    )
  }

  const changeRole = (u: UserDto, role: UserRole) => {
    if (u.role === role) return
    if (!confirm(`${u.name}의 권한을 [${ROLE_LABEL[role]}](으)로 변경합니다.`)) return
    callAction(
      `role-${u.id}`,
      () =>
        fetch(`/api/admin/users/${u.id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }),
      `${u.name}의 권한을 [${ROLE_LABEL[role]}](으)로 변경했습니다.`,
    )
  }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div data-annotate="role-summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryItem label="전체 계정" value={users.length} tone="primary" />
        <SummaryItem label="본사 운영팀" value={counts.main_admin} tone="info" />
        <SummaryItem label="상면관리자" value={counts.normal_admin} tone="muted" />
        <SummaryItem label="파트너" value={counts.partner_admin} tone="success" />
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
          <span className="break-all">{banner.msg}</span>
        </div>
      )}

      {/* 검색 + 필터 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 이메일, 전화, 사업자번호 검색"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium transition',
                roleFilter === f.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <Card data-annotate="user-table" className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              조건에 맞는 계정이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>휴대폰</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-right">충전소</TableHead>
                  <TableHead className="text-right">세션</TableHead>
                  <TableHead>마지막 로그인</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const locked = u.lockedUntil ? new Date(u.lockedUntil) > new Date() : false
                  const isSelf = u.id === currentUserId
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.name}</div>
                        {u.businessNo && (
                          <div className="font-mono text-xs text-muted-foreground">
                            {u.businessNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                      <TableCell>
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value as UserRole)}
                          disabled={isSelf && u.role === 'main_admin'}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <option value="main_admin">본사 운영팀</option>
                          <option value="normal_admin">상면관리자</option>
                          <option value="partner_admin">파트너</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-center">
                        {locked ? (
                          <StatusBadge status="비활성">잠금</StatusBadge>
                        ) : u.mustChangePassword ? (
                          <StatusBadge status="만료임박">비번변경필요</StatusBadge>
                        ) : (
                          <StatusBadge status="활성" />
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.accountCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.activeSessionCount > 0 ? (
                          <span className="font-semibold text-info">{u.activeSessionCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString('ko-KR')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {locked ? (
                            <ActionBtn
                              icon={Unlock}
                              label="계정 잠금 해제"
                              onClick={() => unlockUser(u)}
                              busy={busyId === `unlock-${u.id}`}
                            />
                          ) : (
                            <ActionBtn
                              icon={Lock}
                              label="계정 잠금"
                              onClick={() => lockUser(u)}
                              disabled={isSelf}
                              busy={busyId === `lock-${u.id}`}
                              tone="danger"
                            />
                          )}
                          <ActionBtn
                            icon={LogOut}
                            label="강제 로그아웃"
                            onClick={() => forceLogout(u)}
                            disabled={u.activeSessionCount === 0}
                            busy={busyId === `logout-${u.id}`}
                          />
                          <ActionBtn
                            icon={KeyRound}
                            label="비번 재발급"
                            onClick={() => resetPassword(u)}
                            busy={busyId === `pwreset-${u.id}`}
                          />
                          <ActionBtn
                            icon={Shield}
                            label="권한 부여"
                            onClick={() => setManagingPermsFor(u)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {managingPermsFor && (
        <PermissionsModal
          user={managingPermsFor}
          onClose={() => setManagingPermsFor(null)}
          onChanged={() => {
            setManagingPermsFor(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// ─── 권한 관리 모달 ──────────────────────────────────────────────

function PermissionsModal({
  user,
  onClose,
  onChanged,
}: {
  user: UserDto
  onClose: () => void
  onChanged: () => void
}) {
  const basePermissions = useMemo(() => new Set(ROLE_PERMISSIONS[user.role]), [user.role])
  const [extras, setExtras] = useState<Set<Permission>>(
    () => new Set(user.extraPermissions as Permission[]),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 그룹별로 묶기
  const grouped = useMemo(() => {
    const g: Record<string, Permission[]> = {}
    for (const p of ALL_PERMISSIONS) {
      const grp = PERMISSION_GROUP[p]
      if (!g[grp]) g[grp] = []
      g[grp].push(p)
    }
    return g
  }, [])

  const toggle = (p: Permission) => {
    if (basePermissions.has(p)) return  // role 기본은 토글 불가
    const next = new Set(extras)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    setExtras(next)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const original = new Set(user.extraPermissions as Permission[])
      const toAdd = [...extras].filter((p) => !original.has(p))
      const toRemove = [...original].filter((p) => !extras.has(p))

      for (const p of toAdd) {
        const r = await fetch(`/api/admin/users/${user.id}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission: p }),
        })
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          setError(data.error ?? '권한 부여 실패')
          return
        }
      }
      for (const p of toRemove) {
        await fetch(`/api/admin/users/${user.id}/permissions?permission=${p}`, {
          method: 'DELETE',
        })
      }
      onChanged()
    } catch {
      setError('네트워크 오류')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">{user.name}의 권한</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            role 기본 권한은 회색(고정), 추가 grant는 토글 가능합니다.
          </p>
        </div>

        <div className="space-y-4 p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger-soft-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {Object.entries(grouped).map(([groupName, perms]) => (
            <div key={groupName}>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{groupName}</p>
              <div className="space-y-1">
                {perms.map((p) => {
                  const isBase = basePermissions.has(p)
                  const isGranted = extras.has(p)
                  const effective = isBase || isGranted
                  return (
                    <label
                      key={p}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm',
                        isBase
                          ? 'bg-muted/40 cursor-not-allowed'
                          : isGranted
                            ? 'bg-primary/5 hover:bg-primary/10'
                            : 'hover:bg-muted/30',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={effective}
                        disabled={isBase}
                        onChange={() => toggle(p)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span className={cn('flex-1', isBase && 'text-muted-foreground')}>
                        {PERMISSION_LABEL[p]}
                      </span>
                      {isBase && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          기본
                        </span>
                      )}
                      {!isBase && isGranted && (
                        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          추가
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
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
  tone: 'primary' | 'info' | 'muted' | 'success'
}) {
  const dotCls = {
    primary: 'bg-primary',
    info: 'bg-info',
    muted: 'bg-muted-foreground',
    success: 'bg-success',
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

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  busy,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  tone?: 'danger'
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      title={label}
      disabled={disabled || busy}
      onClick={onClick}
      className={cn(
        'h-7 gap-1 px-2 text-xs font-medium',
        tone === 'danger' && 'text-danger hover:bg-danger-soft hover:text-danger',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </Button>
  )
}
