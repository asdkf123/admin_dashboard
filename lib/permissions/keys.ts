/**
 * 모든 권한 키와 한글 라벨.
 *
 * 패턴: `<action>:<resource>` (e.g. view:revenue, manage:tickets)
 * - view: 읽기 권한
 * - manage: CRUD 또는 상태 변경 권한
 * - notify: 발송/공지 권한
 */

export const ALL_PERMISSIONS = [
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
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

export const PERMISSION_LABEL: Record<Permission, string> = {
  'view:dashboard': '대시보드 조회',
  'view:stations': '충전소 정보 조회',
  'view:revenue': '매출 정보 조회',
  'view:settlement': '정산 이력 조회',
  'view:contracts': '계약 정보 조회',
  'view:audit_log': '감사 로그 조회',
  'view:notices': '공지,자료 조회',
  'manage:tickets': '유지보수 티켓 처리',
  'manage:inspections': '점검 일정 관리',
  'manage:accounts': '계정 관리',
  'manage:notices': '공지,자료 작성',
  'manage:stations': '충전소 그룹 관리',
  'notify:broadcast': '메일/문자 발송',
}

/** 권한별 카테고리 (UI에서 그룹 표시용) */
export const PERMISSION_GROUP: Record<Permission, string> = {
  'view:dashboard': '조회',
  'view:stations': '조회',
  'view:revenue': '조회 (민감)',
  'view:settlement': '조회 (민감)',
  'view:contracts': '조회 (민감)',
  'view:audit_log': '조회 (민감)',
  'view:notices': '조회',
  'manage:tickets': '처리',
  'manage:inspections': '처리',
  'manage:accounts': '관리',
  'manage:notices': '관리',
  'manage:stations': '관리',
  'notify:broadcast': '관리',
}
