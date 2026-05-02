// Visual variation themes for PlayCard — Neon series v2
const THEMES = {
  b1: {
    name: "B1 · Solar Amber",
    desc: "딥 네이비 + 앰버/오렌지 네온 — 일몰 코트, 따뜻한 다크 게이밍",
    bg: "#0E1018",
    bgDeep: "#161A26",
    surface: "#1C2030",
    surfaceElev: "#262B40",
    border: "#2F3550",
    borderGlow: "rgba(255,176,32,.35)",
    ink: "#FFF8EC",
    inkSecondary: "#C9BBA0",     // 가시성 위해 채도 살린 웜 그레이
    inkTertiary: "#8A7E66",
    primary: "#FFB020",           // 앰버 네온
    primarySoft: "#FFD37A",
    primaryTint: "rgba(255,176,32,.14)",
    accent: "#FF5A36",            // 오렌지 액센트
    accentDeep: "#E0431F",
    legendary: "#FFE066",
    cardBg: "linear-gradient(160deg,#262B40 0%,#0E1018 100%)",
    legendBg: "linear-gradient(160deg,#FFE066 0%,#FF5A36 100%)",
    bannerBg: "linear-gradient(135deg,#FFB020,#FF5A36)",
    expBar: "linear-gradient(90deg,#FFB020,#FF5A36)",
    shadow: "0 6px 24px rgba(255,176,32,.18), 0 0 0 1px rgba(255,176,32,.12)",
    radius: 10,
    fontDisplay: "var(--pc-font-display)",
    italic: true,
    glowStrong: true,
    scanline: false,
    chip: "ANGULAR",
  },
  b2: {
    name: "B2 · Toxic Green",
    desc: "딥 미드나잇 + 네온 그린 — 매트릭스/사이버펑크. 가시성 개선판",
    bg: "#080C0A",
    bgDeep: "#0E1612",
    surface: "#13201A",            // 약간 더 밝게 (10→13)
    surfaceElev: "#1B2D24",
    border: "#274236",             // 보더 명도↑
    borderGlow: "rgba(80,255,140,.45)",
    ink: "#F4FFF7",                // 거의 화이트로 (E8FFE9 → F4FFF7)
    inkSecondary: "#B8D9C2",       // 7FA38A → B8D9C2 (대비 ↑↑)
    inkTertiary: "#7A9B85",        // 4A6754 → 7A9B85
    primary: "#50FF8C",            // 39FF7A → 살짝 부드럽고 더 노란기 (가독성↑)
    primarySoft: "#B8FFCD",
    primaryTint: "rgba(80,255,140,.14)",
    accent: "#00E5C7",             // 민트 액센트
    accentDeep: "#00B89F",
    legendary: "#FFE94A",
    cardBg: "linear-gradient(160deg,#1B2D24 0%,#080C0A 100%)",
    legendBg: "linear-gradient(160deg,#FFE94A 0%,#50FF8C 100%)",
    bannerBg: "linear-gradient(135deg,#50FF8C 0%,#00E5C7 100%)",
    expBar: "linear-gradient(90deg,#00E5C7,#50FF8C)",
    shadow: "0 6px 24px rgba(80,255,140,.20), 0 0 0 1px rgba(80,255,140,.14)",
    radius: 8,
    fontDisplay: "var(--pc-font-mono)",
    italic: false,
    glowStrong: true,
    scanline: true,
    chip: "ROUNDED",
  },
  b3: {
    name: "B3 · Bright Neon (Light)",
    desc: "화이트 베이스 + 네온 그린/마젠타 액센트 — 밝고 산뜻한 네온, 스포티 톤",
    bg: "#F4F6F2",
    bgDeep: "#E8ECE3",
    surface: "#FFFFFF",
    surfaceElev: "#FAFCF6",
    border: "#DCE2D2",
    borderGlow: "rgba(20,200,90,.35)",
    ink: "#0F1A12",
    inkSecondary: "#4F5C52",
    inkTertiary: "#8A9489",
    primary: "#14C85A",            // 진한 네온 그린 (밝은 배경에서도 컨트라스트 확보)
    primarySoft: "#5BE89A",
    primaryTint: "rgba(20,200,90,.12)",
    accent: "#FF1F8F",             // 비비드 마젠타 액센트
    accentDeep: "#D9007A",
    legendary: "#F59E0B",
    cardBg: "linear-gradient(160deg,#0F1A12 0%,#1F3A28 100%)",  // 카드는 다크 (포인트)
    legendBg: "linear-gradient(160deg,#FBBF24 0%,#FF1F8F 100%)",
    bannerBg: "linear-gradient(135deg,#14C85A 0%,#0F1A12 120%)",
    expBar: "linear-gradient(90deg,#14C85A,#FF1F8F)",
    shadow: "0 4px 14px -2px rgba(15,26,18,.10), 0 1px 2px rgba(15,26,18,.04)",
    radius: 14,
    fontDisplay: "var(--pc-font-display)",
    italic: false,
    glowStrong: false,
    scanline: false,
    chip: "PILL",
    lightTheme: true,
  },
};
window.THEMES = THEMES;

// ─── Themed Home Screen ───
const ThemedHome = ({ t }) => {
  const me = { name: "김민지", level: 12, rarity: "epic", title: "코트의 지휘자", avg: 8.7 };
  const chipRadius = t.chip === "PILL" ? 9999 : t.chip === "ANGULAR" ? 2 : 6;
  return (
    <div style={{
      background: t.bg, color: t.ink, padding: "16px 16px 80px",
      display: "flex", flexDirection: "column", gap: 14, minHeight: 760,
      backgroundImage: t.scanline
        ? "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(57,255,122,.025) 3px, rgba(57,255,122,.025) 4px)"
        : "none",
    }}>
      {/* greeting */}
      <div>
        <div style={{ fontSize: 12, color: t.inkTertiary, fontWeight: 600 }}>오늘도 한 판?</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2,
          textShadow: t.glowStrong ? `0 0 18px ${t.primary}66` : "none" }}>{me.name}님 👋</div>
      </div>

      {/* eval banner */}
      <div style={{
        background: t.bannerBg, borderRadius: t.radius, padding: "14px 16px",
        color: "#fff",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: t.glowStrong ? `0 0 24px ${t.primary}55` : t.shadow,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: t.radius - 4,
          background: "rgba(255,255,255,.22)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>★</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .9, letterSpacing: ".04em" }}>평가 진행중 · 마감 23:59</div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 1 }}>5/7명 완료 · 평가 시작하기 →</div>
        </div>
      </div>

      {/* my card summary */}
      <div style={{
        background: t.surface, borderRadius: t.radius, border: `1px solid ${t.border}`,
        boxShadow: t.shadow, padding: 14, display: "flex", gap: 14, alignItems: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: t.radius, background: t.cardBg,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          fontWeight: 900, fontStyle: t.italic ? "italic" : "normal", fontSize: 22,
          fontFamily: t.fontDisplay,
          boxShadow: t.glowStrong ? `0 0 20px ${t.accent}66` : "none",
          border: `1px solid ${t.borderGlow}`,
        }}>{me.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{
              padding: "3px 9px", borderRadius: chipRadius, fontSize: 10, fontWeight: 800,
              background: `${t.accent}22`, color: t.accent,
              letterSpacing: ".08em", textTransform: "uppercase",
              border: `1px solid ${t.accent}44`,
            }}>EPIC · 영웅</span>
            <span style={{ fontSize: 11, fontFamily: "var(--pc-font-mono)", fontWeight: 700, color: t.inkTertiary }}>LV.{me.level}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{me.name}</div>
          <div style={{ fontSize: 12, color: t.inkSecondary, fontWeight: 600 }}>「{me.title}」</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 28, color: t.primary, fontWeight: 900,
            fontStyle: t.italic ? "italic" : "normal",
            fontFamily: t.fontDisplay, letterSpacing: t.italic ? "-0.04em" : "0",
            textShadow: t.glowStrong ? `0 0 14px ${t.primary}` : "none",
          }}>{me.avg.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: t.inkTertiary, fontWeight: 700, letterSpacing: ".06em" }}>AVG</div>
        </div>
      </div>

      {/* EXP */}
      <div style={{ background: t.surface, borderRadius: t.radius, border: `1px solid ${t.border}`, boxShadow: t.shadow, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.inkSecondary }}>다음 레벨까지</span>
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--pc-font-mono)", color: t.primary }}>+820 / 1000 EXP</span>
        </div>
        <div style={{ height: 10, background: t.bgDeep, borderRadius: 9999, overflow: "hidden" }}>
          <div style={{
            width: "82%", height: "100%", background: t.expBar, borderRadius: 9999,
            boxShadow: t.glowStrong ? `0 0 12px ${t.primary}` : "none",
          }}/>
        </div>
      </div>

      {/* recent matches */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 4px 8px" }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>최근 경기</span>
          <span style={{ fontSize: 11, color: t.primary, fontWeight: 700 }}>전체보기 ›</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { date: "10/28", venue: "한강체육공원", score: 8.7, mvp: false, delta: 0.6 },
            { date: "10/21", venue: "잠실종합", score: 8.1, mvp: true, delta: 0.7 },
            { date: "10/14", venue: "한강체육공원", score: 7.4, mvp: false, delta: -0.6 },
          ].map((m, i) => (
            <div key={i} style={{
              background: t.surface, borderRadius: t.radius, border: `1px solid ${t.border}`,
              boxShadow: t.shadow, padding: 12, display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: t.radius - 4, background: t.bgDeep,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontSize: 9, color: t.inkTertiary, fontWeight: 700 }}>{m.date.split("/")[0]}월</div>
                <div style={{
                  fontSize: 14, fontWeight: 900, fontFamily: t.fontDisplay,
                  fontStyle: t.italic ? "italic" : "normal", color: t.ink,
                }}>{m.date.split("/")[1]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.venue}</div>
                <div style={{ fontSize: 11, color: t.inkTertiary, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                  {m.mvp && (
                    <span style={{
                      padding: "2px 7px", borderRadius: chipRadius, fontSize: 10, fontWeight: 800,
                      background: `${t.legendary}22`, color: t.legendary,
                      border: `1px solid ${t.legendary}55`,
                      boxShadow: `0 0 10px ${t.legendary}55`,
                    }}>★ MVP</span>
                  )}
                  <span>경기 종료</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 18, fontWeight: 900, color: t.ink,
                  fontStyle: t.italic ? "italic" : "normal", fontFamily: t.fontDisplay,
                  letterSpacing: t.italic ? "-0.04em" : "0",
                }}>{m.score.toFixed(1)}</div>
                <div style={{
                  fontSize: 10, fontWeight: 800, fontFamily: "var(--pc-font-mono)",
                  color: m.delta > 0 ? "#DC2626" : "#2563EB",
                }}>{m.delta > 0 ? "▲" : "▼"} {Math.abs(m.delta).toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
window.ThemedHome = ThemedHome;
