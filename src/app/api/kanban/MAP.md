# 칸반 API MAP (Bootstrap)

## 현재 상태

- 현재 `src/app/api/kanban` 하위 실제 Route Handler는 아직 없음.
- 기획 기준 경로 인덱스만 선반영.

## 추가 예정 라우트

- `boards/route.ts`
- `boards/[boardId]/route.ts`
- `sections/route.ts`
- `sections/[id]/route.ts`
- `notes/route.ts`
- `notes/[noteId]/route.ts`

## 연관 경로

- 스토어: `src/store/boardStore.ts` (예정)
- 컴포넌트: `src/components/board/` (예정)
