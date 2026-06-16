import { cookies } from 'next/headers'
import { prisma } from '@/lib/adapters/db'
import { stationAdapter, type ChargingStation } from '@/lib/adapters/station'
import type { User } from '@prisma/client'

async function isPreviewMode(): Promise<boolean> {
  const v = (await cookies()).get('__preview_as')?.value
  return v === 'site_owner' || v === 'oem'
}

/**
 * 로그인한 user가 볼 수 있는 충전소 목록.
 *
 * - main_admin / normal_admin: 모든 충전소
 * - partner_admin: 본인의 Account 매핑에 있는 충전소만
 *
 * partner_admin이 1개의 Account도 없으면 빈 배열 반환 (가입은 됐지만 권한 미부여 케이스).
 *
 * Preview override — 보고용 시뮬레이션 모드(__preview_as 쿠키)에서는 사용자가
 * 실제로는 main_admin이라 Account 매핑이 없어도 데모용으로 모든 충전소를 보여줌.
 */
export async function getVisibleStations(user: User): Promise<ChargingStation[]> {
  if (user.role === 'partner_admin' && !(await isPreviewMode())) {
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: { stationId: true },
    })
    if (accounts.length === 0) return []
    const { items } = await stationAdapter.listStations({
      ids: accounts.map(a => a.stationId),
      limit: 1000,
    })
    return items
  }

  // 운영자 + preview 모드: 모든 충전소
  const { items } = await stationAdapter.listStations({ limit: 1000 })
  return items
}

/**
 * 특정 충전소에 대한 접근 권한 체크.
 * partner_admin은 본인 Account에 매핑된 station만 접근 가능.
 * Preview 모드에선 모두 통과 (데모 목적).
 */
export async function canAccessStation(user: User, stationId: string): Promise<boolean> {
  if (user.role !== 'partner_admin') return true
  if (await isPreviewMode()) return true
  const account = await prisma.account.findUnique({
    where: { userId_stationId: { userId: user.id, stationId } },
  })
  return account !== null
}
