# Adapters

외부 의존성을 추상화한 레이어. 사내 시스템으로 교체할 때 구현체만 갈아끼우면 된다.

## 구조

각 영역은 같은 패턴을 따른다:

```
<area>/
  index.ts        ← export { adapter } — factory, env로 구현체 선택
  types.ts        ← 인터페이스 + 도메인 타입
  mock.ts         ← 개발용 Mock 구현체
  <real>.ts       ← 실제 구현체 (운영 진입 시 추가)
```

## 어댑터 목록

| 영역 | 현재 | 운영 시 |
|---|---|---|
| `db/` | (Phase 1에서 Prisma + Postgres) | 사내 AWS DB |
| `auth/` | MockAuth | NICE 본인인증 |
| `storage/` | LocalStorage | 사내 NAS or S3 |
| `station/` | MockStation (seed 데이터) | 회사 충전소 DB API |
| `contract/` | MockContract | Salesforce API |
| `notification/` | ConsoleSender (로그만) | SMS/이메일/카카오톡 알림톡 |

## 환경 변수

```
ADAPTER_AUTH=mock | nice
ADAPTER_STORAGE=local | nas | s3
ADAPTER_STATION=mock | company-api
ADAPTER_CONTRACT=mock | salesforce
ADAPTER_NOTIFICATION=console | bizmessage
```

기본값은 모두 `mock` / `console` / `local`. 운영 환경에서만 실제 구현체로 교체.

## 사용 예

```ts
import { authAdapter } from '@/lib/adapters/auth'

const result = await authAdapter.verifyIdentity({ name, phone, birthDate })
```

호출부는 어떤 구현체인지 알 필요 없음. 인터페이스만 의존.
