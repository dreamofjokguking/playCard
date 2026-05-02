// PlayCard UI Kit — shared components
// Available globally on window after this loads.

const { useState, useEffect, useMemo } = React;

// ──────────── ICONS (Lucide-style stroke) ────────────
const Icon = ({ d, size = 20, fill = "none", strokeWidth = 1.75, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {typeof d === "string" ? <path d={d}/> : d}
  </svg>
);
const IconHome = (p) => <Icon {...p} d={<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z"/>}/>;
const IconStar = (p) => <Icon {...p} d={<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>}/>;
const IconTrophy = (p) => <Icon {...p} d={<g><path d="M6 9H4.5A2.5 2.5 0 0 1 2 6.5V5h4M18 9h1.5A2.5 2.5 0 0 0 22 6.5V5h-4M6 5h12v6a6 6 0 0 1-12 0zM9 17h6l1 4H8z"/></g>}/>;
const IconUsers = (p) => <Icon {...p} d={<g><circle cx="9" cy="7" r="4"/><circle cx="17" cy="9" r="3"/><path d="M3 21a6 6 0 0 1 12 0M14 21a5 5 0 0 1 7 0"/></g>}/>;
const IconCrown = (p) => <Icon {...p} d={<path d="M2 4l3 16h14l3-16-6 4-4-7-4 7z"/>}/>;
const IconSparkles = (p) => <Icon {...p} d={<path d="M12 3l1.5 4 4 1.5-4 1.5L12 14l-1.5-4-4-1.5 4-1.5zM19 14l.8 2 2 .8-2 .8L19 19.5l-.8-2-2-.8 2-.8zM5 16l.6 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5z"/>}/>;
const IconUp = (p) => <Icon {...p} d={<g><polyline points="3,17 9,11 13,15 21,7"/><polyline points="14,7 21,7 21,14"/></g>}/>;
const IconDown = (p) => <Icon {...p} d={<g><polyline points="3,7 9,13 13,9 21,17"/><polyline points="14,17 21,17 21,10"/></g>}/>;
const IconSettings = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>}/>;
const IconChevronRight = (p) => <Icon {...p} d={<polyline points="9,6 15,12 9,18"/>}/>;
const IconBell = (p) => <Icon {...p} d={<g><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></g>}/>;
const IconMusic = (p) => <Icon {...p} d={<g><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 18V5l12-2v13"/></g>}/>;
const IconMinusCircle = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/></g>}/>;
const IconPlus = (p) => <Icon {...p} d={<g><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></g>}/>;
const IconBack = (p) => <Icon {...p} d={<polyline points="15,6 9,12 15,18"/>}/>;
const IconCheck = (p) => <Icon {...p} d={<polyline points="20,6 9,17 4,12"/>}/>;

// ──────────── PRIMITIVES ────────────
const Badge = ({ children, tone = "neutral", style }) => {
  const tones = {
    neutral: { bg: "var(--pc-bg-deep)", fg: "var(--pc-ink-secondary)" },
    primary: { bg: "var(--pc-primary-tint)", fg: "var(--pc-primary)" },
    success: { bg: "var(--pc-success-tint)", fg: "var(--pc-success)" },
    warning: { bg: "var(--pc-warning-tint)", fg: "var(--pc-accent)" },
    danger: { bg: "var(--pc-danger-tint)", fg: "var(--pc-danger)" },
    info: { bg: "var(--pc-info-tint)", fg: "var(--pc-info)" },
    ink: { bg: "var(--pc-ink)", fg: "var(--pc-bg)" },
    gold: { bg: "linear-gradient(135deg,#FFE066,#FF8C42)", fg: "#2A1F00" },
  };
  const t = tones[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: t.bg, color: t.fg, letterSpacing: ".02em", ...style }}>{children}</span>;
};

const RarityChip = ({ rarity }) => {
  const map = {
    common: { label: "일반", bg: "var(--pc-rarity-common-bg)", fg: "var(--pc-rarity-common)" },
    rare: { label: "희귀", bg: "var(--pc-rarity-rare-bg)", fg: "var(--pc-rarity-rare)" },
    epic: { label: "영웅", bg: "var(--pc-rarity-epic-bg)", fg: "var(--pc-rarity-epic)" },
    legendary: { label: "전설", bg: "linear-gradient(135deg,#FFE066,#FF8C42)", fg: "#2A1F00" },
  };
  const r = map[rarity];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 9999, fontSize: 10, fontWeight: 800, background: r.bg, color: r.fg, letterSpacing: ".06em", textTransform: "uppercase", border: rarity !== "legendary" ? `1px solid ${r.fg}33` : "none" }}>{r.label}</span>;
};

const Button = ({ children, variant = "primary", size = "md", onClick, style, disabled, full }) => {
  const sizes = {
    sm: { padding: "8px 12px", fontSize: 12, borderRadius: 8 },
    md: { padding: "12px 18px", fontSize: 14, borderRadius: 10 },
    lg: { padding: "16px 22px", fontSize: 16, borderRadius: 12 },
  };
  const variants = {
    primary: { background: "var(--pc-primary)", color: "var(--pc-ink-on-primary)", boxShadow: "var(--pc-shadow-glow-amber)" },
    secondary: { background: "var(--pc-surface)", color: "var(--pc-primary)", border: "1px solid var(--pc-border-glow)" },
    ghost: { background: "transparent", color: "var(--pc-ink-secondary)", border: "1.5px solid var(--pc-border-strong)" },
    gold: { background: "linear-gradient(135deg,#FFE066,#FF8C42)", color: "#2A1F00", boxShadow: "var(--pc-shadow-glow-gold)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "var(--pc-font-sans)", fontWeight: 700, border: "none", cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: "-0.01em",
      transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)", width: full ? "100%" : "auto",
      opacity: disabled ? 0.4 : 1,
      ...sizes[size], ...variants[variant], ...style,
    }}>{children}</button>
  );
};

const Card = ({ children, style, padding = 16, onClick }) => (
  <div onClick={onClick} style={{
    background: "var(--pc-surface)", borderRadius: 14, border: "1px solid var(--pc-border)",
    boxShadow: "var(--pc-shadow-md)", padding, cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

// Avatar
const Avatar = ({ name, size = 36, color, ring }) => {
  const ch = name?.[0] || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "var(--pc-bg-deep)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.42, color: color ? "#fff" : "var(--pc-ink-secondary)",
      boxShadow: ring ? `0 0 0 2px ${ring}, 0 0 0 4px var(--pc-surface)` : "none",
      flexShrink: 0,
    }}>{ch}</div>
  );
};

// Trend arrow
const TrendDelta = ({ delta }) => {
  if (delta > 0) return <span style={{ color: "var(--pc-trend-up)", fontWeight: 800, fontSize: 12, fontFamily: "var(--pc-font-mono)" }}>▲ {delta}</span>;
  if (delta < 0) return <span style={{ color: "var(--pc-trend-down)", fontWeight: 800, fontSize: 12, fontFamily: "var(--pc-font-mono)" }}>▼ {Math.abs(delta)}</span>;
  return <span style={{ color: "var(--pc-trend-flat)", fontWeight: 800, fontSize: 12, fontFamily: "var(--pc-font-mono)" }}>－</span>;
};

// Player card (small)
const PlayerCard = ({ player, compact = false }) => {
  const grad = {
    common: "linear-gradient(160deg,#3A4358 0%,#1A1F2E 100%)",
    rare: "linear-gradient(160deg,#1E3A8A 0%,#0F1730 100%)",
    epic: "linear-gradient(160deg,#5B21B6 0%,#1E1438 100%)",
    legendary: "linear-gradient(160deg,#FFE066 0%,#FF8C42 60%,#C73E20 100%)",
  };
  const glow = player.rarity === "legendary" ? "var(--pc-shadow-glow-gold)" : "var(--pc-shadow-md)";
  const ring = player.rarity === "legendary" ? "rgba(255,255,255,.55)" : "rgba(255,176,32,.4)";
  const fg = player.rarity === "legendary" ? "#2A1F00" : "#fff";
  return (
    <div style={{
      borderRadius: 16, padding: compact ? 12 : 16, color: fg, background: grad[player.rarity],
      boxShadow: glow, display: "flex", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden",
      border: `1px solid ${ring}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "var(--pc-font-mono)", fontWeight: 700, fontSize: 11, background: "rgba(0,0,0,.30)", padding: "3px 8px", borderRadius: 6 }}>LV.{String(player.level).padStart(2, "0")}</span>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", background: "rgba(255,255,255,.22)", padding: "3px 8px", borderRadius: 6 }}>
          {player.rarity === "legendary" ? "★ LEGEND" : player.rarity.toUpperCase()}
        </span>
      </div>
      <div style={{
        width: compact ? 48 : 60, height: compact ? 48 : 60, borderRadius: "50%",
        background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 18 : 22, fontWeight: 900, fontStyle: "italic", fontFamily: "var(--pc-font-display)",
        alignSelf: "center",
      }}>{player.name[0]}</div>
      <div style={{ fontWeight: 800, fontSize: compact ? 15 : 17, textAlign: "center", letterSpacing: "-0.01em" }}>{player.name}</div>
      <div style={{ fontSize: 11, textAlign: "center", background: "rgba(0,0,0,.30)", color: "#FFF8EC", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
        「{player.title}」
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px 12px", fontSize: 11, fontFamily: "var(--pc-font-mono)", fontWeight: 700, marginTop: 2 }}>
        <Stat label="공격" v={player.stats.AT}/>
        <Stat label="세터" v={player.stats.SE}/>
        <Stat label="수비" v={player.stats.DF}/>
      </div>
    </div>
  );
};
const Stat = ({ label, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span style={{ opacity: .85 }}>{label}</span>
    <span style={{ fontStyle: "italic", fontSize: 13 }}>{v.toFixed(1)}</span>
  </div>
);

// Status banner (in-progress evaluation)
const EvaluationBanner = ({ onClick }) => (
  <div onClick={onClick} style={{
    background: "linear-gradient(135deg,var(--pc-primary),var(--pc-secondary))",
    borderRadius: 12, padding: "14px 16px", color: "var(--pc-ink-on-primary)", display: "flex", alignItems: "center", gap: 12,
    cursor: "pointer", boxShadow: "var(--pc-shadow-glow-amber)", position: "relative", overflow: "hidden",
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 8, background: "rgba(0,0,0,.20)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}><IconStar size={22}/></div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, opacity: .9, letterSpacing: ".04em" }}>평가 진행중 · 마감 23:59</div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 1 }}>5/7명 완료 · 평가 시작하기</div>
    </div>
    <IconChevronRight/>
  </div>
);

// Bottom Nav
const BottomNav = ({ active, onChange }) => {
  const items = [
    { id: "home", label: "홈", Ic: IconHome },
    { id: "evaluate", label: "평가", Ic: IconStar },
    { id: "rank", label: "순위", Ic: IconTrophy },
    { id: "team", label: "팀구성", Ic: IconUsers },
    { id: "admin", label: "관리", Ic: IconSettings },
  ];
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      background: "var(--pc-surface)", borderTop: "1px solid var(--pc-border)",
      padding: "6px 4px 10px", display: "flex", justifyContent: "space-around",
    }}>
      {items.map(({ id, label, Ic }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            border: "none", background: isActive ? "var(--pc-primary-tint)" : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "8px 12px", borderRadius: 12, cursor: "pointer",
            color: isActive ? "var(--pc-primary)" : "var(--pc-ink-tertiary)",
            fontSize: 10, fontWeight: 600, minWidth: 56, transition: "all 180ms",
          }}><Ic size={22}/>{label}</button>
        );
      })}
    </div>
  );
};

// Header
const Header = ({ title, subtitle, onBack, right }) => (
  <div style={{
    padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10,
    background: "var(--pc-bg)", borderBottom: "1px solid var(--pc-border)",
  }}>
    {onBack && (
      <button onClick={onBack} style={{ border: "none", background: "transparent", padding: 4, cursor: "pointer", color: "var(--pc-ink)" }}>
        <IconBack size={22}/>
      </button>
    )}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--pc-ink)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--pc-ink-tertiary)", fontWeight: 600, marginTop: 1 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

// Radar Chart (RPG stat radar)
const RadarChart = ({ stats, size = 200 }) => {
  const center = size / 2;
  const r = size / 2 - 32;
  const labels = [
    { key: "AT", label: "공격", angle: -90 },
    { key: "SE", label: "세터", angle: 30 },
    { key: "DF", label: "수비", angle: 150 },
  ];
  const pt = (a, d) => {
    const rad = (a * Math.PI) / 180;
    return [center + Math.cos(rad) * r * d, center + Math.sin(rad) * r * d];
  };
  const dataPoly = labels.map(l => pt(l.angle, stats[l.key] / 10)).map(p => p.join(",")).join(" ");
  const best = labels.reduce((a, b) => stats[a.key] > stats[b.key] ? a : b);
  const worst = labels.reduce((a, b) => stats[a.key] < stats[b.key] ? a : b);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={labels.map(l => pt(l.angle, s)).map(p => p.join(",")).join(" ")}
          fill="none" stroke="var(--pc-border)" strokeWidth={s === 1 ? 1.5 : 1}/>
      ))}
      {labels.map(l => {
        const [x, y] = pt(l.angle, 1);
        return <line key={l.key} x1={center} y1={center} x2={x} y2={y} stroke="var(--pc-border)" strokeWidth="1"/>;
      })}
      <polygon points={dataPoly} fill="rgba(255,176,32,.22)" stroke="var(--pc-primary)" strokeWidth="2.5" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(255,176,32,.6))" }}/>
      {labels.map(l => {
        const [x, y] = pt(l.angle, stats[l.key] / 10);
        const isBest = l.key === best.key;
        const isWorst = l.key === worst.key;
        return (
          <circle key={l.key} cx={x} cy={y} r="4.5"
            fill={isBest ? "var(--pc-accent)" : isWorst ? "var(--pc-info)" : "var(--pc-primary)"}
            stroke="var(--pc-bg)" strokeWidth="2"/>
        );
      })}
      {labels.map(l => {
        const [x, y] = pt(l.angle, 1.25);
        const isBest = l.key === best.key;
        const isWorst = l.key === worst.key;
        return (
          <g key={l.key}>
            <text x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--pc-ink)">{l.label}</text>
            <text x={x} y={y + 12} textAnchor="middle" fontSize="11" fontWeight="800" fill={isBest ? "var(--pc-accent)" : isWorst ? "var(--pc-info)" : "var(--pc-ink-secondary)"} fontFamily="var(--pc-font-mono)">{stats[l.key].toFixed(1)}</text>
            {isBest && <text x={x + 18} y={y - 2} fontSize="11" fill="var(--pc-accent)">★</text>}
          </g>
        );
      })}
    </svg>
  );
};

// Line chart (성장 그래프)
const LineChart = ({ data, w = 320, h = 120 }) => {
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const dx = w / (data.length - 1);
  const ny = v => h - ((v - min) / (max - min)) * (h - 16) - 8;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * dx} ${ny(v)}`).join(" ");
  const fill = `${path} L ${(data.length - 1) * dx} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }}>
      <defs>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--pc-primary)" stopOpacity="0.25"/>
          <stop offset="1" stopColor="var(--pc-primary)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#lc)"/>
      <path d={path} fill="none" stroke="var(--pc-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px rgba(255,176,32,.55))" }}/>
      {data.map((v, i) => (
        <circle key={i} cx={i * dx} cy={ny(v)} r="3.5" fill="var(--pc-bg)" stroke="var(--pc-primary)" strokeWidth="2"/>
      ))}
    </svg>
  );
};

Object.assign(window, {
  IconHome, IconStar, IconTrophy, IconUsers, IconCrown, IconSparkles,
  IconUp, IconDown, IconSettings, IconChevronRight, IconBell, IconMusic,
  IconMinusCircle, IconPlus, IconBack, IconCheck,
  Badge, RarityChip, Button, Card, Avatar, TrendDelta, PlayerCard,
  EvaluationBanner, BottomNav, Header, RadarChart, LineChart,
});
