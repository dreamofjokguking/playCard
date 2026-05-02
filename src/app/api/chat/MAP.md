# 채팅 API MAP (Bootstrap)

## 현재 상태

- 현재 `src/app/api/chat` 하위 실제 Route Handler는 아직 없음.
- 실시간은 `server.ts` + Socket.io 기반으로 운영 예정.

## 추가 예정 라우트

- `rooms/route.ts`
- `rooms/[roomId]/route.ts`
- `messages/[roomId]/route.ts`

## 연관 경로

- 서버: `server.ts`
- 클라이언트 훅: `src/hooks/useChatSocket.ts` (예정)
