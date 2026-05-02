# PlayCard UI Kit

PlayCard 모바일 웹앱 UI 키트. 4개 핵심 화면 + 재사용 컴포넌트.

## 파일
- `index.html` — 4개 화면 동시 렌더 (홈, 평가, 순위, 내 카드)
- `components.jsx` — Button, Card, Badge, Avatar, PlayerCard, BottomNav, RadarChart, LineChart 등
- `screens.jsx` — HomeScreen, EvaluateScreen, RankScreen, ProfileScreen
- `data.jsx` — 목 데이터 (선수, 칭호, 성장 그래프)

## 디자인 노트
- 모바일 기준 (375–430px). 데스크톱은 좌측 사이드바로 분기 (이번 키트엔 미포함).
- 모든 컬러/타입은 루트의 `colors_and_type.css` 토큰 사용.
- 아이콘은 Lucide stroke 1.75 인라인 SVG (production은 `lucide-react` 사용 권장).

## 컴포넌트 사용 예
```jsx
<PlayerCard player={{ name: "홍길동", level: 21, rarity: "legendary", title: "네트 위의 암살자", stats: { attack: 9.6, defense: 8.8, toss: 9.0, serve: 9.4 }}}/>
<RadarChart stats={{ attack: 8.4, defense: 7.9, toss: 9.2, serve: 8.0 }}/>
<TrendDelta delta={3}/>  {/* ▲ 3 (빨강) */}
```
