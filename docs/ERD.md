# ERD — Phase 1 & 2

> Auth, Account, RBAC, Onboarding(Invite + Claim) 까지의 데이터 모델.
> Phase 3(Contracts)·4(Reports)는 별도 ERD로 확장 예정.

## 설계 원칙

1. **외부 시스템 데이터는 우리 DB에 넣지 않는다** — 충전소·계약은 어댑터 너머에 있는 회사 DB/Salesforce에 두고, 우리는 **참조 ID만** 저장. 동기화 부담·중복·정합성 이슈 회피.
2. **모든 mutation은 AuditLog에 기록** — DB 트리거가 아니라 애플리케이션 미들웨어에서 처리(어댑터 교체 시 일관성 유지).
3. **soft delete는 도입하지 않는다** — 감사가 필요한 정보는 AuditLog에 남기고, 정말 지워야 할 PII는 hard delete. 단순성 우선.
4. **시간은 UTC + `created_at`/`updated_at` 자동 관리**.

---

## 다이어그램

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "owns"
    User ||--o| TwoFactorAuth : "has"
    User ||--o{ PasswordResetToken : "issued"
    User ||--o{ AuditLog : "actor"
    User ||--o{ ClaimRequest : "submits"
    User ||--o{ InviteToken : "creates"
    User ||--o{ NotificationPreference : "configures"

    Account }o--|| User : "belongs to"
    Account ||--o{ AuditLog : "subject"

    InviteToken ||--o| User : "used_by"

    ClaimRequest }o--|| User : "reviewed_by"

    User {
        uuid id PK
        string email UK
        string password_hash
        string name
        string phone
        string business_no "nullable, partner only"
        enum role "main_admin|normal_admin|partner_admin"
        string ci "본인인증 연계정보, nullable"
        string di "중복가입확인값, nullable"
        timestamp email_verified_at
        timestamp phone_verified_at
        timestamp last_login_at
        timestamp locked_until "계정잠금 만료"
        int failed_login_count
        timestamp password_changed_at
        bool must_change_password
        timestamp created_at
        timestamp updated_at
    }

    Account {
        uuid id PK
        uuid user_id FK
        string station_id "외부 충전소 ID(어댑터 너머)"
        enum scope_role "owner|member|viewer"
        uuid invited_by_user_id FK "nullable"
        timestamp created_at
    }

    Session {
        uuid id PK
        uuid user_id FK
        string token UK "hashed"
        string ip_address
        string user_agent
        timestamp expires_at
        timestamp revoked_at "nullable"
        timestamp last_active_at
        timestamp created_at
    }

    TwoFactorAuth {
        uuid id PK
        uuid user_id FK UK
        string secret "TOTP, encrypted"
        json backup_codes
        timestamp verified_at
        timestamp created_at
    }

    PasswordResetToken {
        uuid id PK
        uuid user_id FK
        string token UK "hashed"
        timestamp expires_at
        timestamp used_at "nullable"
        timestamp created_at
    }

    InviteToken {
        uuid id PK
        string token UK "hashed"
        string business_no
        string phone
        string email "nullable"
        json station_ids "string[]"
        timestamp expires_at
        timestamp used_at "nullable"
        uuid used_by_user_id FK "nullable"
        uuid created_by_user_id FK
        int reminders_sent
        timestamp last_reminder_at
        timestamp created_at
    }

    ClaimRequest {
        uuid id PK
        uuid user_id FK
        string station_id
        string business_no
        json evidence_file_keys "storage keys[]"
        enum status "pending|approved|rejected|info_required"
        uuid reviewed_by_user_id FK "nullable"
        timestamp reviewed_at "nullable"
        string review_note "nullable"
        timestamp created_at
        timestamp updated_at
    }

    AuditLog {
        uuid id PK
        uuid user_id FK "nullable, system actions"
        string action "e.g. login, account.create"
        string resource_type "User|Account|Station|..."
        string resource_id
        json before "nullable"
        json after "nullable"
        string ip_address
        string user_agent
        timestamp created_at
    }

    NotificationPreference {
        uuid id PK
        uuid user_id FK
        enum channel "email|sms|kakao|inapp"
        enum type "fault|settlement|contract|inspection|approval|invite|announcement"
        bool enabled
        timestamp updated_at
    }
```

---

## 엔티티 상세

### User
플랫폼의 사용자 — 운영자(main/normal_admin), 파트너(partner_admin) 모두 포함.

- `role`은 시스템 전역 권한. partner_admin은 다시 `Account`를 통해 충전소별 세부 권한을 받는다.
- `business_no`는 partner_admin만 사용. main_admin/normal_admin은 null.
- `ci`/`di`는 NICE 본인인증 시에만 채워짐. mock 시에는 mock 값.
- `locked_until` + `failed_login_count`로 계정 잠금. 로그인 실패 5회 → 30분 잠금 정책 예정.
- `must_change_password=true`이면 첫 로그인 시 비밀번호 변경 강제 (초대 가입 케이스).

### Account
**파트너 user × 충전소** N:M 매핑. **권한의 핵심**.

- 한 user가 여러 충전소를 가질 수 있고(`Account` 여러 row), 한 충전소에 여러 user가 붙을 수 있음.
- `scope_role`:
  - `owner`: 정산·계약 열람, 멤버 초대, 충전소 정보 수정
  - `member`: 모니터링·유지보수 접수
  - `viewer`: 읽기 전용
- `invited_by_user_id`: Owner의 멤버 초대 흐름에서 누가 초대했는지.
- 운영자가 강제로 row를 변경(소유주 변경)할 수 있어야 함 → AuditLog로 추적.

### Session
- DB 세션. JWT 대신 server-side session token 사용 (강제 로그아웃·revoke 가능).
- `token`은 hash 저장 (DB 유출 시 세션 탈취 방지).
- `revoked_at` 채워지면 즉시 무효. 관리자의 "전체 로그아웃" 액션으로 일괄 revoke.

### TwoFactorAuth
TOTP 기반. partner_admin은 필수, 운영자는 정책에 따라.

- `secret`은 암호화 저장 (env에 master key).
- `backup_codes`는 hash 저장.
- `verified_at` 없으면 활성화 안 된 상태(초기 설정 중).

### InviteToken (Track A 핵심)
운영사가 보유한 17,000 충전소의 담당자들을 일괄 초대하는 토큰.

- `station_ids`는 JSON 배열 — 한 명의 파트너가 보유한 모든 충전소 ID. 가입 완료 시 이 배열대로 `Account` 자동 생성.
- `business_no` + `phone`은 가입 시 본인인증 결과와 매칭하여 검증.
- 30일 만료. 만료 전 D-7 / D-14 / D-3 시점에 자동 리마인더 (`reminders_sent` 카운트).
- `token`은 hash 저장. 원본은 발송 시점에만 보임.

### ClaimRequest (Track B)
초대 못 받은 파트너의 셀프 클레임.

- 사업자번호 매칭으로 자동 후보 표시 → 본인이 선택 → 증빙 업로드.
- `evidence_file_keys`: `storageAdapter.upload()` 결과 key 배열.
- 운영자가 승인 시 → 해당 station에 대한 `Account` 자동 생성.

### AuditLog
모든 write 작업의 흔적.

- 미들웨어가 자동 기록 — `before`/`after`로 변경 내용 추적.
- `user_id`가 null이면 시스템 액션(자동 만료, 배치 잡 등).
- 정산 분쟁·법적 이슈 대응용. 절대 삭제하지 않음.

### NotificationPreference
사용자 × 채널 × 타입 단위로 ON/OFF.

- 기본값은 모두 ON. 사용자가 마이페이지에서 끌 수 있음.
- 일부 타입은 시스템 강제(예: `approval_result`는 끄지 못함).

---

## 인덱스 (성능 가이드)

| 테이블 | 인덱스 | 용도 |
|---|---|---|
| User | `email` UK | 로그인 |
| User | `business_no` | 사업자번호로 파트너 검색 |
| User | `phone` | 본인인증 매칭 |
| Account | `(user_id, station_id)` UK | 중복 방지 |
| Account | `station_id` | 충전소 단위 멤버 조회 |
| Session | `(user_id, revoked_at)` | 활성 세션 조회 |
| Session | `expires_at` | 만료 정리 배치 |
| InviteToken | `token` UK | 토큰 검증 |
| InviteToken | `(business_no, phone)` | 가입 시 매칭 |
| InviteToken | `expires_at` | 만료/리마인더 배치 |
| AuditLog | `(resource_type, resource_id, created_at)` | 리소스별 이력 조회 |
| AuditLog | `(user_id, created_at)` | 사용자별 활동 조회 |
| ClaimRequest | `(status, created_at)` | 운영자 승인 큐 |

---

## 외부 시스템과의 경계

| 데이터 | 우리 DB | 어댑터 너머 |
|---|---|---|
| 사용자 계정·세션·2FA | ✅ | |
| 충전소 메타데이터(주소·설치일·소유주 사업자번호) | | ✅ Station Adapter |
| 충전기 상태·OCPP | | ✅ Station Adapter |
| 계약 정보 (계약기간·분배율) | | ✅ Contract Adapter (Salesforce) |
| 충전 이력·정산 | | ✅ 별도 (기존 API) |
| 가입 신청·증빙·권한 | ✅ | |
| 감사 로그 | ✅ | |

**핵심**: 우리 DB에는 "누가 어떤 충전소에 권한이 있는지"만 저장. 충전소 자체의 데이터는 모두 어댑터 너머에 둔다.

---

## 마이그레이션 전략

1. Prisma + Postgres 로컬 개발 시작
2. 운영 전환 시 사내 AWS DB(RDS Postgres?)로 connection string만 교체 — 같은 Prisma 스키마 유지
3. 만약 사내 DB가 Postgres가 아니면 → DB Adapter 레이어에서 Drizzle·raw query 등으로 교체
