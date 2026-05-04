# 디자인 시스템 적용 점검 (PC-7)

> 기준일: 2026-05-04
> 시안: `docs/design/colors_and_type.css`, `docs/design/preview/*`, `docs/design/README.md`
> 코드: `src/app/globals.css`, `src/components/**`, `src/app/**`

## TL;DR

색상·타이포·간격 토큰의 **이름/스케일이 시안보다 단순화**되어 있어 시안의 풍부한 등급/시맨틱 색상을 코드에서 활용하기 어렵습니다. 본 PR에서는 **시안 토큰을 globals.css에 alias·신규 추가**해 점진적 마이그레이션 기반을 만들고, **즉시 보강 가능한 격차**(podium 색 토큰화, 등급 chip 색, 버튼 트랜지션, 모노 폰트)를 손봅니다. 큰 시각 변경(player-card 그라디언트, 카드형 bottom nav)은 후속 PR로 분리.

---

## 토큰 매핑 표

| 시안 (`colors_and_type.css`) | globals.css 현재 | 격차 / 결정 |
|---|---|---|
| `--pc-bg` `#0E1018` | `--pc-bg` `#0e1018` | ✅ 일치 |
| `--pc-bg-deep` `#161A26` | (없음) | 🟡 신규 추가 |
| `--pc-surface` `#1C2030` | `--pc-surface` `#1c2030` | ✅ 일치 |
| `--pc-surface-elevated` `#262B40` | (없음) | 🟡 신규 추가 |
| `--pc-border` `#2F3550` | `--pc-line` `#2f3550` | 🟠 alias로 정합화 |
| `--pc-border-strong` `#3D456A` | (없음) | 🟡 신규 추가 |
| `--pc-ink` `#FFF8EC` | `--pc-text` `#fff8ec` | 🟠 alias |
| `--pc-ink-secondary` `#C9BBA0` | `--pc-muted` `#c9bba0` | 🟠 alias |
| `--pc-ink-tertiary` `#8A7E66` | (없음) | 🟡 신규 |
| `--pc-ink-on-primary` `#1A1206` | (없음, 인라인 사용) | 🟡 신규 |
| `--pc-primary-tint` `rgba(255,176,32,.14)` | `--pc-primary-soft` 동일값 | 🟠 alias |
| `--pc-primary-hover` `#FFC04D` | `--pc-primary-strong` 동일값 | 🟠 alias |
| `--pc-primary-press` `#E89A0A` | (없음) | 🟡 신규 |
| `--pc-secondary-{hover,press,tint}` | (없음, primary만 변형) | 🟡 신규 |
| `--pc-accent-deep` `#F0C040` | (없음) | 🟡 신규 |
| `--pc-accent-tint` `rgba(255,224,102,.16)` | (없음) | 🟡 신규 |
| `--pc-success/warning/danger/info` + tint | (없음, 인라인 색) | 🟡 신규 |
| `--pc-rarity-{common,rare,epic,legendary}` + bg | (없음, 인라인 hex 사용) | 🟡 신규 |
| `--pc-team-{red,blue}` + tint | (없음, 인라인 색) | 🟡 신규 |
| `--pc-trend-{up,down,flat}` | (없음) | 🟡 신규 |
| `--pc-shadow-{sm,md,lg}` | 동일값 존재 | ✅ 일치 |
| `--pc-shadow-glow-{amber,orange,gold}` | (없음) | 🟡 신규 |
| `--pc-fs-{xs..4xl}` 폰트 스케일 | (없음, 인라인 px) | 🟡 신규 |
| `--pc-fw-{regular..black}` weight | (없음, 인라인 숫자) | 🟡 신규 |
| `--pc-space-{1..10}` 4px 스케일 | (없음, 인라인 px) | 🟡 신규 |
| `--pc-r-{sm,md,lg,xl,full}` | (없음, 인라인 px) | 🟡 신규 |
| `--pc-ease-{bounce,standard,decelerate,accelerate}` | (없음) | 🟡 신규 |
| `--pc-d-{micro,base,slow,celebration}` | (없음) | 🟡 신규 |
| `--pc-z-{nav,overlay,modal,toast}` | (없음, 인라인 z) | 🟡 신규 |
| `--pc-font-mono` (JetBrains Mono) | (없음, 폰트 미import) | 🟡 신규 |
| `--pc-font-display` | (없음) | 🟡 신규 |
| `.pc-{display,h1,h2,score,stat-num,...}` 유틸 | (없음) | 🟡 신규 |

**범례**: ✅ 일치 · 🟠 alias 정합화 · 🟡 신규 추가

---

## 컴포넌트 격차

| 영역 | 시안 | 코드 | 처리 |
|---|---|---|---|
| **Primary 버튼** | radius 14px, padding 12px 18px, `box-shadow: 0 2px 0 press`, transition `200ms ease-bounce` | `.pc-button` radius 10px, padding 8px 12px, transition 없음 | 🔧 **이번 PR**: transition 추가, radius 미세 조정 |
| **Rank 1/2/3** | 1위 골드 (`--pc-accent-deep`), 2위 회색, 3위 브론즈 (`#B45309`) | 1위만 accent 강조, 2/3 일반 | 🔧 **이번 PR**: 2/3위 색 토큰화 |
| **Rarity chip** | tint 배경 + color (legendary는 그라디언트 + 골드 글로우) | border + color만 | 🔧 **이번 PR**: tint 배경 추가, legendary 글로우 |
| **PlayerCard** | 등급별 그라디언트 풀카드 (common 회색 / epic 보라 / legend 골드) + LV chip + rarity chip | 정보 카드만 | ⏭️ **후속 PR**: 별도 PlayerCard 컴포넌트 신규 |
| **BottomNav** | 380px 카드형, 8px padding, radius 20px, active=tint 배경 | 풀폭 60px 높이, 카드 아님 | ⏭️ **후속 PR**: 모바일 카드형 검토 |
| **Score 숫자** | `--pc-font-display` italic 900 + tnum + `text-shadow` | 인라인 italic, 색 인라인 | 🔧 **이번 PR**: `.pc-score` 유틸 클래스 추가 (사용처 점진 적용) |
| **타이포 스케일** | `--pc-h1`/`pc-h2`/`pc-body` 등 시맨틱 클래스 | 인라인 `font-size`, `font-weight` | 🟡 **이번 PR**: 유틸 클래스 추가 (사용처 점진 적용) |

---

## 카피 톤 점검

`docs/design/README.md`의 카피 원칙:
- 사용자에 "~님" 정중 / 시스템은 명사형/반말
- 게임화 톤 ("EXP +120", "레벨업!")
- 빈 상태/에러는 가볍게 ("잠시 끊겼어요\n다시 시도해주세요")

| 페이지 | 현재 카피 | 권장 톤 | 처리 |
|---|---|---|---|
| `/` 비로그인 | "로그인이 필요해요\n로그인하면 가입한 클럽으로 이동해 능력치 카드와 성장 그래프를 볼 수 있습니다." | ✅ 톤 OK | 유지 |
| `/club-rooms/[id]` 비로그인 | "로그인하면 더 많은 정보가 보여요" | ✅ OK | 유지 |
| `/admin` 접근 불가 | "서비스 관리자 권한이 있는 사용자만 접근할 수 있습니다." | "관리자만 들어갈 수 있어요" 정도가 더 가벼움 | ⏭️ 후속 (큰 영향 없음) |
| 결과 페이지 만장일치 MVP | "👑 만장일치 MVP · LEGENDARY" + "모든 평가자가 같은 사람을 MVP로 뽑았습니다. 전설 등급 자동 부여." | ✅ 게임화 톤 OK | 유지 |
| `/offline` | "잠시 끊겼어요" | ✅ README 예시 그대로 | 유지 |
| 평가 화면 | "오늘 이 선수에 대해 한마디!" placeholder | ✅ 게임화 톤 | 유지 |

**판정**: 카피 톤은 전반적으로 README 원칙 잘 지켜짐. 후속 작업에서 페이지별 미세 조정 정도.

---

## 이번 PR에서 즉시 처리

1. ✅ globals.css에 시안 토큰 **신규 추가** (`--pc-rarity-*`, `--pc-success/warning/danger/info`, `--pc-fs-*`, `--pc-fw-*`, `--pc-space-*`, `--pc-r-*`, `--pc-ease-*`, `--pc-d-*`, `--pc-z-*`, `--pc-shadow-glow-*` 등)
2. ✅ 기존 토큰에 **시안 이름 alias 추가** (`--pc-border` ← `--pc-line`, `--pc-ink` ← `--pc-text`, `--pc-ink-secondary` ← `--pc-muted`, `--pc-primary-tint` ← `--pc-primary-soft`, `--pc-primary-hover` ← `--pc-primary-strong`)
3. ✅ JetBrains Mono import 추가 (`--pc-font-mono` 사용 가능하게)
4. ✅ Pretendard `font-feature-settings: "tnum"` 점수 표시용 유틸 클래스 추가
5. ✅ 시맨틱 typography 유틸 클래스(`.pc-h1`, `.pc-h2`, `.pc-score`, `.pc-stat-num`, `.pc-caption`, `.pc-mono`) 추가 — 다음 작업부터 점진 적용
6. ✅ podium 1/2/3위 색을 시안 토큰으로 매핑 (`--pc-accent-deep`, 회색, 브론즈)
7. ✅ rarity chip에 tint 배경 추가, legendary는 글로우
8. ✅ pc-button transition + ease-bounce 적용

## 후속 PR로 분리

- 등급별 그라디언트 PlayerCard 컴포넌트 신규 — 클럽 메인/도감/순위에 일관 적용
- 모바일 BottomNav 카드형 (380px width, 8px padding, 20px radius)
- 페이지별 카피 미세 조정 (현재도 80% 이상 일치)
- 인라인 hex/px → 토큰 사용으로 전면 마이그레이션 (페이지 단위 점진)
- Lighthouse 디자인 토큰 일관성 검사 자동화 (선택)
