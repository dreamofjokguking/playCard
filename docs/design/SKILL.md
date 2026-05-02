---
name: playcard-design
description: Use this skill to generate well-branded interfaces and assets for PlayCard (족구 동호회 통합 운영 플랫폼), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- Tokens: `colors_and_type.css` — import this in any HTML output
- UI components: `ui_kits/playcard/components.jsx` — Button, Card, PlayerCard, RadarChart, etc
- Brand vibe: 게임 시스템 톤 (FIFA/NBA 카드 스타일), 따뜻한 페이퍼 + 활기찬 그라디언트
- Tone: 친근한 게임화 ("EXP +120", "레벨업!") — 진지/관료적 어투 금지
- Primary: `#FF5C39` 족구 오렌지 · Accent: `#F4B740` 골드 (MVP)
- Font: Pretendard Variable
- Icons: Lucide stroke 1.75
