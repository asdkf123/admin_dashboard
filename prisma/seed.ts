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
