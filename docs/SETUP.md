# 로컬 개발 셋업

## 사전 요구사항

- Node.js 20+
- Docker (또는 별도 Postgres 16)

## 첫 실행

```bash
# 1. .env 생성
cp .env.example .env

# 2. 의존성 설치
npm install

# 3. Postgres 띄우기 (Docker)
npm run db:up

# 4. DB 마이그레이션 + Prisma 클라이언트 생성
npm run db:migrate
# (첫 실행 시 마이그레이션 이름 물어보면 `init` 입력)

# 5. 시드 데이터 주입 (운영자 + 일반직원 + 파트너 + 충전소 권한)
npm run db:seed

# 6. 개발 서버 시작
npm run dev
```

브라우저에서 http://localhost:3000

## 시드 계정

| Role | Email | Password |
|---|---|---|
| main_admin | `admin@chargev.local` | `Admin1234!@` |
| normal_admin | `staff@chargev.local` | `Staff1234!@` |
| partner_admin | `partner@example.com` | `Partner1234!@` |

→ `/login` 에서 위 계정으로 로그인 가능.

## 자주 쓰는 명령

```bash
npm run db:studio    # Prisma Studio (DB GUI) — http://localhost:5555
npm run db:reset     # DB 초기화 + 마이그레이션 + 시드 재실행 (⚠️ 데이터 삭제됨)
npm run db:down      # Postgres 컨테이너 중지
```

## 운영 전환 시 변경 포인트

1. `.env`의 `DATABASE_URL` → 사내 AWS DB 주소
2. `ADAPTER_AUTH=mock` → `nice` (NICE 본인인증 연결)
3. `ADAPTER_STATION=mock` → `company-api` (회사 충전소 DB API)
4. `ADAPTER_CONTRACT=mock` → `salesforce`
5. `ADAPTER_STORAGE=mock` → `nas` 또는 `s3`
6. `ADAPTER_NOTIFICATION=console` → `bizmessage` (카카오 알림톡)
7. `SESSION_SECRET`, `TOTP_ENCRYPTION_KEY` 운영용 키로 교체

각 어댑터의 실제 구현체는 `lib/adapters/<name>/` 안에 추가하고
`index.ts`의 factory switch에 케이스만 추가하면 됨. 호출부 변경 0건.

## 트러블슈팅

**Q. `prisma migrate dev` 시 권한 오류**
A. Docker Postgres가 안 떠 있을 가능성. `docker ps`로 확인하고 `npm run db:up` 다시.

**Q. 로그인 후 무한 redirect**
A. 쿠키 이름 충돌 가능성. 브라우저 쿠키 삭제 후 다시.

**Q. 시드 재실행 시 "unique constraint" 오류**
A. seed는 upsert로 짜여있어 중복 안전. 그래도 문제면 `npm run db:reset`.
