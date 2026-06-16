'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Maximize2,
  Minimize2,
  X,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ReportContent() {
  const slides = SLIDES
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const next = useCallback(
    () => setCurrent((s) => Math.min(slides.length - 1, s + 1)),
    [slides.length],
  )
  const prev = useCallback(() => setCurrent((s) => Math.max(0, s - 1)), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        setCurrent(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setCurrent(slides.length - 1)
      } else if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false)
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setFullscreen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, slides.length, fullscreen])

  return (
    <div
      className={cn(
        'relative flex flex-col bg-white',
        fullscreen ? 'fixed inset-0 z-50' : 'h-full',
      )}
    >
      {/* 슬라이드 영역 */}
      <div className="relative flex-1 overflow-hidden print:overflow-visible print:h-auto">
        <div
          className="flex h-full transition-transform duration-500 ease-out print:block print:translate-x-0 print:transition-none"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((Slide, i) => (
            <div
              key={i}
              className="h-full min-w-full overflow-y-auto px-8 sm:px-20 print:h-auto print:min-w-0 print:break-after-page print:px-12"
            >
              <Slide />
            </div>
          ))}
        </div>

        {/* 좌우 버튼 */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-foreground/30 transition hover:bg-muted/40 hover:text-foreground disabled:opacity-0 disabled:cursor-not-allowed sm:flex print:hidden"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-foreground/30 transition hover:bg-muted/40 hover:text-foreground disabled:opacity-0 disabled:cursor-not-allowed sm:flex print:hidden"
        >
          <ChevronRight className="h-7 w-7" />
        </button>

        {/* 우상단 컨트롤 */}
        <div className="absolute right-6 top-6 flex items-center gap-2 print:hidden">
          <span className="font-mono text-xs text-muted-foreground">
            {current + 1} / {slides.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreen((v) => !v)}
            className="h-8 gap-1 text-muted-foreground"
            title={fullscreen ? '풀스크린 해제 (ESC)' : '풀스크린 (F)'}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="h-8 gap-1 text-muted-foreground"
            title="인쇄"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 좌하단: 키보드 안내 */}
        <div className="absolute bottom-4 left-6 hidden text-xs text-muted-foreground/60 sm:block print:hidden">
          <kbd className="font-mono">←</kbd> <kbd className="font-mono">→</kbd> 이동
          {'  /  '}
          <kbd className="font-mono">F</kbd> 풀스크린
        </div>
      </div>

      {/* 하단 점 인디케이터 */}
      <div className="flex items-center justify-center gap-2 py-4 print:hidden">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-1 rounded-full transition-all',
              i === current ? 'w-8 bg-foreground' : 'w-1 bg-foreground/15 hover:bg-foreground/30',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ─── 슬라이드 ──────────────────────────────────────────

const SLIDES = [
  Cover,
  TLDR,
  PersonaIntro,
  Painpoints,
  BusinessImpact,
  PersonaSiteOwner,
  PersonaOEM,
  PersonaOperator,
  NextSteps,
]

// 1. 표지
function Cover() {
  return (
    <Center>
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          중간 보고
        </p>
        <h1 className="text-6xl font-bold tracking-tight sm:text-7xl">차지비 상면관리자 페이지</h1>
        <p className="text-2xl font-normal text-muted-foreground">chargev-admin</p>
        {/* <div className="pt-12 text-sm text-muted-foreground">2026 / 06 / 12</div> */}
      </div>
    </Center>
  )
}

// 2. TL;DR
function TLDR() {
  return (
    <Center>
      <div className="max-w-3xl space-y-14">
        <p className="text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          17,000 파트너와<br />
          운영팀이 함께 쓸<br />
          <span className="text-primary">통합 콘솔</span>
        </p>
        <div className="space-y-8 text-left">
          <div className="border-l-4 border-primary pl-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              작업 사항
            </p>
            <p className="text-xl leading-relaxed text-foreground">
              - 운영자와 파트너가 사용할 화면(대시보드, 충전소 정보, 실시간 모니터링 등)<br/>
              - 운영 도구(계정 발급, 권한 관리, 정산, 유지보수, 공지, 메시지 발송)
            </p>
          </div>
          <div className="border-l-4 border-muted-foreground/30 pl-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              다음 단계
            </p>
            <p className="text-xl leading-relaxed text-foreground">
              - 사내 admin, BPMS(Salesforce), Zendesk와 실제 데이터를 주고받는 API 연동 작업 필요<br/>
              - DATA 팀과 협의하여 연동 방안 확인 예정
            </p>
          </div>
        </div>
      </div>
    </Center>
  )
}

// 3. 페르소나 소개 — 3명의 사용자
function PersonaIntro() {
  return (
    <Slide title="누가 이 페이지을 쓰는가" num="01" sub="3명의 사용자, 각자 다른 관심사">
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            tag: '01',
            who: '상면 제공자',
            example: '관리사무소',
            care: '민원 회피, 업무 부담 최소화',
            color: 'primary',
          },
          {
            tag: '02',
            who: 'OEM 관리자',
            example: 'BMW 등 자동차 제조사',
            care: '충전기 상태, 사용자 경험',
            color: 'primary',
          },
          {
            tag: '03',
            who: '차지비 운영자',
            example: '본사 운영팀 (내부 직원)',
            care: '17,000 전체 관리, 정책, CS',
            color: 'primary',
          },
        ].map((p) => (
          <div key={p.tag} className="flex flex-col gap-4 rounded border border-foreground/10 p-6">
            <span className="font-mono text-xs text-muted-foreground/60">{p.tag}</span>
            <div>
              <p className="text-3xl font-bold tracking-tight">{p.who}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.example}</p>
            </div>
            <div className="mt-auto rounded border-l-4 border-primary bg-primary/5 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                주요 관심사
              </p>
              <p className="text-sm font-medium">{p.care}</p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}

// 페르소나별 Painpoint 요약
function Painpoints() {
  const personas = [
    {
      tag: '01',
      who: '상면 제공자',
      example: '관리사무소',
      pains: [
        '입주민 충전기 고장 민원에 즉답 못 함 — 현장 가거나 운영사 전화',
        '점검,수리 진행 상황 운영사 통보 전까지 모름',
        '한전 전기요금 미납 시 단전 → 입주민 민원 폭주',
        '의무 5% 설치 활용 실적 매번 운영사에 자료 요청',
      ],
    },
    {
      tag: '02',
      who: 'OEM 관리자',
      example: 'BMW 등',
      pains: [
        '본인 브랜드 충전기 실시간 상태 확인 불가',
        '고장 시 사용자 민원으로 뒤늦게 인지',
        '수리 진행 상황 콜센터 전화로만 추적',
        '여러 충전소 운영 현황 한눈에 안 보임',
        '본인 인프라 활용 추이 직접 추적 어려움',
      ],
    },
    {
      tag: '03',
      who: '차지비 운영자',
      example: '본사 운영팀',
      pains: [
        '17,000명 일괄 등록 도구 없음',
        '사람마다 다른 데이터 보여줘야 하는데 권한 통제 도구 없음',
        '퇴사,보안 사고 시 계정 즉시 차단 수단 부족',
        '17,000명 공지,안내 발송 수단 없음',
      ],
    },
  ]
  return (
    <Slide title="지금 무엇이 불편한가" num="02" sub="페르소나별 현재 painpoint">
      <div className="grid grid-cols-3 gap-4">
        {personas.map((p) => (
          <div
            key={p.tag}
            className="flex flex-col gap-3 rounded border-l-4 border-danger bg-danger-soft/30 p-5"
          >
            <div>
              <span className="font-mono text-xs text-muted-foreground/60">{p.tag}</span>
              <p className="mt-1 text-xl font-bold tracking-tight">{p.who}</p>
              <p className="text-xs text-muted-foreground">{p.example}</p>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed">
              {p.pains.map((pain, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-danger shrink-0">-</span>
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Slide>
  )
}

// 시스템 도입 Business Impact
function BusinessImpact() {
  const impacts = [
    {
      title: '고객 문의(CS) 비용 감소',
      detail: '파트너가 충전기 상태,점검,수리,납부 이력을 셀프 조회. 콜센터 전화량,운영팀 응대 부담 ↓',
      who: '운영팀,콜센터',
    },
    {
      title: '민원 대응 속도 향상',
      detail: '관리사무소가 입주민 민원에 그 자리에서 답변. OEM이 사용자 민원 전에 먼저 인지하고 대응',
      who: '상면 제공자,OEM',
    },
    {
      title: '운영 사고 사전 차단',
      detail: '한전 미납 시 사전 인지 → 단전 사고 방지. 고장 충전기 실시간 감지 → 장기 방치 방지',
      who: '운영팀,상면 제공자',
    },
    {
      title: '17,000 파트너 통제 가능',
      detail: '셀프 가입 없이 운영자가 직접 발급. 사람 단위 권한 grant, 계정 잠금,강제 로그아웃 통제',
      who: '운영팀,보안',
    },
    {
      title: '계약,납부,점검 누락 방지',
      detail: '만료 임박 계약,미납,예정 점검을 자동 표시. 운영자가 놓치지 않고 사전 대응',
      who: '운영팀',
    },
    {
      title: '데이터 가시성 차등',
      detail: '관리사무소는 본인 충전소만, OEM은 본인 브랜드만, 매출은 본사만. 정보 유출 위험 ↓',
      who: '전체,보안',
    },
  ]
  return (
    <Slide title="시스템 도입 효과" num="03" sub="이 페이지를 쓰면 어떤 가치가 생기나">
      <div className="grid grid-cols-2 gap-3">
        {impacts.map((im) => (
          <div
            key={im.title}
            className="rounded border-l-4 border-primary bg-primary/5 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-bold tracking-tight">{im.title}</p>
              <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary whitespace-nowrap">
                {im.who}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {im.detail}
            </p>
          </div>
        ))}
      </div>
    </Slide>
  )
}

// 4. 페르소나 — 상면 제공자
function PersonaSiteOwner() {
  return (
    <Slide
      title="상면 제공자"
      num="02"
      sub="관리사무소장 / 법으로 5% 의무 설치, 운영권은 우리 / 민원 안 받고 업무 안 늘어나길 바람"
    >
      <PersonaBody
        persona="site_owner"
        questions={[
          {
            q: '입주민이 충전기 고장났다는데 진짜야?',
            current: '현장 가서 확인하거나 운영사에 전화. 입주민에게 즉답 못 함',
            ours: '실시간 상태 페이지에서 충전기별 정상/고장/충전중을 즉시 확인',
            modal: {
              url: '/station-info/chargers',
              title: '실시간 상태 페이지',
              desc: '충전기별 현재 상태를 10초 간격으로 갱신. 입주민 민원에 그 자리에서 답변 가능',
              annotations: [
                { target: '[data-annotate="kpi"]', label: '상태 요약 카드', desc: '정상/고장/충전중 충전기 수가 한눈에. 고장 1대만 떠도 확인 가능' },
                { target: '[data-annotate="stations"]', label: '충전소별 충전기 리스트', desc: '충전소 단위로 묶어서 표시. 충전소가 여러 개라도 한눈에 정리됨' },
              ],
            },
          },
          {
            q: '내가 신경 안 써도 점검/수리는 알아서 처리되나?',
            current: '운영사가 알려줄 때까지 모름. 입주민 안내도 직접 챙겨야 함',
            ours: '접수/처리 이력 페이지에서 접수완료 → 수리중 → 처리완료 단계가 자동 표시',
            modal: {
              url: '/maintenance/tickets',
              title: '접수/처리 이력 페이지',
              desc: '운영팀이 받은 접수와 처리 단계가 자동으로 표시. 따로 연락받지 않아도 진행 상황 확인',
              annotations: [
                { target: '[data-annotate="status-counter"]', label: '상태별 카운터', desc: '접수완료/수리중/처리완료 건수를 한눈에' },
                { target: '[data-annotate="tickets-table"]', label: '접수,처리 표', desc: '접수일, 분류, 충전소, 담당자, 처리 단계까지 모두 표시' },
              ],
            },
          },
          {
            q: '충전기 정기 점검 내역서를 받아볼 수 있나?',
            current: '점검 끝나도 내역서 따로 요청. 운영사가 보내줄 때까지 대기',
            ours: '점검 완료 시 내역서가 자동 첨부. 점검 상세에서 다운로드',
            modal: {
              url: '/maintenance/inspection',
              title: '점검 내역서 다운로드',
              desc: '완료된 점검을 클릭하면 상세 모달이 열리고 내역서 다운로드 가능. 의무 설치 증빙 자료로 활용',
              annotations: [
                { target: '[data-annotate="inspection-table"]', label: '완료된 점검 행', desc: '점검이 끝난 항목을 클릭하면 상세 모달이 열림' },
                { label: '점검 내역서 (모달 안)', desc: '점검 일자, 점검 항목, 결과, 사진, 담당자 서명까지 포함된 내역서 다운로드' },
              ],
            },
          },
          {
            q: '운영사가 한전 전기요금 제때 냈나? 단전될 일 없나?',
            current: '운영사 믿는 수밖에. 단전되면 그제서야 입주민 민원 폭주',
            ours: '한전 납부 이력 페이지에서 충전소별 납부 상태(완료/대기/미납)를 직접 확인',
            modal: {
              url: '/settlement/kepco',
              title: '한전 납부 이력 페이지',
              desc: '운영사가 한전에 낸 전기요금 납부 상태를 충전소별로 표시. 미납 발생 시 즉시 인지 가능',
              annotations: [
                { target: '[data-annotate="kepco-summary"]', label: '납부 상태 요약', desc: '납부완료/납부대기/미납 건수와 총 전기요금 한눈에' },
                { target: '[data-annotate="kepco-table"]', label: '충전소별 납부 상세', desc: '계약번호, 당월 요금, 납부기한, 납부일자까지 충전소 단위로 확인' },
              ],
            },
          },
        ]}
      />
    </Slide>
  )
}

// 5. 페르소나 — OEM사
function PersonaOEM() {
  return (
    <Slide title="OEM사" num="03" sub="자동차 제조사 (BMW 등) / 본인 브랜드 충전 인프라 관심">
      <PersonaBody
        persona="oem"
        questions={[
          {
            q: '지금 충전기 잘 돌아가나?',
            current: '실시간 확인 불가. 사용자 민원 들어와야 고장 알게 됨',
            ours: '실시간 상태 페이지에서 충전 진행률과 가동 중인 충전기를 10초 간격으로 갱신',
            modal: {
              url: '/station-info/chargers',
              title: '실시간 상태 페이지',
              desc: '본인 브랜드 충전기 전체를 실시간 모니터링. 사용자 민원 전에 먼저 인지',
              annotations: [
                { target: '[data-annotate="kpi"]', label: '실시간 KPI', desc: '가동 중/대기/고장 충전기 수, 진행 중인 충전 세션 수' },
                { target: '[data-annotate="stations"]', label: '충전소별 진행 상황', desc: '여러 충전소를 보유한 OEM도 충전소 단위로 그룹핑되어 한눈에 파악' },
              ],
            },
          },
          {
            q: '고장 났을 때 빠르게 알 수 있나?',
            current: '운영팀이 통보해야 알 수 있음. 시간 지연',
            ours: '실시간 상태 페이지에서 고장 충전기가 즉시 강조 표시. 알림 발송 채널 연동 예정',
            modal: {
              url: '/station-info/chargers',
              title: '고장 즉시 알림',
              desc: '통신 두절/충전 실패 충전기를 화면 상단에 자동 강조. 즉시 운영팀 접수까지 연계',
              annotations: [
                { target: '[data-annotate="kpi"]', label: '고장 카운터', desc: '고장 충전기가 1대만 떠도 KPI에 빨간색으로 표시' },
                { target: '[data-annotate="stations"]', label: '충전소별 고장 표시', desc: '충전소 헤더의 고장 배지로 어느 충전소에 고장이 있는지 즉시 확인' },
              ],
            },
          },
          {
            q: '수리 진행 상황은?',
            current: '콜센터 전화 의존. 진행 상황 추적 불가',
            ours: '유지보수 티켓에서 접수, 수리중, 처리완료 단계를 모두 추적',
            modal: {
              url: '/maintenance/tickets',
              title: '유지보수 티켓 페이지',
              desc: '본인 충전소의 접수 이력과 처리 단계를 한곳에서 확인',
              annotations: [
                { label: '상태별 카운터', desc: '접수/처리중/완료 티켓 수' },
                { label: '티켓 리스트', desc: '접수일, 충전소, 담당자, 처리 단계, 처리 결과까지 모두 표시' },
              ],
            },
          },
          {
            q: '충전소가 여러 곳인데 어디에 문제 있는지 한눈에 보고 싶다',
            current: '충전소마다 따로 들어가서 확인. 문제 충전소 찾기까지 시간 걸림',
            ours: '충전소별로 섹션이 묶여 표시. 헤더에 총 N대 + 충전중/고장/점검중 배지로 운영 현황 요약',
            modal: {
              url: '/station-info/chargers',
              title: '충전소별 그룹핑',
              desc: 'OEM은 본인 브랜드 충전소가 여러 곳. 충전소 단위로 섹션을 묶어 어디에 문제 있는지 한눈에 짚어냄',
              annotations: [
                { target: '[data-annotate="stations"]', label: '충전소별 섹션 + 운영 요약', desc: '각 섹션 헤더에 충전기 수 + 충전중/고장/점검중 배지. 빨간 고장 배지가 있는 충전소만 골라보면 됨' },
              ],
            },
          },
          {
            q: '내 브랜드 충전기가 한 달간 얼마나 쓰였나?',
            current: '차지비 운영팀에 자료 요청. 인프라 활용 추이 직접 추적 어려움',
            ours: '대시보드 금월 충전량(kWh) + 전월 대비 증감으로 활용 추이 추적',
            modal: {
              url: '/dashboard',
              title: '대시보드 - 금월 충전량',
              desc: '본인 브랜드 충전 인프라 실 활용 데이터. 인프라 확장 의사결정 + 차주 마케팅 근거로 활용',
              annotations: [
                { target: '[data-annotate="monthly-usage"]', label: '금월 충전량', desc: '이번 달 총 충전 전력량(kWh) + 전월 대비 증감률. 활용 추세 즉시 파악' },
              ],
            },
          },
        ]}
      />
    </Slide>
  )
}

// 6. 페르소나 — 차지비 운영자
function PersonaOperator() {
  return (
    <Slide title="차지비 운영자" num="04" sub="본사 운영팀 / 17,000 충전소 + 파트너 전체 관리">
      <PersonaBody
        persona="operator"
        questions={[
          {
            q: '파트너는 어떻게 가입시키나?',
            current: '셀프 가입 받으면 검증 부담 + CS 폭주',
            ours: '운영자가 임시 비번을 자동 발급, 메일/SMS/카카오톡 발송',
            modal: {
              url: '/accounts/new',
              title: '신규 계정 등록 페이지',
              desc: '운영자가 직접 계정 발급. 셀프 가입 없으므로 가짜 파트너 검증 부담 없음',
              annotations: [
                { label: '계정 기본 정보', desc: '이름, 이메일, 소속 입력. 임시 비번은 시스템이 자동 생성' },
                { label: '발송 채널 선택', desc: '메일/SMS/카카오톡 중 다중 선택해서 임시 비번 전달' },
              ],
            },
          },
          {
            q: '관리사무소 A 직원, OEM 관리자, 본사 운영팀 — 사람마다 봐야 할 데이터가 완전히 다르다',
            current: '권한 차등이 없으면 일괄 노출 아니면 일괄 차단. 관리사무소 A가 옆 동네 충전소 데이터를 보거나, 일반 직원이 매출 같은 민감 정보를 다 본다면 정보 유출',
            ours: '3가지 role(본사 운영팀/상면관리자/파트너) + 사용자-충전소 매핑 + 사용자별 권한 추가 부여. 누구는 자기 충전소만, 누구는 매출까지, 누구는 전체',
            modal: {
              url: '/accounts/permissions',
              title: '권한이 필요한 진짜 이유 — 데이터 가시성 차등',
              desc: '관리사무소는 본인 충전소만, OEM은 본인 브랜드 충전기만, 일반 직원은 매출 빼고, 본사 운영팀은 전체. 사람마다 봐야 할 데이터의 범위가 다른데 권한 통제가 없으면 일괄 노출 또는 일괄 차단밖에 안 됨',
              annotations: [
                {
                  target: '[data-annotate="role-summary"]',
                  label: '3단계 역할 = 데이터 가시성 기본 분리',
                  desc: '본사 운영팀(전체) / 상면관리자(자기 사이트 한정) / 파트너(본인 충전소만). 역할에 따라 기본으로 볼 수 있는 데이터 범위 자체가 다름',
                },
                {
                  target: '[data-annotate="user-table"]',
                  label: '사용자별 정밀 통제 — 역할 + 추가 grant',
                  desc: '권한(role) 드롭다운으로 즉시 변경. 우측 "권한 부여" 버튼으로 같은 role 안에서도 사람 단위로 매출 조회, 계약 조회 같은 민감 권한을 더하거나 빼기. 관리사무소 A 직원에게는 A 충전소 데이터만 노출되는 식의 데이터 격리도 사용자-충전소 매핑으로 처리',
                },
              ],
            },
          },
          {
            q: '직원 퇴사, 보안 사고 의심, 비번 분실 — 어떻게 대응하나?',
            current: '계정을 그냥 두면 보안 위험. 삭제하면 그 사람이 만든 티켓/공지/감사 이력 출처가 사라짐. 강제 로그아웃 수단 없으면 침해 의심에도 즉시 차단 불가',
            ours: '계정 잠금(로그인 차단) / 강제 로그아웃(현 세션 종료) / 비번 재발급 — 활동 이력은 그대로 두고 로그인만 통제. 누가 언제 했는지 모두 감사 로그에 기록',
            modal: {
              url: '/accounts/permissions',
              title: '권한 자체가 필요한 이유',
              desc: '17,000명 + 운영팀 = 매일 퇴사/보안 사고/비번 분실이 일어남. 권한 통제 수단이 없으면 운영자가 사고를 막을 방법이 없고, 잘못 막으면 활동 이력까지 같이 날아감',
              annotations: [
                {
                  target: '[data-annotate="user-table"]',
                  label: '계정별 4가지 통제 액션',
                  desc: '계정 잠금 = 로그인 자체를 막음 (퇴사/보안 사고 의심 시). 강제 로그아웃 = 현재 세션만 끊음 (다시 로그인은 가능). 비번 재발급 = 사용자가 다음 로그인 시 변경 강제. 권한 부여 = 사람 단위로 민감 권한 추가/회수',
                },
              ],
            },
          },
          {
            q: '17,000명에게 공지/안내를 어떻게 보내나?',
            current: '개별 메일 발송 또는 다른 시스템 사용. 잘못된 그룹에 잘못 보내면 17,000명에게 사고 메시지가 동시에 감',
            ours: '수신자 그룹(파트너/운영팀/상면관리자/전체/직접 지정) + 채널(메일,SMS,카카오톡)을 한 화면에서 선택. 모든 발송 이력은 감사 로그에 기록',
            modal: {
              url: '/customer/messaging',
              title: '메일/문자 발송 페이지',
              desc: '대규모 발송에서 가장 위험한 건 "수신자를 잘못 선택" 사고. 메시지 성격에 맞게 그룹이 미리 분리되어 있어서 운영자가 선택만 하면 안전하게 발송 가능',
              annotations: [
                {
                  target: '[data-annotate="audience"]',
                  label: '수신자 그룹 분리',
                  desc: '파트너 전체 = B2B 공지(정책 변경, 정산 일정). 본사 운영팀 = 내부 정책/시스템 점검. 상면관리자 = CS 가이드. 전체 = 긴급 점검. 직접 지정 = 특정 사용자만. 메시지 성격별로 미리 분리해서 잘못 보낼 위험 차단',
                },
                {
                  target: '[data-annotate="channels"]',
                  label: '채널 다중 선택',
                  desc: '메일/SMS/카카오톡 동시 발송. 긴급 안내는 3채널 다, 일반 공지는 메일만 같이 메시지 성격에 따라 선택',
                },
                {
                  target: '[data-annotate="message-body"]',
                  label: '제목 + 본문 (변수 치환)',
                  desc: '{name} 같은 변수로 수신자 이름 자동 치환. 발송 전 수신자 수 + 채널 수 미리보기로 확인',
                },
              ],
            },
          },
        ]}
      />
    </Slide>
  )
}

// ─── 페르소나 본문 + 화면 모달 ────────────────────────────

type Annotation = {
  /** iframe 안의 element를 가리키는 CSS selector. 페이지에 data-annotate="..." 속성 부착 권장.
   *  없으면 overlay 박스는 안 그리고 우측 설명 패널에만 표시. */
  target?: string
  label: string
  desc: string
}

type Persona = 'site_owner' | 'oem' | 'operator'

type ModalSpec = {
  url: string
  title: string
  desc: string
  annotations: Annotation[]
  /** 모달이 띄울 iframe에 적용할 권한 시뮬레이션. 미들웨어가 쿠키로 변환해서
   *  getCurrentUser가 role을 override함. */
  previewAs?: Persona
}

type Case = {
  q: string
  current: string
  ours?: string
  modal?: ModalSpec
}

function PersonaBody({
  persona,
  questions,
}: {
  persona: Persona
  questions: Case[]
}) {
  const [openCase, setOpenCase] = useState<Case | null>(null)
  // 모달 spec에 persona를 자동 inject — 각 케이스에서 일일이 적지 않아도 됨
  const enrichedModal = openCase?.modal
    ? { ...openCase.modal, previewAs: openCase.modal.previewAs ?? persona }
    : undefined
  return (
    <>
      <div className="space-y-3">
        {questions.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 rounded border border-foreground/10 p-4">
            <div className="col-span-5">
              <span className="font-mono text-[10px] text-muted-foreground/50">질문 {i + 1}</span>
              <p className="mt-1.5 text-lg font-bold leading-tight tracking-tight">{c.q}</p>
              <div className="mt-2.5 rounded border-l-4 border-danger bg-danger-soft/30 px-3 py-2">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-danger-soft-foreground">
                  지금은
                </p>
                <p className="text-xs leading-relaxed">{c.current}</p>
              </div>
            </div>
            <div className="col-span-7 flex flex-col rounded border-l-4 border-primary bg-primary/5 p-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                이 화면에서는
              </p>
              <p className="text-sm leading-relaxed flex-1">{c.ours}</p>
              {c.modal && (
                <button
                  type="button"
                  onClick={() => setOpenCase(c)}
                  className="mt-3 inline-flex items-center gap-1.5 self-start rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <ExternalLink className="h-3 w-3" />
                  실제 화면 보기
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {openCase && enrichedModal && (
        <ScreenModal spec={enrichedModal} caseCtx={openCase} onClose={() => setOpenCase(null)} />
      )}
    </>
  )
}

// 실제 화면 미리보기 모달 — iframe + annotation overlay + 설명 패널
// iframe을 1600x1000 고정 viewport로 띄우고 transform scale로 모달에 fit.
// 사용자 화면 크기와 무관하게 annotation 좌표가 일관됨.
const BASE_W = 1600
const BASE_H = 1000

type Rect = { x: number; y: number; w: number; h: number }

function ScreenModal({
  spec,
  caseCtx,
  onClose,
}: {
  spec: ModalSpec
  caseCtx?: Case
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)
  const [rects, setRects] = useState<Array<Rect | null>>([])

  useEffect(() => setMounted(true), [])

  // 모달 크기에 맞춰 stage 스케일
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const s = Math.min(width / BASE_W, height / BASE_H)
      setScale(s)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mounted])

  // iframe 안의 element를 selector로 찾아서 실제 박스 좌표 측정.
  // 페이지가 React hydrate / 데이터 fetch / 모달 open 등으로 사이즈가 계속 바뀌므로
  // target element 각각에 ResizeObserver + body MutationObserver + capture scroll 다 등록.
  useEffect(() => {
    if (!mounted) return
    const iframe = iframeRef.current
    if (!iframe) return

    let elementObservers: ResizeObserver[] = []
    let mutObs: MutationObserver | null = null
    let scrollDoc: Document | null = null
    let pollHandle: ReturnType<typeof setTimeout> | null = null
    let pollTries = 0
    const observedTargets = new Set<Element>()

    const measureRects = () => {
      const doc = iframe.contentDocument
      if (!doc) return
      const next = spec.annotations.map((a) => {
        if (!a.target) return null
        const el = doc.querySelector(a.target) as HTMLElement | null
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left, y: r.top, w: r.width, h: r.height }
      })
      setRects(next)
    }

    const onScroll = () => measureRects()

    const attachElementObservers = () => {
      const doc = iframe.contentDocument
      if (!doc) return
      for (const a of spec.annotations) {
        if (!a.target) continue
        const el = doc.querySelector(a.target) as HTMLElement | null
        if (!el || observedTargets.has(el)) continue
        observedTargets.add(el)
        const obs = new ResizeObserver(measureRects)
        obs.observe(el)
        elementObservers.push(obs)
      }
    }

    const setup = () => {
      const doc = iframe.contentDocument
      if (!doc?.body) return

      attachElementObservers()

      // DOM이 변경되면 새 target이 등장했을 수 있음 + 기존 target의 자식이 바뀌어 사이즈 변경
      if (!mutObs) {
        mutObs = new MutationObserver(() => {
          attachElementObservers()
          measureRects()
        })
        mutObs.observe(doc.body, { childList: true, subtree: true })
      }

      // capture phase로 내부 어떤 element의 스크롤이든 잡음
      if (doc !== scrollDoc) {
        scrollDoc = doc
        doc.addEventListener('scroll', onScroll, { capture: true, passive: true })
      }
    }

    const poll = () => {
      measureRects()
      setup()
      const doc = iframe.contentDocument
      const allFound =
        !!doc &&
        spec.annotations.every((a) => !a.target || doc.querySelector(a.target))
      if (!allFound && pollTries++ < 30) {
        pollHandle = setTimeout(poll, 200)
      }
    }

    const cleanupIframeBound = () => {
      for (const obs of elementObservers) obs.disconnect()
      elementObservers = []
      observedTargets.clear()
      if (mutObs) {
        mutObs.disconnect()
        mutObs = null
      }
      if (scrollDoc) {
        scrollDoc.removeEventListener('scroll', onScroll, {
          capture: true,
        } as EventListenerOptions)
        scrollDoc = null
      }
    }

    const onLoad = () => {
      cleanupIframeBound() // 이전 document에 걸린 observer 해제
      pollTries = 0
      poll()
    }

    iframe.addEventListener('load', onLoad)
    if (iframe.contentDocument?.readyState === 'complete') onLoad()

    return () => {
      iframe.removeEventListener('load', onLoad)
      if (pollHandle) clearTimeout(pollHandle)
      cleanupIframeBound()
    }
  }, [mounted, spec])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onEsc, true)
    return () => window.removeEventListener('keydown', onEsc, true)
  }, [onClose])

  // 모달 unmount 시 preview 쿠키를 명시적으로 clear — 사용자가 모달 닫은 후
  // 같은 탭에서 다른 메뉴 클릭해도 정상 role로 돌아오게.
  useEffect(() => {
    if (!spec.previewAs) return
    return () => {
      fetch('/dashboard?previewAs=clear', { method: 'HEAD' }).catch(() => {})
    }
  }, [spec.previewAs])

  if (!mounted) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-stretch bg-black/60 p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="flex flex-1 overflow-hidden rounded border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={stageRef} className="relative flex-1 overflow-hidden bg-muted">
          <div
            className="absolute left-1/2 top-1/2 origin-center"
            style={{
              width: BASE_W,
              height: BASE_H,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            <iframe
              ref={iframeRef}
              src={
                spec.previewAs
                  ? `${spec.url}${spec.url.includes('?') ? '&' : '?'}previewAs=${spec.previewAs}`
                  : spec.url
              }
              style={{ width: BASE_W, height: BASE_H, border: 0, display: 'block' }}
              title={spec.title}
            />
            <div className="pointer-events-none absolute inset-0">
              {spec.annotations.map((a, i) => {
                const r = rects[i]
                if (!r) return null
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{ top: r.y, left: r.x, width: r.w, height: r.h }}
                  >
                    <div className="absolute inset-0 rounded ring-4 ring-warning/80 ring-offset-2 ring-offset-transparent" />
                    <div className="absolute -top-8 left-0 flex items-center gap-1.5 rounded bg-warning px-2.5 py-1 text-sm font-bold text-warning-foreground shadow whitespace-nowrap">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning-foreground/15 text-xs">
                        {i + 1}
                      </span>
                      {a.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-l bg-card">
          <div className="flex items-start justify-between border-b p-4">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                화면 미리보기
              </p>
              <h3 className="mt-1 text-base font-bold tracking-tight">{spec.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {caseCtx && (
            <div className="space-y-2.5 border-b bg-muted/30 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  질문
                </p>
                <p className="mt-1 text-sm font-bold leading-snug">{caseCtx.q}</p>
              </div>
              <div className="rounded border-l-4 border-danger bg-danger-soft/30 px-2.5 py-2">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-danger-soft-foreground">
                  지금은
                </p>
                <p className="text-xs leading-relaxed">{caseCtx.current}</p>
              </div>
              {caseCtx.ours && (
                <div className="rounded border-l-4 border-primary bg-primary/5 px-2.5 py-2">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    이 화면에서는
                  </p>
                  <p className="text-xs leading-relaxed">{caseCtx.ours}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 space-y-3 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">{spec.desc}</p>
            <div className="space-y-2 pt-2">
              {spec.annotations.map((a, i) => (
                <div key={i} className="rounded border-l-4 border-warning bg-warning-soft/30 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">
                      {i + 1}
                    </span>
                    <p className="text-xs font-bold">{a.label}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-3 text-[10px] text-muted-foreground">
            <kbd className="font-mono">ESC</kbd> 닫기 / 화면 바깥 클릭으로도 닫힘
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}


// 다음 단계 — 논의 + 추가 작업 + 외부 연동
function NextSteps() {
  return (
    <Slide title="다음 단계" num="04" sub="논의 사항 및 다음 단계">
      <div className="space-y-3">
        {/* 1. 논의 필요 (Now) */}
        <div className="rounded border-l-4 border-warning bg-warning-soft/30 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warning-soft-foreground">
            1. 논의 필요 (결정) — Now 시작, 구현 전까지 결론 필요
          </p>
          <ul className="mt-2 space-y-1 text-base">
            <li>- 계약 정보를 우리 페이지에서 보여줄 것인가?</li>
            <li className="text-sm text-muted-foreground pl-3">
              Salesforce에 있는 계약 정보를 고객에게 별도로 보여주는 것이 맞는지에 대한 유관부서 논의 필요<br/>
              계약 정보는 민감한 정보이므로 보여주기로 결정한다면 어떤 권한이 필요한지, 어떤 범위까지 보여줄지 등 세부 논의 필요<br/>
              | 고객경험팀, 파트너서비스운영팀, 네트워크영업팀 등
            </li>
          </ul>
        </div>

        {/* 2. 외부 시스템 연동 (Now 협의 → 1-2개월) */}
        <div className="rounded border-l-4 border-info bg-info-soft/30 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-info-soft-foreground">
            2. 외부 시스템 연동 — Now 협의, 1-2개월 연결 (조회만 / CUD 안 함, 운영 DB 직접 접근 안 함)
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="font-semibold">사내 admin</p>
              <p className="text-xs text-muted-foreground">
                충전소,충전기 정보 / 실시간 상태 / 진행 중 세션 / 충전 이력(정산용) / 가동률,매출 통계 / 메일,문자,알림톡 발송
              </p>
            </div>
            <div>
              <p className="font-semibold">Salesforce (BPMS)</p>
              <p className="text-xs text-muted-foreground">
                계약 조회 / 만료 임박 목록 / 계약 문서 다운로드 / 운영사 정보
              </p>
            </div>
            <div>
              <p className="font-semibold">Zendesk + PMS</p>
              <p className="text-xs text-muted-foreground">
                유지보수 티켓 조회,접수 / 처리 내역
              </p>
            </div>
            <div>
              <p className="font-semibold">한전 (별도 API)</p>
              <p className="text-xs text-muted-foreground">
                전기요금 납부 내역 — 시스템 존재 여부부터 확인 필요
              </p>
            </div>
          </div>
        </div>

        {/* 3. 내부망 이관 (Now 협의 → 1-2개월) */}
        <div className="rounded border-l-4 border-danger bg-danger-soft/30 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-danger-soft-foreground">
            3. 내부망 이관 — Now 협의, 1-2개월 준비 (인프라팀,정보보안팀)
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="font-semibold">운영 환경 구성</p>
              <p className="text-xs text-muted-foreground">사내 인프라(서버, DB)로 이관 / 도메인, 인증서 설정</p>
            </div>
            <div>
              <p className="font-semibold">사내 SSO 연동</p>
              <p className="text-xs text-muted-foreground">사번 기반 통합 로그인. 운영팀은 별도 로그인 없이 진입</p>
            </div>
            <div>
              <p className="font-semibold">정보보안 검토</p>
              <p className="text-xs text-muted-foreground">망분리 정책, 외부 시스템 호출 경로, 개인정보 처리 검수</p>
            </div>
            <div>
              <p className="font-semibold">데이터 이관</p>
              <p className="text-xs text-muted-foreground">개발 DB → 운영 DB 마이그레이션 / 백업,복구 절차 수립</p>
            </div>
          </div>
        </div>

        {/* 4. 유저 테스트 (2-3주) */}
        <div className="rounded border-l-4 border-foreground/40 bg-muted/40 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            4. 유저 테스트 — 2-3주 (17,000 초대 직전)
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="font-semibold">네트워크 영업팀 내부 검증</p>
              <p className="text-xs text-muted-foreground">실제 업무 시나리오 기반 사용, 운영 액션(잠금/권한/발송) 점검</p>
            </div>
            <div>
              <p className="font-semibold">파일럿 파트너 그룹</p>
              <p className="text-xs text-muted-foreground">관리사무소,OEM 소수 그룹에게 먼저 오픈 → 피드백 수집,반영</p>
            </div>
          </div>
        </div>

        {/* 5. 추가 작업 (17,000 초대 직전) */}
        <div className="rounded border-l-4 border-primary bg-primary/5 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            5. 추가 작업 — 17,000명 초대 전까지 완료
          </p>
          <ul className="mt-2 space-y-1 text-base">
            <li>- 17,000명 아이디 일괄 생성 (엑셀 템플릿 다운로드 및 업로드 기능 작업 예정)</li>
          </ul>
        </div>

        {/* 6. 일정 */}
        <div className="rounded border-l-4 border-success bg-success-soft/30 p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-success-soft-foreground">
            6. 예상 일정
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
            {[
              { when: 'Now', what: '데이터혁신팀과 DATA 연동 협의', primary: true },
              { when: '1-2개월', what: '외부 시스템 연결 + 내부망 이관 준비' },
              { when: '2-3주', what: '운영팀,파일럿 파트너 유저 테스트' },
              { when: '단계적', what: '17,000 파트너 초대' },
            ].map((s, i, arr) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={cn(
                    'rounded border bg-card px-2.5 py-1',
                    s.primary && 'border-primary bg-primary/5',
                  )}
                >
                  <span className={cn('font-mono text-[10px]', s.primary ? 'text-primary' : 'text-muted-foreground')}>
                    {s.when}
                  </span>
                  <span className={cn('ml-1.5 text-xs', s.primary ? 'font-bold' : 'font-medium')}>
                    {s.what}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-muted-foreground/40">▸</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── 공통 ──────────────────────────────────────────

function Slide({
  title,
  num,
  sub,
  children,
}: {
  title: string
  num: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col py-20">
      <div className="mb-12">
        <p className="mb-3 font-mono text-sm text-muted-foreground/60">{num}</p>
        <h2 className="text-4xl font-bold tracking-tight">{title}</h2>
        {sub && <p className="mt-1 text-lg text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col items-center justify-center py-20">
      {children}
    </div>
  )
}


function Row({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'external' | 'ours'
  items: string[]
}) {
  return (
    <div className="flex items-baseline gap-8">
      <p
        className={cn(
          'w-48 shrink-0 text-lg font-semibold',
          tone === 'ours' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {title}
      </p>
      <p className="text-xl">{items.join(' / ')}</p>
    </div>
  )
}

function ApiLine({ path, desc }: { path: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-6 border-b py-2">
      <code className="font-mono text-base font-medium">{path}</code>
      <span className="ml-auto text-base text-muted-foreground">{desc}</span>
    </div>
  )
}

function StackItem({ main, sub }: { main: string; sub: string }) {
  return (
    <div>
      <p className="text-3xl font-bold tracking-tight">{main}</p>
      <p className="mt-1 text-base text-muted-foreground">{sub}</p>
    </div>
  )
}
