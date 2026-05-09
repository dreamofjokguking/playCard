# API Route MAP (PlayCard)

이 파일은 `src/app/api/**` 인덱스입니다. 상세 작업 전에는 도메인별 MAP을 먼저 확인합니다.

## 현재 구현 라우트

| 도메인 | 경로 | 파일 |
| --- | --- | --- |
| Ping | `/api/ping` | `ping/route.ts` |
| Health (DB) | `/api/health` | `health/route.ts` |
| Health (Cloudinary) | `/api/health/cloudinary` | `health/cloudinary/route.ts` |
| Auth Session | `/api/auth/session` | `auth/session/route.ts` (GET, POST, DELETE) |
| Auth Me | `/api/auth/me` | `auth/me/route.ts` (GET) |
| Auth Kakao Start | `/api/auth/kakao/start` | `auth/kakao/start/route.ts` (GET) — Kakao authorize URL로 302 + state 쿠키 |
| Auth Kakao Callback | `/api/auth/kakao/callback` | `auth/kakao/callback/route.ts` (GET) — code→token→userinfo→User upsert(by kakaoId)→세션 쿠키 |
| Auth Google Start | `/api/auth/google/start` | `auth/google/start/route.ts` (GET) — Google authorize URL로 302 + state 쿠키 |
| Auth Google Callback | `/api/auth/google/callback` | `auth/google/callback/route.ts` (GET) — code→token→userinfo→User upsert(by googleId)→세션 쿠키 |
| Club Rooms | `/api/club-rooms` | `club-rooms/route.ts` |
| Club Room Detail | `/api/club-rooms/[id]` | `club-rooms/[id]/route.ts` (GET, PATCH, DELETE) |
| Admin Matches | `/api/admin/matches` | `admin/matches/route.ts` (GET, POST) |
| Admin Match Detail | `/api/admin/matches/[id]` | `admin/matches/[id]/route.ts` (GET, PATCH) |
| Admin Members | `/api/admin/members` | `admin/members/route.ts` (GET) |
| Admin Member Detail | `/api/admin/members/[id]` | `admin/members/[id]/route.ts` (PATCH) |
| Admin Evaluations List | `/api/admin/evaluations?matchId=...` | `admin/evaluations/route.ts` (GET) — 매치별 평가 + editLog + nameMap |
| Admin Evaluation Edit | `/api/admin/evaluations/[id]` | `admin/evaluations/[id]/route.ts` (PATCH) — 점수/MVP 수정 + reason 필수 + editLog push + Match.results 재계산 |
| User Me | `/api/users/me` | `users/me/route.ts` (PATCH) — 닉네임 변경 + 온보딩 완료 처리 |
| Upload Image | `/api/upload/image` | `upload/image/route.ts` (POST) — Cloudinary 업로드 (5MB, JPEG/PNG/WebP/GIF) |
| Club Applications | `/api/club-rooms/[id]/applications` | `club-rooms/[id]/applications/route.ts` (POST/GET) — 가입 신청 / 신청자 목록 |
| Club Application Decision | `/api/club-rooms/[id]/applications/[applicantId]` | `club-rooms/[id]/applications/[applicantId]/route.ts` (PATCH) — 승인/거절 + 알림 + role 자동 승격 |
| Club YouTube Latest | `/api/club-rooms/[id]/youtube-latest?limit=N` | `club-rooms/[id]/youtube-latest/route.ts` (GET) — 클럽 등록 channel_id로 RSS fetch + 파싱, 10분 캐시 |
| Dev Sync Indexes (dev only) | `/api/dev/sync-user-indexes` | `dev/sync-user-indexes/route.ts` (GET) — User 컬렉션 인덱스 마이그레이션 (sparse → partialFilterExpression) |
| Evaluation Current | `/api/evaluations/current` | `evaluations/current/route.ts` (GET) |
| Evaluation Position Submit | `/api/evaluations/positions` | `evaluations/positions/route.ts` (POST) |
| Evaluation Submit | `/api/evaluations` | `evaluations/route.ts` (POST) |
| Match Results | `/api/matches/[id]/results` | `matches/[id]/results/route.ts` (GET) |
| Match Share | `/api/matches/[id]/share` | `matches/[id]/share/route.ts` (GET) |
| Rankings | `/api/rankings` | `rankings/route.ts` (GET) |
| Notifications | `/api/notifications` | `notifications/route.ts` (GET) |
| Notifications Read | `/api/notifications/read` | `notifications/read/route.ts` (PATCH) |
| User Dashboard | `/api/users/[id]/dashboard` | `users/[id]/dashboard/route.ts` (GET) |
| Dev Seed (dev only) | `/api/dev/seed` | `dev/seed/route.ts` (POST) — `NODE_ENV !== 'production'` 일 때만 동작. ClubRoom/User/Match/Evaluation/AiSettings 시드 생성 후 자동 로그인 쿠키 세팅 |
| Dev Promote (dev only) | `/api/dev/promote` | `dev/promote/route.ts` (POST) — 현재 세션 사용자를 `service_admin`으로 승격(없으면 신규 생성) |
| Dev Gemini Health (dev only) | `/api/dev/gemini-health` | `dev/gemini-health/route.ts` (GET) — 현재 AiSettings로 샘플 칭호 1회 생성, 응답시간/등급 반환 |
| Admin AI Settings | `/api/admin/ai/settings` | `admin/ai/settings/route.ts` (GET, PATCH) — service_admin 전용. titlePrompt/modelName 관리 |
| User Titles | `/api/users/[id]/titles` | `users/[id]/titles/route.ts` (GET) — 본인 칭호 도감(현재 칭호 + titleHistory) |
| Club Room Matches | `/api/club-rooms/[id]/matches` | `club-rooms/[id]/matches/route.ts` (GET) — 그 클럽의 완료 매치 목록(드롭다운용) |
| Club Room History | `/api/club-rooms/[id]/history` | `club-rooms/[id]/history/route.ts` (GET) — 사용자×메트릭 매트릭스(매치별 평균+증감) |

## 도메인별 MAP

| 도메인 | MAP |
| --- | --- |
| AI | `src/app/api/ai/MAP.md` |
| 칸반 | `src/app/api/kanban/MAP.md` |
| 프로젝트 | `src/app/api/projects/MAP.md` |
| 유저 | `src/app/api/users/MAP.md` |
| WBS | `src/app/api/wbs/MAP.md` |
| 채팅 | `src/app/api/chat/MAP.md` |

## 기획상 추가 예정 라우트

- `src/app/api/club-rooms/` (클럽룸 생성/조회/수정)
- `src/app/api/auth/` (NextAuth)
- `src/app/api/matches/`, `src/app/api/evaluations/`, `src/app/api/rankings/`, `src/app/api/teams/`

## 공통 패턴

```ts
export const dynamic = 'force-dynamic';
// 인증/DB 필요 라우트는 dbConnect + withApiLogging 패턴 적용
```
