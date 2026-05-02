# 프로젝트 API MAP (Bootstrap)

## 현재 상태

- 현재 `src/app/api/projects` 하위 실제 Route Handler는 아직 없음.

## 추가 예정 라우트

- `route.ts` (목록/생성)
- `[id]/route.ts` (단건 조회/수정/삭제)
- `[id]/resources/route.ts` (프로젝트 리소스)

## 연관 경로

- 모델: `src/lib/models/Project.ts` (예정)
- UI: `src/app/admin/*`, `src/components/projects/*` (예정)
