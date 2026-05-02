# 유저 API MAP (Bootstrap)

## 현재 상태

- 현재 `src/app/api/users` 하위 실제 Route Handler는 아직 없음.

## 추가 예정 라우트

- `route.ts` (유저 목록)
- `me/route.ts` (내 프로필 조회/수정)
- `[id]/route.ts` (유저 상세 조회/수정)

## 연관 경로

- 인증: `src/app/api/auth/[...nextauth]/route.ts` (예정)
- 모델: `src/lib/models/User.ts` (예정)
