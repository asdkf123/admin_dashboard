# chargev-admin 통합 구축 플랜

> GS차지비 "차지비" 운영 관리자 콘솔 — 내부 운영자 + 17,000 충전소 파트너용
>
> 최종 업데이트: 2026-05-22

---

## 0. 결정사항 (확정)

| 영역 | 결정 | 비고 |
|---|---|---|
| 프레임워크 | **Next.js 16 (App Router)** | 현 코드 그대로 |
| DB | **PostgreSQL (개발용)** → 추후 사내 AWS DB | 어댑터로 추상화 필수 |
| 본인인증 | **NICE 추정** → 추후 사내 표준 | 지금은 **Mock 어댑터** |
| 파일 스토리지 | **Local (개발용)** → 추후 사내 NAS | 어댑터로 추상화 |
| 충전소 데이터 | **임시 mock/seed** → 추후 회사 DB API | 어댑터로 추상화 |
| 계약 데이터 | **임시 mock** → 추후 **Salesforce API** | 어댑터로 추상화 |
| 디자인 레퍼런스 | `docs/admin.html` (VoltHost) | 그린 #00875A, 크림 #faf9f5 |
| MVP 범위 | 가능한 범위까지 (Phase 0~2 우선) | |

### 🔑 핵심 설계 원칙

**모든 외부 의존성은 어댑터 패턴으로 추상화한다.**
나중에 사내 시스템으로 교체할 때 **어댑터 구현체 1개만 갈아끼우면** 되도록.

```
lib/adapters/
  db/          ← Prisma(Postgres) → 사내 AWS DB
  auth/        ← MockAuth → NICEAuth
  storage/     ← LocalStorage → S3/NAS
  station/     ← MockStationAPI → CompanyStationAPI
  contract/    ← MockContractAPI → SalesforceContractAPI
  notification/← MockSender → SMS/이메일/카카오톡
  notice/      ← MockNotice(임시 DB) → 사내 CMS
```

---

## 0-A. Source-of-Truth 매트릭스 (⚠️ 모두 잠정)

> "어떤 데이터를 누가 책임지는가" — 파편화 방지를 위해 명시.
> 회사 사내 시스템 현황 확인 후 최종 확정.

### 📌 외부(어댑터 너머)가 SoT — 우리는 read-only 표시

| 데이터 | 잠정 SoT | 우리 admin | 어댑터 |
|---|---|---|---|
| 충전소·충전기 메타 | 회사 충전소 DB | 표시 | `station/` |
| 충전기 상태·OCPP | 회사 OCPP 시스템 | 표시·모니터링 | `station/` |
| 계약 정보 | Salesforce | 표시 + 만료 알림 | `contract/` |
| 충전 이력·정산 | 기존 정산 시스템 | 표시 + 집계 | (별도) |
| 한전 납부 | 회사 ERP/회계 | 표시 | (별도) |
| 매뉴얼·FAQ·약관 | 회사 위키/Zendesk 등 | 외부 링크만 | — |
| 공지사항 | 사내 CMS | 표시 (mock 시기엔 임시 DB CRUD) | `notice/` |
| 본인인증 | NICE | 호출 | `auth/` |

### ❓ 잠정으로 우리 DB — **회사 확인 필요**

> 회사에 이미 IAM·CRM·권한관리 시스템이 있을 수 있음.
> 결정 안 된 동안은 우리 DB에 두되, 결정 후 어댑터로 추상화 가능하게 설계.

| 데이터 | 현 상태 | 회사 확인 필요 사항 |
|---|---|---|
| 사용자·계정 | 우리 Postgres | **사내 IAM/SSO(Okta·Keycloak·AD/LDAP) 존재 여부** — 있으면 IdentityAdapter로 위임 |
| 세션·2FA | 우리 Postgres | 사내 SSO와 연동하면 세션은 SSO 측에서 발급. 우리 자체 세션 유지할지 정책 결정 |
| 권한·역할 (RBAC) | 우리 Postgres | 사내 권한관리 시스템 존재 여부. 있으면 우리는 역할 mapping만 |
| 감사 로그 | 우리 Postgres | 사내 SIEM/감사 시스템에 fanout 필요한지 |
| 가입·초대 큐 | 우리 Postgres | 영업/CS 팀이 사용하는 CRM(Salesforce 등)에 초대 워크플로우 이미 있는지 |
| 승인 큐 | 우리 Postgres | 사내 결재/승인 시스템 존재 여부 |
| 충전소 ↔ 계정 매핑 | 우리 Postgres | 회사 충전소 DB에 "담당자" 필드가 있는지. 있으면 그쪽이 SoT |

### 운영 전환 시 액션

각 항목별로 회사 시스템 확정되면:
1. 어댑터 인터페이스 추가 (`lib/adapters/<name>/`)
2. Mock 구현체는 그대로 두고, 운영용 구현체 추가
3. `.env`에서 `ADAPTER_<NAME>=company` 로 스위치
4. 호출부는 수정 없음 (이미 어댑터 너머에 추상화돼 있음)

각 어댑터는 **인터페이스 + 구현체**로 분리. 런타임에 env로 선택.

```ts
// 예시 패턴
interface AuthAdapter {
  verifyIdentity(payload): Promise<IdentityResult>
  verifyBusinessNo(no): Promise<BusinessInfo>
}

// 개발: MockAuthAdapter
// 운영: NiceAuthAdapter
```

---

## 1. 역할 모델 (3-Role)

| Role | 누구 | 권한 범위 |
|---|---|---|
| `main_admin` | GS차지비 본사 운영팀 | 모든 데이터·계정·시스템 설정 |
| `normal_admin` | GS차지비 일반 직원 | 모니터링·CS·점검 (정산·계정 ❌) |
| `partner_admin` | 충전소 소유주 | **본인 소유 충전소만** (row-level scope) |

**충전소 단위 N:M 권한** (`partner_admin` 내부에서 다시 세분):

| Scope Role | 행동 |
|---|---|
| Owner | 멤버 초대·권한 부여·정산 열람·충전소 정보 수정 |
| Member | 모니터링·유지보수 접수·티켓 |
| Viewer | 읽기 전용 (실소유주, 외부 회계사 등) |

---

## 2. 기능 로드맵 (Phase 0~5)

### Phase 0 — Foundation (1-2주) **← 현재 진행 중**

> 디자인 토큰 시스템 + 공통 컴포넌트 + 어댑터 스켈레톤. 모든 후속 페이즈의 기반.

**산출물**
- [x] 디자인 토큰 3-Layer (Brand → Semantic → Component)
  - `app/theme/brand.css` — BI 변경 시 여기만 수정
  - `app/theme/semantic.css` — success/warning/danger/info
- [x] 도메인 컴포넌트
  - `StatusBadge` — variant="정상|고장|점검중|대기|만료임박"
  - `SummaryCard` — tone="success|warning|danger|info|neutral"
  - `PageHeader` — 타이틀·브레드크럼·액션
- [x] 하드코딩된 색 19곳 리팩토링
- [x] 어댑터 인터페이스 스켈레톤 (`lib/adapters/`)

**완료 기준**: BI 컬러 1개만 바꿔도 전체 UI 톤이 일관되게 변경됨

---

### Phase 1 — Auth & Account (3-4주)

> 가입·로그인·세션·권한·감사로그. 17,000명을 초대하기 전 인프라.

**DB 스키마 (신규)**

```
User
  ├─ id, email, password_hash, name, phone, business_no, role
  ├─ created_at, last_login_at, locked_until
  └─ password_changed_at, must_change_password

Account (User × ChargingStation N:M)
  └─ user_id, station_id, scope_role (owner/member/viewer)

Session         (token, user_id, ip, ua, expires_at, revoked_at)
AuditLog        (user_id, action, resource, before, after, ip, at)
InviteToken     (token, business_no, phone, station_ids[], expires_at, used_at)
TwoFactorAuth   (user_id, secret, backup_codes, verified_at)
PasswordPolicy  (system-wide settings)
```

**API**
- 회원가입 (5단계 검증)
- 본인인증 (MockAuth → NICE)
- 사업자번호 진위확인 (Mock → 국세청 API)
- 로그인 / 로그아웃 / refresh / 강제 로그아웃
- 2FA (TOTP) 설정·검증
- 감사 로그 미들웨어 (모든 write에 자동 기록)

**파트너 화면**
- `/signup` (5단계: 본인인증 → 사업자정보 → 계정 → 충전소매칭 → 증빙)
- `/login` (2FA 분기 포함)
- `/forgot-password`
- `/me` (프로필 / 비번 / 2FA / 알림 / 세션)

**운영자 백오피스**
- 계정 관리 (실데이터)
- 가입 승인 큐
- 감사 로그 뷰어
- 강제 로그아웃·비번 재발급·계정 잠금

---

### Phase 2 — Onboarding: Invite + Claim (2-3주)

> 17,000 파트너를 실제로 시스템에 끌어들이는 단계.

**Track A — 운영사 주도 일괄 초대 (Primary)**
- CSV 일괄 임포트 (사업자번호 / 담당자 / 연락처 / 충전소ID[])
- 초대 발송 (SMS + 이메일, 30일 만료 1회용 토큰)
- 초대 토큰 가입 흐름 (5단계 → 2단계로 축약)
- 초대 상태 대시보드 (미수신 / 미가입 / 가입완료 / 만료)
- 자동 리마인더 (D-7 / D-14 / D-3)

**Track B — 셀프 클레임 (Secondary)**
- 사업자번호 → 충전소 자동 후보 매칭
- 증빙 업로드 (계약서·사업자등록증·통장사본)
- 운영자 승인 큐 (승인 / 반려 / 추가서류)

**N:M 권한 운영**
- Owner의 멤버 초대 흐름
- 운영자의 소유주 강제 변경 (양도양수·퇴사)

---

### Phase 3 — Contracts & Notifications (3-4주)

**계약 관리** (신규 메뉴 — 현재 없음 ❗)
- 계약 CRUD (시작·만료·자동갱신)
- PDF/파일 첨부
- 수익 분배율·임대료·정산조건
- 만료 알림 D-90 / D-30 / D-7
- ⚠️ **Salesforce API 어댑터** — 사내 계약 시스템과 동기화

**알림 센터**
- 인앱 알림 (헤더 종 아이콘)
- 채널: 인앱 / 이메일 / SMS / 카카오톡 알림톡
- 사용자별 채널 설정
- 타입: 충전기 장애·정산일·계약만료·점검예정·승인결과·시스템공지

---

### Phase 4 — Operations & Reports (2-3주)

- 가동률(Uptime), MTBF, 장애 빈도
- 매출 / 회전율 / 피크시간 / 사용자수
- 펌웨어 버전 / OCPP 통신 상태
- 월간 운영 리포트 PDF (자동 발송)
- Excel/CSV export
- Beta AI 리포트와 연계

---

### Phase 5 — 보강 (2주+)

- CS / 민원 통합 (사용자 민원 → 파트너 라우팅)
- 요금제 관리 (시간대별·회원/비회원·프로모션)
- 점검 일정 캘린더 + 출동기사 배정
- 검색/필터 저장·즐겨찾기
- 영문 i18n

---

## 3. 타임라인

| Phase | 기간 | 누적 |
|---|---|---|
| 0. Foundation | 1-2주 | 2주 |
| 1. Auth | 3-4주 | 6주 |
| 2. Onboarding | 2-3주 | 9주 |
| 3. Contracts + Notifications | 3-4주 | 13주 |
| 4. Reports | 2-3주 | 16주 |
| 5. 보강 | 2주+ | 18주+ |

**MVP 런칭** = Phase 0+1+2 = **약 7-9주** (파트너가 실제 사용 가능)

---

## 4. 디자인 토큰 구조

### 3-Layer

```
[1] Brand Tokens (app/theme/brand.css)
    BI 바뀌면 여기만 수정
    --brand-primary, --brand-primary-foreground
    --brand-accent, --brand-logo
    --brand-surface, --brand-surface-foreground

[2] Semantic Tokens (app/theme/semantic.css + globals.css)
    shadcn 표준 매핑 + 도메인 의미
    --primary  → var(--brand-primary)
    --success / --warning / --danger / --info
    --chart-1..5 (브랜드에서 파생)

[3] Component Layer
    components/ui/* 는 토큰만 참조
    hex/팔레트 직접 사용 금지
    <StatusBadge variant="정상"> 식으로 도메인 매핑
```

### 도메인 상태 ↔ 색 매핑

| 도메인 상태 | tone | 시맨틱 토큰 |
|---|---|---|
| 정상 / 처리완료 / 납부완료 / 발송완료 | success | --success |
| 점검중 / 수리중 / 납부대기 / 만료임박 | warning | --warning |
| 고장 / 미납 / 발송실패 / 만료 | danger | --danger |
| 접수완료 / 진행중 | info | --info |
| 미연결 / 비활성 / 기타 | neutral | --muted |

---

## 5. 디렉토리 구조 (목표)

```
app/
  (auth)/                ← Phase 1
    signup/
    login/
    forgot-password/
  (dashboard)/           ← 기존
    dashboard/
    stations/
    accounts/
      invites/           ← Phase 2 신규
      pending-approvals/ ← Phase 2 신규
      audit-log/         ← Phase 1 신규
    station-info/
    settlement/
    maintenance/
    customer/
    contracts/           ← Phase 3 신규
    beta/
  me/                    ← Phase 1
  api/

components/
  ui/                    ← shadcn 기반
    status-badge.tsx     ← Phase 0
    summary-card.tsx     ← Phase 0
    page-header.tsx      ← Phase 0
  layout/
  domain/                ← 도메인 컴포넌트 (Phase 1+)

lib/
  adapters/              ← Phase 0 스켈레톤
    db/
    auth/
    storage/
    station/
    contract/
    notification/
  repositories/          ← Phase 1+
    user.ts
    station.ts
    contract.ts
  navigation.ts
  utils.ts

app/theme/               ← Phase 0
  brand.css
  semantic.css

types/
  navigation.ts
  domain.ts              ← Phase 1+
```

---

## 6. 다음 작업 (TODO)

### 지금
- [x] Phase 0: 토큰 시스템 + 도메인 컴포넌트 + 어댑터 스켈레톤
- [ ] `docs/admin.html` 실제 디자인 검토 (브라우저로 렌더링 후 토큰 미세조정)

### Phase 1 진입 전
- [ ] DB 스키마 ERD 리뷰
- [ ] Prisma 도입 결정
- [ ] 본인인증 어댑터 인터페이스 확정
- [ ] CSV 일괄 임포트 포맷 (운영팀과 협의)

### 미해결 질문
- 17,000 충전소 데이터 import 방법 (API? CSV 일회성? DB 직결?)
- 사내 AWS DB 확인 (RDS? DynamoDB? Aurora?)
- Salesforce 접근 권한·API 형태
- SMS/카카오톡 알림톡 발송 채널 (비즈메시지?)
