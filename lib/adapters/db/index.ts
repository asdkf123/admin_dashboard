import { PrismaClient } from '@prisma/client'

/**
 * DB 어댑터 — Prisma 클라이언트 싱글톤.
 *
 * 운영 전환 시:
 *   - PostgreSQL이 유지되면 DATABASE_URL만 교체
 *   - 다른 DB로 가면 prisma/schema.prisma의 datasource provider 변경 + migrate
 *   - Prisma를 못 쓰는 환경(예: 사내 표준 ORM 다름)이면 이 파일에서 다른 클라이언트로 교체
 *
 * 호출부는 항상 `import { prisma } from '@/lib/adapters/db'` 로 접근.
 */

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
