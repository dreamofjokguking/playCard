# PlayCard Bootstrap Checklist

프로젝트를 "간단히 구동 가능" 상태로 확인하기 위한 체크리스트입니다.

## 0) 사전 준비

- [ ] Node.js 20+ 설치
- [ ] `npm install` 성공
- [ ] `.env.local` 생성 (`.env.example` 참고)

## 1) 앱 구동

- [ ] `npm run dev` 실행
- [ ] `http://localhost:3000` 접속
- [ ] 메인 페이지에 `PlayCard Bootstrap` 제목 확인

## 2) API 연결

- [ ] `GET /api/ping` 호출
- [ ] 응답에 `{ success: true, data: { message: "pong" ... } }` 포함
- [ ] `GET /api/health` 호출
- [ ] DB 연결 성공 시 `success: true` + `db: "connected"` 확인

## 3) DB 연결

- [ ] `.env.local`에 `MONGODB_URI` 설정
- [ ] `.env.local`에 `MONGODB_DB_NAME` 선택 설정 (미설정 시 `playcard`)
- [ ] `GET /api/health`에서 연결 상태 확인

## 4) 타입/빌드 기본 점검

- [ ] `npm run typecheck` 성공
- [ ] `npm run build` 성공

## 5) 완료 기준

- [ ] 로컬 개발 서버가 뜬다
- [ ] 기본 API 2개(`/api/ping`, `/api/health`)가 동작한다
- [ ] DB 연결 성공/실패를 API에서 즉시 확인할 수 있다
