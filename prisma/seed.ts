import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  // 간단한 테스트 계정 (개발 편의용)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      passwordHash: await hashPassword('Test1234!@'),
      name: '테스트 사용자',
      phone: '010-0000-9999',
      role: 'main_admin',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  })
  console.log(`✓ test 계정: ${testUser.email} / Test1234!@`)

  // 사용자 요청 테스트 계정 (정책상 짧지만 seed 직접 hash이므로 로그인 가능)
  const qqUser = await prisma.user.upsert({
    where: { email: 'qq@qq.q' },
    update: { passwordHash: await hashPassword('qwe123!@#') },
    create: {
      email: 'qq@qq.q',
      passwordHash: await hashPassword('qwe123!@#'),
      name: 'qq 테스터',
      phone: '010-0000-2222',
      role: 'main_admin',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  })
  console.log(`✓ test 계정: ${qqUser.email} / qwe123!@#`)

  // 운영자 1명 — 초기 로그인용
  const adminEmail = 'admin@chargev.local'
  const adminPassword = 'Admin1234!@'

  const passwordHash = await hashPassword(adminPassword)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: '운영 관리자',
      phone: '010-0000-0000',
      role: 'main_admin',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  })

  console.log(`✓ main_admin: ${admin.email}`)
  console.log(`  password: ${adminPassword}`)

  // 일반 직원 1명 (테스트용)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@chargev.local' },
    update: {},
    create: {
      email: 'staff@chargev.local',
      passwordHash: await hashPassword('Staff1234!@'),
      name: '일반 직원',
      phone: '010-0000-0001',
      role: 'normal_admin',
      emailVerifiedAt: new Date(),
    },
  })
  console.log(`✓ normal_admin: ${staff.email}`)

  // 파트너 1명 + Account 2개 (mock 충전소 CS001, CS128 owner)
  const partner = await prisma.user.upsert({
    where: { email: 'partner@example.com' },
    update: {},
    create: {
      email: 'partner@example.com',
      passwordHash: await hashPassword('Partner1234!@'),
      name: '강남파트너',
      phone: '010-1111-1111',
      businessNo: '1234567890',
      role: 'partner_admin',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  })

  for (const stationId of ['CS001', 'CS128']) {
    await prisma.account.upsert({
      where: { userId_stationId: { userId: partner.id, stationId } },
      update: {},
      create: { userId: partner.id, stationId, scopeRole: 'owner' },
    })
  }
  console.log(`✓ partner_admin: ${partner.email} (CS001, CS128 owner)`)

  // ─── 유지보수 샘플 데이터 ─────────────────────────────────────────
  const existingTickets = await prisma.maintenanceTicket.count()
  if (existingTickets === 0) {
    const day = 24 * 60 * 60 * 1000
    await prisma.maintenanceTicket.createMany({
      data: [
        {
          stationId: 'CS047',
          chargerId: 'CS047-1',
          title: '1번 충전기 충전 시작 안됨',
          description: '카드 태깅 후 충전이 시작되지 않습니다. 안내 음성도 안 나옵니다.',
          category: 'fault',
          priority: 'high',
          status: 'in_progress',
          reporterUserId: partner.id,
          assigneeUserId: staff.id,
          createdAt: new Date(Date.now() - 2 * day),
        },
        {
          stationId: 'CS023',
          chargerId: 'CS023-2',
          title: '커넥터 케이블 손상 신고',
          description: '2번 충전기 케이블 피복이 벗겨져 있습니다.',
          category: 'fault',
          priority: 'urgent',
          status: 'open',
          reporterUserId: partner.id,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          stationId: 'CS001',
          title: '정기 점검 요청',
          description: '연간 정기 점검 일정 잡아주세요.',
          category: 'maintenance_request',
          priority: 'normal',
          status: 'resolved',
          reporterUserId: partner.id,
          assigneeUserId: staff.id,
          resolution: '2026-05-10 정기점검 완료. 다음 점검 2026-08-10 예정.',
          resolvedAt: new Date(Date.now() - 5 * day),
          createdAt: new Date(Date.now() - 14 * day),
        },
      ],
    })
    console.log(`✓ 샘플 티켓 3건 생성`)
  }

  const existingInspections = await prisma.inspection.count()
  if (existingInspections === 0) {
    const day = 24 * 60 * 60 * 1000
    await prisma.inspection.createMany({
      data: [
        {
          stationId: 'CS001',
          inspectorUserId: staff.id,
          scheduledAt: new Date('2026-04-15T10:00:00'),
          performedAt: new Date('2026-04-15T10:30:00'),
          status: 'completed',
          result: 'pass',
          notes: '전 충전기 정상 동작 확인. 펌웨어 최신.',
          nextScheduledAt: new Date('2026-07-15T10:00:00'),
        },
        {
          stationId: 'CS023',
          inspectorUserId: staff.id,
          scheduledAt: new Date('2026-05-10T14:00:00'),
          performedAt: new Date('2026-05-10T14:30:00'),
          status: 'completed',
          result: 'needs_repair',
          notes: '2번 충전기 커넥터 케이블 교체 필요. 부품 발주.',
          nextScheduledAt: new Date('2026-06-15T14:00:00'),
        },
        {
          stationId: 'CS047',
          scheduledAt: new Date(Date.now() + 7 * day),
          status: 'scheduled',
          notes: '월간 정기 점검 예정.',
        },
        {
          stationId: 'CS112',
          inspectorUserId: staff.id,
          scheduledAt: new Date(Date.now() - 1 * day),
          status: 'in_progress',
          notes: '판교 충전소 8대 점검 중. 4대 완료.',
        },
      ],
    })
    console.log(`✓ 샘플 점검 4건 생성`)
  }

  // ─── 공지사항 샘플 ────────────────────────────────────────────────
  const noticeCount = await prisma.notice.count()
  if (noticeCount === 0) {
    await prisma.notice.createMany({
      data: [
        {
          kind: 'maintenance',
          title: '6/15 새벽 2-4시 정기점검 — 서비스 일시 중단',
          body: '시스템 안정성 향상을 위한 정기점검이 진행됩니다. 점검 시간 동안 로그인 및 대시보드 접근이 제한됩니다.',
          publishedAt: new Date('2026-05-20T09:00:00'),
          pinned: true,
        },
        {
          kind: 'feature',
          title: '월간 운영 리포트 PDF 자동 발송 기능 추가',
          body: '매월 1일 전월 운영 현황 리포트가 등록된 이메일로 자동 발송됩니다. 마이페이지에서 수신 여부를 설정할 수 있습니다.',
          publishedAt: new Date('2026-05-15T09:00:00'),
        },
        {
          kind: 'security',
          title: '비밀번호 정책 강화 안내',
          body: '6월부터 모든 계정의 비밀번호는 10자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.',
          publishedAt: new Date('2026-05-10T09:00:00'),
        },
      ],
    })
    console.log(`✓ 샘플 공지 3건 생성`)
  }

  // ─── 자료게시판 샘플 ──────────────────────────────────────────────
  const resourceCount = await prisma.resource.count()
  if (resourceCount === 0) {
    await prisma.resource.createMany({
      data: [
        {
          category: 'manual',
          title: '차지비 파트너 콘솔 사용 매뉴얼 v2.0',
          description: '파트너 콘솔 전체 기능 안내. 대시보드, 충전소 관리, 정산 확인 방법 등.',
          externalUrl: 'https://notion.so/example/partner-manual',
          pinned: true,
          downloadCount: 87,
        },
        {
          category: 'form',
          title: '담당자 변경 신청서',
          description: '충전소 운영 담당자가 바뀌었을 때 작성하는 양식. 작성 후 운영팀(1544-4279)에 제출.',
          externalUrl: 'https://example.com/forms/manager-change.pdf',
          fileName: 'manager-change.pdf',
          downloadCount: 14,
        },
        {
          category: 'guide',
          title: '월간 정산 명세서 보는 법',
          description: '정산 이력 메뉴의 각 항목 의미와 분배율 계산 방식 안내.',
          externalUrl: 'https://notion.so/example/settlement-guide',
          downloadCount: 32,
        },
        {
          category: 'contract_template',
          title: '충전소 위탁운영 표준계약서 (2026 개정판)',
          description: '신규 충전소 도입 시 사용되는 표준 계약서 양식. 운영팀 검토 후 체결.',
          externalUrl: 'https://example.com/contracts/standard-2026.pdf',
          fileName: 'standard-contract-2026.pdf',
          downloadCount: 5,
        },
      ],
    })
    console.log(`✓ 샘플 자료 4건 생성`)
  }

  console.log('\n🎉 Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
