# PlayCard 개발 지시서 구현 격차 우선순위

> 기준일: 2026-05-04
> 기획서: `docs/plans/playcard 통합 구축 플랫폼 — 개발 지시서.md`
> 디자인: `docs/design/` (★ 모든 UI 작업의 1차 레퍼런스)

## 현재 구현율 스냅샷

도메인 골격(인증/클럽룸/멤버/경기/평가/순위/대시보드/팀구성)의 API와 라우트는 모두 마련되어 있으나, 외부 의존성에 묶인 기능군(Kakao OAuth · Gemini AI · Recharts · Howler BGM · YouTube · PWA · html2canvas)은 거의 미착수. 전체 진척률 ~50–55%.

특히 의존성 격차가 핵심 — `package.json`에 `tailwindcss`, `next-auth`, `zustand`, `recharts`, `howler`, `lucide-react` 등이 부재. 단, **Tailwind 부재는 `docs/design/colors_and_type.css` 토큰 기반 자체 CSS로 일관되게 대체되어 있어** 전면 재작성 대신 현 토큰 체계를 공식 디자인 시스템으로 굳히는 방향이 더 자연스럽다.

## 우선순위 백로그

| 순위 | 작업 | 영역 | Phase | 의존성 추가 | 비고 |
|------|------|------|-------|-------------|------|
| **P0** | 평가 입력 UI 슬라이더화 + 결장 체크박스 | UX 핵심 | 4.1 + 4.2 | 없음 | `docs/design/preview/components-slider.html` 시안 그대로 적용 가능 |
| **P1** | 순위 변동 표시(▲▼−) | UX | 5.1 | 없음 | 직전 경기 대비 산출 — API 변경만 |
| **P2** | 대시보드 차트(Radar + Line) | 시각화 | 5.3 | `recharts` | BEST/NEED 라벨 포함 |
| **P3** | AI 칭호 시스템(Gemini) | 신기능 | 6 | `@google/generative-ai` | 평가 마감 훅에 연결 — 모델 필드(`currentTitle`, `titleHistory`)는 이미 존재 |
| **P4** | PWA 기본(manifest + 아이콘) | 인프라 | 10.1 | `next-pwa` 선택 | 디자인 폴더 로고 자산 활용 |
| **P5** | Kakao OAuth 전환 | 보안 | 2.1 | `next-auth` | 운영 진입 전 필수. 현재 자체 cookie 세션은 테스트용 |
| **P6** | 점수 수정 + 수정 로그 | 운영 | 9.1 | 없음 | 관리자 운영 안정성 |
| **P7** | 팀구성 결과 이미지 저장 | 부가 | 7.3 | `html2canvas` | 공유 채널 확장 |
| **P8** | BGM 시스템(전역 플레이어) | 부가 | 8.1, 8.2 | `zustand`, `howler` | 후순위 |
| **P9** | YouTube 연동 | 부가 | 8.3 | 없음(API 직접) | 후순위 |
| **P10** | 예약 캘린더 | 부가 | 9.2 | 캘린더 라이브러리 | 후순위 |

## 작업 원칙

1. **디자인은 `docs/design/` 1차 레퍼런스** — 컴포넌트 스타일·색·간격은 `colors_and_type.css` 변수만 사용. 새 시각 패턴이 필요하면 `docs/design/preview/`에 시안을 먼저 추가하고 코드에 반영.
2. **Tailwind 도입은 별도 마이그레이션 이슈로 분리** — 현재 진행 중인 P0~P10 작업은 자체 CSS 토큰 체계 위에서 진행.
3. **각 작업 = 단일 SPM 이슈 = 단일 PR**. 묶지 않는다.
4. **테스트 동반 작성**: 핵심 로직 변경 시 `*.test.ts` 추가, `npm run test:run` + `npx tsc --noEmit` 통과 후 종료.

## 다음 액션

P0(평가 입력 슬라이더 + 결장 체크박스)부터 착수. 후속 항목은 PR 머지 후 본 문서를 업데이트하여 추적.
