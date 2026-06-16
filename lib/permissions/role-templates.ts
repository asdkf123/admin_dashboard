import type { UserRole } from '@/types/navigation'
import type { Permission } from './keys'

/**
 * Role별 기본 권한 템플릿. 운영자는 이 위에 사용자별로 추가 grant 가능.
 *
 * - main_admin: 모든 권한 (시스템 관리자)
 * - normal_admin: 모니터링/CS/유지보수 (매출,정산,계정,감사로그,발송 등 민감 영역 제외)
 * - partner_admin: 충전소 owner 관점 (본인 충전소만 — 데이터 단위 차단은 visible.ts에서 처리)
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  main_admin: [
    'view:dashboard',
    'view:stations',
    'view:revenue',
    'view:settlement',
    'view:contracts',
    'view:audit_log',
    'view:notices',
    'manage:tickets',
    'manage:inspections',
    'manage:accounts',
    'manage:notices',
    'manage:stations',
    'notify:broadcast',
  ],
  normal_admin: [
    'view:dashboard',
    'view:stations',
    'view:notices',
    'manage:tickets',
    'manage:inspections',
  ],
  partner_admin: [
    'view:dashboard',
    'view:stations',
    'view:contracts',
    'view:notices',
    'manage:tickets',
    'manage:inspections',
    // view:revenue, view:settlement는 기본 미부여
    // — 운영자가 사용자별 grant로 OEM 등에게만 추가 부여
  ],
}
