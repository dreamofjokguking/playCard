# 스포츠 동호회 통합 운영 플랫폼 — Claude Code 개발 지시서

## 프로젝트 개요

족구/야구/축구 등 다양한 스포츠 동호회에서 공통으로 사용할 수 있는 경기 기록 관리, 동료 평가, 순위/통계, 자동 팀 구성을 지원하는 **모바일 메인 + 웹(데스크톱) 호환 반응형 플랫폼**을 개발한다.

- 프로젝트명: **PlayCard**

### 확장 방향 (멀티 스포츠)

- 플랫폼은 특정 종목(족구) 전용이 아니라 **클럽룸 단위 멀티 스포츠**를 기본 전제로 설계한다.
- 사용자는 클럽룸을 생성/관리할 수 있으며, 각 클럽룸은 종목/운영 규칙을 독립적으로 가진다.
- 기존의 공격/수비/토스/서브 4개 고정 포지션 대신, **클럽룸 관리자가 평가 항목(포지션/지표)을 추가/삭제**할 수 있어야 한다.

### 반응형 전략 (Mobile-Main, Web-Compatible)

- **기본 타겟**: 모바일 (375px~430px). 사용자의 90% 이상이 모바일로 접속하는 것을 전제로 설계.
- **웹(데스크톱) 호환**: 768px 이상에서도 레이아웃이 깨지지 않고 자연스럽게 확장.
- **브레이크포인트**:
    - `sm` (< 640px): 모바일 기본. 1컬럼, 풀 width, 하단 네비게이션.
    - `md` (640px ~ 1023px): 태블릿. 2컬럼 가능한 영역 확장, 하단 네비게이션 유지.
    - `lg` (1024px+): 데스크톱. 좌측 사이드바 네비게이션 전환, 콘텐츠 max-width 960px 중앙 정렬, 카드 그리드 2~3컬럼.
- **네비게이션 분기**:
    - 모바일/태블릿: 하단 고정 탭 바 (BottomNav)
    - 데스크톱: 좌측 사이드바 네비게이션 (SideNav)
- **관리자 페이지**: 데스크톱에서 사용 빈도가 높으므로 테이블 레이아웃, 넓은 폼 등 데스크톱 UX도 적극 고려.
- **평가 UI**: 모바일은 카드형 세로 스크롤, 데스크톱은 카드 2컬럼 그리드 또는 테이블 뷰 옵션 제공.
- **차트/그래프**: 모바일에서 터치 인터랙션, 데스크톱에서 호버 툴팁 지원. 반응형 리사이즈.

### 기술 스택

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, PWA
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: NextAuth.js + Kakao OAuth
- **AI**: Google Gemini 1.5 Flash API (칭호 생성)
- **Deployment**: [Render.com](http://render.com/)
- **상태관리**: Zustand (전역 BGM 플레이어 등)
- **차트**: Recharts (방사형 차트, 꺾은선 그래프)
- **기타**: YouTube Data API v3, Howler.js (BGM)

### 디자인 참조 원칙 (필수)

- UI/UX 구현, 컴포넌트 스타일링, 색상/타이포 적용 시 **반드시 `docs/design` 폴더를 우선 참조**한다.
- 신규 화면/컴포넌트 추가 시에도 기존 `docs/design`의 토큰/패턴/시안과 일관성을 유지한다.

### PWA 적용 원칙 (필수)

- 본 프로젝트는 **웹 + PWA 동시 지원**을 기본 요구사항으로 한다.
- 기능 구현 단계에서도 PWA 호환성을 깨뜨리는 의존성/패턴(브라우저 전용 API 무가드 사용 등)을 피한다.
- 배포 전 최종 검증 항목에 다음을 포함한다:
  - `manifest.json` 유효성
  - Service Worker 등록/업데이트 동작
  - 오프라인 기본 fallback 동작
  - 모바일 홈 화면 설치 및 재실행 동작

### 디렉토리 구조 (초기)

```
playCard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 전역 레이아웃 (BGM 플레이어 포함)
│   │   ├── page.tsx            # 메인 페이지
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── evaluation/
│   │   ├── ranking/
│   │   ├── team-builder/
│   │   ├── admin/
│   │   └── api/                # API Route Handlers
│   │       ├── auth/
│   │       ├── users/
│   │       ├── club-rooms/
│   │       ├── matches/
│   │       ├── evaluations/
│   │       ├── rankings/
│   │       ├── teams/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                 # 공통 UI (Button, Card, Modal, Slider 등)
│   │   ├── layout/             # Header, Footer, Navigation, BGMPlayer
│   │   ├── evaluation/         # 평가 관련 컴포넌트
│   │   ├── ranking/            # 순위 관련 컴포넌트
│   │   ├── dashboard/          # 대시보드 관련 컴포넌트
│   │   └── team-builder/       # 팀 구성 관련 컴포넌트
│   ├── lib/
│   │   ├── db.ts               # MongoDB 연결
│   │   ├── auth.ts             # NextAuth 설정
│   │   └── gemini.ts           # Gemini API 헬퍼
│   ├── models/                 # Mongoose 스키마
│   │   ├── User.ts
│   │   ├── Match.ts
│   │   ├── Evaluation.ts
│   │   └── Title.ts
│   ├── stores/                 # Zustand 스토어
│   │   └── bgmStore.ts
│   ├── types/                  # TypeScript 타입 정의
│   │   └── index.ts
│   └── utils/
│       ├── teamBalancer.ts     # 팀 밸런싱 알고리즘
│       └── scoring.ts          # 점수 계산 유틸
├── public/
│   ├── audio/                  # BGM 파일
│   └── manifest.json           # PWA manifest
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### DB 스키마 설계

```tsx
// User
{
  _id: ObjectId,
  clubRoomId: ObjectId,               // 소속 클럽룸
  kakaoId: string,                    // 카카오 고유 ID
  nickname: string,                   // 닉네임 (최초 로그인 후 사용자 설정)
  displayName: string,                // 표시명 (닉네임 기반, 동명이인 구분자 포함 가능)
  role: "admin" | "member" | "pending", // pending = 가입 승인 대기
  status: "active" | "inactive",
  profileImage?: string,
  currentTitle?: string,              // 현재 AI 칭호
  titleHistory: [{                    // 칭호 히스토리 (도감)
    title: string,
    matchId: ObjectId,
    createdAt: Date
  }],
  favoriteGroup?: boolean,            // 즐겨찾기(자주 참석) 플래그
  createdAt: Date,
  updatedAt: Date
}

// ClubRoom (클럽룸)
{
  _id: ObjectId,
  name: string,                       // 예: 수요 야간 풋살, 토요 족구
  sportType: "jokgu" | "soccer" | "baseball" | "etc",
  ownerId: ObjectId,                  // 방 생성자(관리자)
  managers: [ObjectId],               // 추가 관리자
  positionMetrics: [{                 // 클럽룸별 동적 평가 항목
    key: string,                      // 예: attack, defense, pass
    label: string,                    // 예: 공격, 수비, 패스
    isActive: boolean,
    order: number
  }],
  createdAt: Date,
  updatedAt: Date
}

// Match (경기)
{
  _id: ObjectId,
  clubRoomId: ObjectId,               // 경기 소속 클럽룸
  date: Date,
  time: string,                       // "19:00"
  venue?: string,                     // 경기장
  participants: [ObjectId],           // User 참조
  status: "evaluating" | "completed" | "cancelled",
  evaluationDeadline?: Date,
  evaluationsSubmitted: [ObjectId],   // 제출 완료한 User ID 목록
  mvpVotes: [{                        // MVP 투표 집계
    voterId: ObjectId,
    selectedUserId: ObjectId
  }],
  results?: {                         // 평가 종료 후 최종 집계
    playerStats: [{
      userId: ObjectId,
      metricStats: [{                 // 클럽룸별 동적 평가 항목 집계
        metricKey: string,
        avg: number,
        count: number
      }],
      overall: number,                // 가중 평균
      absences: string[],             // 결장 항목 key 목록
      mvpCount: number,
      comments: string[]             // 한줄평 모음
    }]
  },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Evaluation (개별 평가 원본)
{
  _id: ObjectId,
  clubRoomId: ObjectId,               // 평가 소속 클럽룸
  matchId: ObjectId,
  evaluatorId: ObjectId,              // 평가자
  ratings: [{
    targetUserId: ObjectId,           // 피평가자
    metricScores: [{                  // 클럽룸별 동적 평가 항목 점수
      metricKey: string,
      score?: number                  // 0.0~10.0 (결장이면 null)
    }],
    absences: string[],               // 해당 선수의 결장 항목 key
    comment?: string,                 // 한줄평
  }],
  mvpPick: ObjectId,                  // MVP 선정
  submittedAt: Date
}

// BGMTrack (음원 관리)
{
  _id: ObjectId,
  title: string,
  fileUrl: string,                    // CDN URL 또는 로컬 경로
  uploadedBy: ObjectId,
  isActive: boolean,
  order: number,                      // 재생 순서
  createdAt: Date
}
```

### 핵심 비즈니스 로직 명세

**점수 계산:**

- 각 평가 항목 점수: 0.0 ~ 10.0 (소수점 첫째 자리까지)
- 결장(absent) 항목은 null 처리, 평균 계산에서 제외
- 전체 평균 = (출전한 평가 항목 점수 합) / (출전 평가 항목 수)
- 본인 평가는 불가 (자동 제외)

**클럽룸/평가 항목 관리:**

- 사용자(관리자)는 클럽룸을 생성/수정/관리할 수 있다.
- 클럽룸 관리자는 평가 항목(포지션/지표)을 추가/삭제/정렬할 수 있다.
- 경기/평가/순위 집계는 해당 클럽룸의 활성 평가 항목 목록을 기준으로 동작한다.

**평가 종료 조건:**

- 참여자 전원 제출 완료 시 자동 마감
- 마감 즉시 Match.results에 집계 결과 기록

**순위 변동:**

- 전일(직전 경기) 대비 순위 변동폭 계산
- 상승 = 빨강(▲), 하락 = 파랑(▼), 유지 = 회색(-)

**MVP 집계:**

- 각 평가자가 1인 선정, 최다 득표자가 MVP
- 동률 시 전체 평균 점수가 높은 선수가 MVP

**권한 체계:**

- 비회원(비로그인): 전체 순위 열람만 가능
- member: 평가 참여, 개인 대시보드 열람, 팀 구성 결과 확인
- admin: 경기 개설, 평가 방 관리, 회원 승인, 점수 수정, BGM/유튜브 관리, 즐겨찾기 그룹 관리

---

## Phase 1: 프로젝트 초기 설정 및 기반 구축

### Step 1.1 — 프로젝트 초기화

- `npx create-next-app@latest jokgu-app --typescript --tailwind --app --src-dir`
- 필요 패키지 설치: `mongoose`, `next-auth`, `zustand`, `recharts`, `howler`, `lucide-react`
- `.env.local` 환경변수 템플릿 생성 (MONGODB_URI, KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL, GEMINI_API_KEY, YOUTUBE_API_KEY)
- `tsconfig.json` path alias 설정 (`@/` → `src/`)
- **테스트**: `npm run dev` 실행 → localhost:3000에서 기본 Next.js 페이지 확인

### Step 1.2 — 공통 타입 및 DB 연결

- `src/types/index.ts`에 User, ClubRoom, Match, Evaluation, BGMTrack 타입 정의 (위 스키마 기반)
- `src/lib/db.ts`에 MongoDB 싱글톤 연결 함수 작성
- `src/models/` 아래 Mongoose 스키마 5개 (User, ClubRoom, Match, Evaluation, BGMTrack) 작성
- **테스트**: 간단한 API route (`/api/health`)에서 DB 연결 확인 → `{ status: "ok", db: "connected" }` 응답

### Step 1.3 — 전역 레이아웃 및 반응형 네비게이션

- `src/app/layout.tsx`: 반응형 레이아웃 (모바일: 풀 width + 하단 nav 영역 패딩, 데스크톱: 좌측 사이드바 + 콘텐츠 영역)
- `src/hooks/useMediaQuery.ts`: 브레이크포인트 감지 커스텀 훅 (lg: 1024px 기준)
- `src/components/layout/Header.tsx`: 로고 + 현재 페이지명 + 로그인/프로필 버튼
- `src/components/layout/BottomNav.tsx`: 모바일/태블릿 하단 고정 탭 바 (홈, 평가, 순위, 팀구성, 관리 — 아이콘 + 텍스트) → `lg` 이상에서 `hidden`
- `src/components/layout/SideNav.tsx`: 데스크톱 좌측 사이드바 네비게이션 (동일 메뉴, 아이콘 + 텍스트, 접기/펼치기) → `lg` 미만에서 `hidden`
- `src/components/layout/ResponsiveShell.tsx`: BottomNav / SideNav를 뷰포트에 따라 분기하는 래퍼 컴포넌트
- 라우팅 구조 생성 (각 page.tsx는 빈 플레이스홀더)
- **테스트**: 모바일(375px)에서 하단 탭 표시 + 사이드바 미표시, 데스크톱(1280px)에서 사이드바 표시 + 하단 탭 미표시 확인, 각 route 접근 가능 확인

### Step 1.4 — 공통 UI 컴포넌트

- `Button` (variant: primary/secondary/ghost, size: sm/md/lg, loading 상태)
- `Card` (그림자, 라운드, 패딩 옵션)
- `Modal` (바텀시트 스타일 — 모바일 최적화, 오버레이 + 슬라이드업)
- `Slider` (0.0~10.0 범위, 0.1 단위 스텝, 현재 값 표시 라벨)
- `Badge` (상태 표시: 진행중/완료/대기 등)
- `Spinner` (로딩 인디케이터)
- **테스트**: 각 컴포넌트를 임시 테스트 페이지(`/test`)에 렌더링하여 시각적으로 확인

---

## Phase 2: 인증 시스템

### Step 2.1 — NextAuth + Kakao OAuth 설정

- `src/lib/auth.ts`에 NextAuth 설정 (KakaoProvider)
- `src/app/api/auth/[...nextauth]/route.ts` 라우트 핸들러
- 카카오 로그인 시 사용자 식별 정보만 연동하고, 닉네임은 서비스 내에서 설정 → DB에 User upsert
- 신규 사용자는 role: "pending"으로 생성 (관리자 승인 필요)
- **테스트**: 카카오 로그인 버튼 클릭 → 카카오 인증 → 리다이렉트 → DB에 유저 생성 확인

### Step 2.2 — 로그인/로그아웃 UI

- `src/app/login/page.tsx`: 카카오 로그인 버튼 (카카오 브랜드 가이드 준수)
- 로그인 성공 → 메인 페이지 리다이렉트
- 미승인 사용자(pending) → "관리자 승인 대기 중" 안내 화면
- 로그아웃 기능 (프로필 드롭다운에서)
- **테스트**: 로그인→메인 이동 확인, pending 유저 차단 확인, 로그아웃 동작 확인

### Step 2.3 — 접근 제어 미들웨어

- `src/middleware.ts`에서 보호 라우트 체크
- 비로그인: `/ranking` (전체 순위)만 접근 허용, 나머지 → `/login` 리다이렉트
- pending 유저: 대기 화면만 노출
- admin 전용 라우트: `/admin/*` 접근 제어
- **테스트**: 비로그인 상태에서 각 라우트 접근 시도 → 리다이렉트 확인

---

## Phase 3: 관리자 — 회원 관리 및 경기 개설

### Step 3.1 — 관리자 회원 관리

- `src/app/admin/members/page.tsx`
- **모바일**: 카드 리스트 (이름, 상태 뱃지, 액션 버튼)
- **데스크톱**: 테이블 레이아웃 (이름, 상태, 역할, 가입일, 즐겨찾기, 액션 열)
- "승인 대기" 탭 → 가입 승인/거부 버튼
- 동명이인 구분자 수동 부여 (displayName 편집)
- 회원 역할 변경 (member ↔ admin)
- 즐겨찾기 그룹 토글
- API: `GET /api/admin/members`, `PATCH /api/admin/members/[id]`
- **테스트**: pending 유저 승인 → role 변경 확인, displayName 편집 반영 확인, 모바일 카드/데스크톱 테이블 전환 확인

### Step 3.2 — 경기 개설 (평가 방 생성)

- `src/app/admin/matches/new/page.tsx`
- 입력: 날짜(DatePicker), 시간(TimePicker), 경기장(텍스트, 선택)
- 참여자 다중 선택: 전체 회원 목록에서 체크박스 선택
    - 즐겨찾기 그룹 "한번에 선택" 버튼
    - 검색 필터
- 생성 시 Match 문서 생성 (status: "evaluating")
- API: `POST /api/matches`
- **테스트**: 경기 생성 → DB에 Match 문서 확인, 참여자 ID 정확히 저장 확인

### Step 3.3 — 경기 관리 목록 및 모니터링

- `src/app/admin/matches/page.tsx`
- 경기 목록 (날짜순 정렬, 상태 뱃지)
- 진행중 경기: "현재 N명 중 M명 평가 완료" 실시간 표시 (폴링 또는 SWR revalidation)
- 경기 취소, 수동 마감 기능
- API: `GET /api/matches`, `PATCH /api/matches/[id]`
- **테스트**: 경기 생성 후 목록에 노출 확인, 상태 변경 확인

---

## Phase 4: 핵심 — 경기 평가 시스템

### Step 4.1 — 평가 진입 및 결장 정보 등록

- `src/app/evaluation/[matchId]/page.tsx`
- 메인 화면에 "현재 평가 진행 중인 경기가 있습니다" 배너 (evaluating 상태인 경기 존재 시)
- 배너 클릭 → 평가 화면 진입
- **결장 등록 화면**: 참여자 목록 + 각 포지션별 체크박스 (결장 여부)
    - 평가자가 각 선수의 결장 포지션을 선택
    - "다음" 버튼 → 평가 입력 화면으로 이동
- API: 결장 정보는 Evaluation 제출 시 함께 저장
- **테스트**: 경기 배너 노출 확인, 결장 체크 후 다음 화면 이동 확인

### Step 4.2 — 평가 입력 UI (반응형)

- `src/components/evaluation/PlayerCard.tsx`
- **모바일 (< 1024px)**: 카드형 리스트 — 한 명씩 크게 표시, 상하 스크롤
- **데스크톱 (≥ 1024px)**: 카드 2컬럼 그리드 — 한 화면에 2명씩 표시, 더 넓은 슬라이더
- 카드 구성:
    - 선수 이름 + 프로필 이미지
    - 포지션별 점수 입력 (공격/수비/토스/서브)
        - 결장 포지션: 회색 비활성화 + "결장" 표시
        - 슬라이더: 0.0~10.0 범위 (기본값 5.0)
        - ±0.1 미세조정 버튼 (슬라이더 양옆)
        - 숫자 직접 터치/클릭 → 키패드/인풋 입력
    - 한줄평 입력란 (텍스트, 선택사항, placeholder: "오늘 이 선수에 대해 한마디!")
- 본인 카드: 자동 건너뛰기 (목록에서 제외)
- 하단 진행률 표시 ("3/7명 평가 완료")
- **테스트**: 모바일 1컬럼 / 데스크톱 2컬럼 확인, 슬라이더 드래그 → 값 변경 확인, ±버튼 동작, 결장 포지션 비활성화, 본인 카드 미노출

### Step 4.3 — MVP 선정 및 제출

- 모든 선수 평가 완료 후 → MVP 선정 화면
- 참여자 목록에서 1인 선택 (라디오 버튼 형태)
- "제출하기" 버튼 (모든 평가 + MVP 선정 완료 시에만 활성화)
- 제출 확인 모달: "제출 후 수정이 불가합니다. 제출하시겠습니까?"
- API: `POST /api/evaluations`
    - 중복 제출 방지 (evaluatorId + matchId 유니크)
    - 제출 후 Match.evaluationsSubmitted에 userId push
- **테스트**: 미완료 시 제출 버튼 비활성화, 제출 → DB 저장 확인, 중복 제출 차단

### Step 4.4 — 평가 자동 마감 및 집계

- 매 제출마다 체크: `evaluationsSubmitted.length === participants.length`
- 전원 완료 시:
    1. Match.status → "completed"
    2. 모든 Evaluation 데이터 집계:
        - 선수별/포지션별 평균 점수 계산 (본인 평가 제외, 결장 null 제외)
        - MVP 최다 득표자 산출 (동률 시 전체 평균 높은 선수)
        - 한줄평 수집
    3. Match.results에 최종 집계 저장
- API: `POST /api/evaluations` 내부에서 자동 트리거
- **테스트**: 마지막 평가자 제출 → status "completed" 전환, results 필드 정상 집계 확인

---

## Phase 5: 데이터 시각화 — 순위 및 대시보드

### Step 5.1 — 전체 순위 페이지

- `src/app/ranking/page.tsx` (비로그인 접근 가능)
- **종합 순위 탭**: 전체 평균 기준 순위 리스트
    - 순위 번호, 이름, 현재 칭호, 전체 평균 점수
    - 순위 변동 표시: ▲ 빨강, ▼ 파랑, - 회색 (직전 경기 대비)
- **포지션별 순위 탭**: 공격/수비/토스/서브 각각 1위~전체
- API: `GET /api/rankings?type=overall|attack|defense|toss|serve`
    - 완료된 모든 Match의 results를 기반으로 누적 평균 계산
- **테스트**: 순위 데이터 정렬 정확성, 포지션 탭 전환, 변동 아이콘 표시

### Step 5.2 — MVP 시상대

- 별도 MVP 전용 페이지는 두지 않고, 순위 페이지에 **점수 기반 시상대(1~3위)**를 포함
- **시상대 기준**: 전체 평균 점수 상위 3명 (2위-1위-3위 배치, 높이 차이)
- 경기별 MVP 히스토리는 리스트로 별도 노출 가능
- API: `GET /api/rankings?type=overall` (시상대 데이터 재사용)
- **테스트**: 시상대 레이아웃 정상 렌더, 상위 3명 점수 정렬 정확성

### Step 5.3 — 개인 대시보드

- `src/app/dashboard/page.tsx` (로그인 필수)
- **성장 그래프**: Recharts LineChart — 경기별 전체 평균 점수 추이
- **포지션별 능력치 차트**: Recharts RadarChart (공격/수비/토스/서브)
    - 최고 포지션: 황금색 별(★) + "BEST" 라벨
    - 최저 포지션: 파란색 역삼각형(▼) + "NEED IMPROVEMENT" 라벨
- **현재 칭호 표시**: 프로필 카드 상단에 현재 AI 칭호
- **최근 경기 기록**: 최근 5경기의 포지션별 점수 카드
- API: `GET /api/users/[id]/dashboard`
- **테스트**: 차트 정상 렌더, BEST/LOW 라벨 정확한 포지션에 표시, 데이터 없을 때 빈 상태 처리

### Step 5.4 — 경기별 상세 결과

- `src/app/evaluation/[matchId]/result/page.tsx`
- 해당 경기 참여자별 포지션 점수, 전체 평균, 순위
- MVP 선정 선수는 이름/카드에 **MVP 마크**(배지/아이콘) 표시
- 한줄평 익명 리스트 (누가 썼는지는 비공개)
- API: `GET /api/matches/[id]/results`
- **테스트**: 결과 데이터 정확성, 한줄평 노출, 결장 포지션 "-" 표시

---

## Phase 6: AI 칭호 시스템

### Step 6.1 — Gemini API 연동 및 칭호 생성

- `src/lib/gemini.ts`: Gemini 1.5 Flash API 호출 헬퍼
- **프롬프트 설계**:
    
    ```
    당신은 족구 동호회의 칭호 생성 AI입니다.
    아래 한줄평들을 분석하여 해당 선수의 8글자 이내 칭호를 1개 생성하세요.
    
    규칙:
    - 비하적 표현 금지. 부진한 기록은 위트 있는 비유로 표현.
    - 카테고리: 기술/성과형, 스타일/캐릭터형, 유머형 중 가장 적합한 것.
    - 한줄평이 없거나 부족하면 포지션 점수 데이터를 기반으로 생성.
    
    한줄평: {comments}
    포지션 점수: 공격 {attack}, 수비 {defense}, 토스 {toss}, 서브 {serve}
    
    반드시 칭호 한 개만 응답하세요. (예: "네트 위의 암살자")
    ```
    
- **배치 처리**: 경기 마감(평가 전원 완료) 시점에 해당 경기 참여자 전원에 대해 일괄 호출
- **캐싱**: 생성된 칭호를 User.currentTitle에 저장, titleHistory에 push
- API: `POST /api/matches/[id]/generate-titles` (평가 마감 시 자동 호출)
- **테스트**: Gemini API 호출 → 칭호 생성 확인, User 필드 업데이트, 히스토리 추가 확인

### Step 6.2 — 칭호 도감 (마이페이지)

- `src/app/dashboard/titles/page.tsx`
- 역대 칭호 리스트: 칭호명, 부여 날짜, 해당 경기 링크
- 현재 칭호 하이라이트
- **테스트**: 칭호 목록 렌더, 빈 상태("아직 칭호가 없습니다") 처리

---

## Phase 7: 자동 팀 구성

### Step 7.1 — 팀 구성 알고리즘

- `src/utils/teamBalancer.ts`
- **입력**: 참여자 ID 배열 + 최근 경기 데이터(포지션별 평균)
- **4가지 모드 구현**:
    - `balanceTotal()`: 양 팀 평점 총합 차이 최소화 (조합 탐색)
    - `balancePosition()`: 포지션별 상위 2명을 분리 배치
    - `topVsBottom()`: 상위 50% vs 하위 50%
    - `random()`: Fisher-Yates 셔플
- 각 모드의 결과: `{ teamA: Player[], teamB: Player[], teamATotal: number, teamBTotal: number, gap: number }`
- **테스트**: 6명, 8명, 10명 등 다양한 인원으로 각 모드 실행 → 결과 검증 (유닛 테스트)

### Step 7.2 — 반자동 모드 + 수동 모드

- **반자동**: 고정 선수(팀+포지션) 지정 후 나머지 자동 밸런스
    - UI: 드래그 앤 드롭 또는 선택 UI로 고정 멤버 배치
- **수동**: 관리자가 직접 선수 배치 → 각 팀 합산 점수 실시간 표시
    - 포지션 슬롯에 선수를 드래그/선택 → 즉시 합산 점수 갱신
- **테스트**: 고정 멤버가 결과에 반영되는지, 수동 모드 합산 정확성

### Step 7.3 — 팀 구성 결과 UI

- `src/app/team-builder/page.tsx`
- "청팀 vs 홍팀" 그래픽 카드 출력
    - 팀별 선수 이름 + 포지션 배치 + 합산 점수
    - 점수 차이 표시 ("밸런스 격차: 0.3점")
- 4가지 옵션(A/B/C/D) 탭으로 전환
- **캡처 공유**: 결과 카드 영역에 "이미지 저장" 버튼 (html2canvas 활용)
- API: `POST /api/teams/generate`
- **테스트**: 각 옵션 결과 정상 렌더, 이미지 저장 기능 동작

---

## Phase 8: BGM 시스템 및 부가기능

### Step 8.1 — 전역 BGM 플레이어

- `src/store/bgmStore.ts`: Zustand 스토어 (재생 상태, 현재 곡, 볼륨, 음소거)
- `src/components/layout/BGMPlayer.tsx`:
    - layout.tsx에 포함 → 페이지 이동해도 언마운트 안 됨
    - 화면 하단/상단 구석에 작은 이퀄라이저 아이콘
    - 클릭 시: 재생/일시정지 토글
    - 길게 누르기 또는 확장: 볼륨 조절, 곡 변경
- Howler.js로 오디오 재생 관리
- 트랙 목록은 DB(BGMTrack)에서 로드
- **테스트**: 페이지 이동 시 음악 끊김 없음 확인, 음소거/재생 토글, 곡 전환

### Step 8.2 — BGM 관리 (관리자)

- `src/app/admin/bgm/page.tsx`
- 음원 업로드 (파일 업로드 → public/audio/ 또는 외부 스토리지)
- 트랙 목록 관리: 순서 변경, 활성화/비활성화, 삭제
- API: `POST /api/admin/bgm`, `GET /api/bgm/tracks`, `PATCH /api/admin/bgm/[id]`
- **테스트**: 음원 업로드 후 재생 가능 여부, 순서 변경 반영

### Step 8.3 — 유튜브 연동

- `src/app/admin/youtube/page.tsx`
- YouTube Data API v3로 지정 채널의 최신 영상 목록 가져오기
- 관리자가 연동 채널 URL/ID 설정
- 메인 페이지 또는 별도 페이지에 최신 영상 카드 리스트 (썸네일 + 제목 + 링크)
- API: `GET /api/youtube/latest`
- **테스트**: 유튜브 채널 설정 → 최신 영상 목록 렌더 확인

---

## Phase 9: 관리자 부가기능

### Step 9.1 — 점수 수정 기능

- `src/app/admin/matches/[id]/edit/page.tsx`
- 경기 결과 열람 → 선수별 포지션 점수 직접 수정
- **수정 로그 기록**: 원래 값, 수정 값, 수정 시각, 수정자(관리자) 기록
- 수정 후 results 재집계
- API: `PATCH /api/admin/matches/[id]/scores`
- **테스트**: 점수 수정 → 재집계 정확성, 수정 로그 DB 저장 확인

### Step 9.2 — 예약 캘린더

- `src/app/admin/calendar/page.tsx`
- 달력 UI (월간 뷰)
- 날짜 클릭 → 경기 일정 등록/수정
- 참석 예정자 등록: 회원 목록에서 다중 선택 (즐겨찾기 그룹 "일괄 선택" 버튼)
- API: `POST /api/admin/schedule`, `GET /api/admin/schedule`
- **테스트**: 캘린더 렌더, 일정 등록/조회, 즐겨찾기 그룹 일괄 선택

---

## Phase 10: PWA 및 배포 최적화

### Step 10.1 — PWA 설정

- `public/manifest.json` 작성 (앱 이름, 아이콘, theme_color 등)
- Service Worker 등록 (next-pwa 또는 수동)
- 모바일 홈 화면 추가 지원
- **테스트**: 모바일 브라우저에서 "홈 화면에 추가" → 앱처럼 실행 확인

### Step 10.2 — 성능 최적화 및 배포

- 이미지 최적화 (next/image)
- API 응답 캐싱 전략 (SWR stale-while-revalidate)
- MongoDB 인덱스 설정 (Match.date, User.kakaoId, Evaluation의 matchId+evaluatorId 복합 인덱스)
- [Render.com](http://render.com/) 배포 설정 (빌드 커맨드, 환경변수)
- **테스트**: Lighthouse 모바일 점수 확인 (목표: Performance 80+), 배포 URL 접근 확인

---

## 전체 작업 시 주의사항

1. **모바일 메인 + 웹 호환 반응형**: 모든 UI는 375px 모바일 기준으로 **먼저** 설계한 뒤, Tailwind의 `md:`, `lg:` 접두사로 태블릿/데스크톱 레이아웃을 확장한다. 데스크톱에서는 콘텐츠 영역 max-width 960px 중앙 정렬. 모바일 전용으로 가두지 말 것 — 넓은 화면에서는 그리드, 사이드바, 넓은 테이블 등 데스크톱 장점을 활용.
2. **네비게이션 이중 구현**: 모바일 하단 탭(BottomNav) + 데스크톱 좌측 사이드바(SideNav)를 뷰포트에 따라 분기. 두 네비게이션의 메뉴 항목과 활성 상태는 항상 동기화.
3. **에러 핸들링**: 모든 API에 try-catch + 적절한 HTTP 상태코드 + 사용자 친화적 에러 메시지.
4. **로딩 상태**: 모든 데이터 페칭에 스켈레톤 UI 또는 스피너 표시.
5. **빈 상태(Empty State)**: 데이터가 없을 때의 안내 문구 + 일러스트 처리.
6. **한국어 UI**: 모든 사용자 노출 텍스트는 한국어. 코드/변수명은 영문.
7. **TypeScript 엄격 모드**: `strict: true`, any 사용 금지.
8. **각 Step 완료 후 반드시 `npm run build` 통과 확인** — 빌드 에러 없이 다음 Step 진행.
9. **반응형 테스트 필수**: 각 UI Step 완료 시 모바일(375px), 태블릿(768px), 데스크톱(1280px) 3개 뷰포트에서 레이아웃 확인.
