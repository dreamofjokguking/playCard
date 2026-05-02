# API Route MAP (PlayCard)

이 파일은 `src/app/api/**` 인덱스입니다. 상세 작업 전에는 도메인별 MAP을 먼저 확인합니다.

## 현재 구현 라우트

| 도메인 | 경로 | 파일 |
| --- | --- | --- |
| Ping | `/api/ping` | `ping/route.ts` |
| Health (DB) | `/api/health` | `health/route.ts` |
| Health (Cloudinary) | `/api/health/cloudinary` | `health/cloudinary/route.ts` |
| Club Rooms | `/api/club-rooms` | `club-rooms/route.ts` |
| Club Room Detail | `/api/club-rooms/[id]` | `club-rooms/[id]/route.ts` (GET, PATCH, DELETE) |

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
