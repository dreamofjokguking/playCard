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
| Club Rooms | `/api/club-rooms` | `club-rooms/route.ts` |
| Club Room Detail | `/api/club-rooms/[id]` | `club-rooms/[id]/route.ts` (GET, PATCH, DELETE) |
| Admin Matches | `/api/admin/matches` | `admin/matches/route.ts` (GET, POST) |
| Admin Match Detail | `/api/admin/matches/[id]` | `admin/matches/[id]/route.ts` (GET, PATCH) |
| Admin Members | `/api/admin/members` | `admin/members/route.ts` (GET) |
| Admin Member Detail | `/api/admin/members/[id]` | `admin/members/[id]/route.ts` (PATCH) |
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
