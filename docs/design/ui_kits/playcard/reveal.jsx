/* ───────────────────────────────────────────────
   PlayCard · 칭호 부여 (Title Reveal) Reveal.jsx
   단계: idle → shake → tear → flip → reveal → text
   ─────────────────────────────────────────────── */

const RARITY_TOKENS = {
  common: {
    label: "COMMON",
    grade: "C",
    name: "성실한 신예",
    title: "꾸준한 출석러",
    quote: "출석률 100% — 모두가 인정하는 동호회 기둥.",
    cardBg: "linear-gradient(160deg,#3A4358 0%,#1A1F2E 100%)",
    cardFg: "#FFF8EC",
    glowColor: "rgba(148,163,184,.5)",
    rayColor: "rgba(148,163,184,.4)",
    accent: "#94A3B8",
    burst: false,
  },
  rare: {
    label: "RARE",
    grade: "R",
    name: "각성의 조짐",
    title: "리시브의 벽",
    quote: "팀의 1수비라인을 굳건히 — 안정감의 대명사.",
    cardBg: "linear-gradient(160deg,#1E3A8A 0%,#0F1730 100%)",
    cardFg: "#FFF8EC",
    glowColor: "rgba(96,165,250,.6)",
    rayColor: "rgba(96,165,250,.5)",
    accent: "#60A5FA",
    burst: false,
  },
  epic: {
    label: "EPIC",
    grade: "SR",
    name: "필드의 마에스트로",
    title: "코트의 지휘자",
    quote: "팀 전술의 두뇌 — 모든 공이 그를 거쳐간다.",
    cardBg: "linear-gradient(160deg,#5B21B6 0%,#1E1438 100%)",
    cardFg: "#FFF8EC",
    glowColor: "rgba(192,132,252,.7)",
    rayColor: "rgba(192,132,252,.55)",
    accent: "#C084FC",
    burst: true,
  },
  legendary: {
    label: "LEGENDARY",
    grade: "SSR",
    name: "전설의 스파이커",
    title: "네트 위의 암살자",
    quote: "이번 시즌 최다 득점 · 결정률 1위. 코트의 지배자.",
    cardBg: "linear-gradient(160deg,#FFE066 0%,#FF8C42 60%,#C73E20 100%)",
    cardFg: "#1A1206",
    glowColor: "rgba(255,224,102,.85)",
    rayColor: "rgba(255,224,102,.7)",
    accent: "#FFE066",
    burst: true,
  },
};

const Confetti = ({ tokens, count = 32 }) => {
  const pieces = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 1.6 + Math.random() * 1.2,
    size: 6 + Math.random() * 6,
    color: [tokens.accent, "#FFE066", "#FF8C42", "#FFB020"][i % 4],
    rot: Math.random() * 360,
    shape: i % 3,
  })), [count, tokens.accent]);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 30 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.left}%`, top: -20, width: p.size, height: p.size * (p.shape === 0 ? 1 : p.shape === 1 ? 1.6 : 0.6),
          background: p.color, borderRadius: p.shape === 2 ? "50%" : 2,
          transform: `rotate(${p.rot}deg)`,
          animation: `confetti-fall ${p.dur}s cubic-bezier(.4,0,.6,1) ${p.delay}s forwards`,
          boxShadow: `0 0 8px ${p.color}`,
        }}/>
      ))}
    </div>
  );
};

const Sparkles = ({ tokens }) => {
  const pcs = React.useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    angle: (i / 14) * Math.PI * 2,
    radius: 100 + (i % 3) * 30,
    delay: 0.05 * i,
    size: 4 + (i % 4) * 2,
  })), []);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, zIndex: 12, pointerEvents: "none" }}>
      {pcs.map((p, i) => {
        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: p.size, height: p.size, borderRadius: "50%",
            background: tokens.accent,
            boxShadow: `0 0 12px ${tokens.accent}, 0 0 24px ${tokens.accent}`,
            animation: `flash-burst 1.6s ease-out ${p.delay}s infinite`,
          }}/>
        );
      })}
    </div>
  );
};

const Rays = ({ tokens, intense }) => (
  <div style={{
    position: "absolute", left: "50%", top: "50%",
    width: 800, height: 800, zIndex: 5, pointerEvents: "none",
    background: `conic-gradient(from 0deg, transparent 0deg, ${tokens.rayColor} 8deg, transparent 16deg, transparent 30deg, ${tokens.rayColor} 38deg, transparent 46deg, transparent 60deg, ${tokens.rayColor} 68deg, transparent 76deg, transparent 90deg, ${tokens.rayColor} 98deg, transparent 106deg, transparent 120deg, ${tokens.rayColor} 128deg, transparent 136deg, transparent 150deg, ${tokens.rayColor} 158deg, transparent 166deg, transparent 180deg, ${tokens.rayColor} 188deg, transparent 196deg, transparent 210deg, ${tokens.rayColor} 218deg, transparent 226deg, transparent 240deg, ${tokens.rayColor} 248deg, transparent 256deg, transparent 270deg, ${tokens.rayColor} 278deg, transparent 286deg, transparent 300deg, ${tokens.rayColor} 308deg, transparent 316deg, transparent 330deg, ${tokens.rayColor} 338deg, transparent 346deg, transparent 360deg)`,
    transform: "translate(-50%, -50%)",
    animation: `ray-spin ${intense ? 8 : 14}s linear infinite`,
    opacity: intense ? 0.65 : 0.35,
    maskImage: "radial-gradient(circle, black 20%, transparent 70%)",
  }}/>
);

const FlashBurst = ({ tokens }) => (
  <div style={{
    position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
    background: `radial-gradient(circle at 50% 50%, ${tokens.glowColor} 0%, transparent 60%)`,
    animation: "flash-burst 0.8s ease-out forwards",
  }}/>
);

// Mystery (pre-reveal) tone — same for ALL rarities so user can't guess
const MYSTERY = {
  accent: "#5A5550",
  glow: "rgba(120,110,100,.35)",
  fg: "#9C8E80",
};

const Package = ({ tokens, phase }) => {
  const isTearing = phase === "tear";
  const isCharging = phase === "charge";
  const isIdle = phase === "idle-pkg"; // static, mystery only
  // Mystery tone for idle-pkg + shake; charge cross-fades into rarity color; tear keeps rarity color
  const showRarityColor = isCharging || isTearing;
  const accent = showRarityColor ? tokens.accent : MYSTERY.accent;
  const glow = showRarityColor ? tokens.glowColor : MYSTERY.glow;
  const fg = showRarityColor ? tokens.cardFg : MYSTERY.fg;
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: 180, height: 250, zIndex: 8,
      marginLeft: -90, marginTop: -125,
      animation: isCharging ? "pkg-charge 0.5s ease-out forwards" : "none",
    }}>
      <div style={{
        position: "relative", width: "100%", height: "100%",
        animation: isTearing || isCharging || isIdle ? "none" : "shake-pkg 0.4s ease-in-out infinite",
        transition: "filter 0.4s ease-out",
        filter: showRarityColor ? `drop-shadow(0 0 24px ${glow})` : "none",
      }}>
      {/* TOP HALF */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: "50%",
        background: `linear-gradient(180deg, ${accent} 0%, #1A1410 100%)`,
        borderRadius: "12px 12px 0 0",
        clipPath: "polygon(0 0, 100% 0, 100% 96%, 92% 100%, 75% 95%, 60% 100%, 45% 92%, 28% 100%, 12% 95%, 0 100%)",
        animation: isTearing ? "tear-top 0.5s cubic-bezier(.5,0,.75,0) forwards" : "none",
        boxShadow: showRarityColor
          ? `inset 0 -12px 24px rgba(0,0,0,.5), 0 0 32px ${glow}`
          : `inset 0 -12px 24px rgba(0,0,0,.6)`,
        display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 16,
        transition: "background 0.4s ease-out, box-shadow 0.4s ease-out",
      }}>
        <div style={{ fontSize: 28, fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontWeight: 900, color: fg, opacity: 0.95, letterSpacing: "-0.04em", transition: "color 0.4s" }}>
          PLAY<span style={{ color: accent, transition: "color 0.4s" }}>·</span>CARD
        </div>
      </div>
      {/* BOTTOM HALF */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: "50%",
        background: `linear-gradient(0deg, ${accent} 0%, #1A1410 100%)`,
        borderRadius: "0 0 12px 12px",
        clipPath: "polygon(0 0, 12% 5%, 28% 0, 45% 8%, 60% 0, 75% 5%, 92% 0, 100% 4%, 100% 100%, 0 100%)",
        animation: isTearing ? "tear-bottom 0.5s cubic-bezier(.5,0,.75,0) forwards" : "none",
        boxShadow: showRarityColor
          ? `inset 0 12px 24px rgba(0,0,0,.5), 0 0 32px ${glow}`
          : `inset 0 12px 24px rgba(0,0,0,.6)`,
        display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 14,
        transition: "background 0.4s ease-out, box-shadow 0.4s ease-out",
      }}>
        <div style={{ fontFamily: "var(--pc-font-mono)", fontSize: 9, fontWeight: 700, color: fg, opacity: 0.7, letterSpacing: ".15em", transition: "color 0.4s" }}>
          SEASON 7 · TITLE PACK
        </div>
      </div>
      {/* mystery question mark — only in idle-pkg/shake */}
      {!showRarityColor && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)",
          textAlign: "center",
          fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontWeight: 900,
          fontSize: 64, color: MYSTERY.fg, opacity: 0.5, lineHeight: 1,
          textShadow: "0 2px 8px rgba(0,0,0,.6)",
          pointerEvents: "none",
        }}>?</div>
      )}
      {/* tear seam glow */}
      {isTearing && (
        <div style={{
          position: "absolute", left: -40, right: -40, top: "50%", height: 4,
          background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`,
          filter: `blur(4px)`, transform: "translateY(-50%)",
          boxShadow: `0 0 40px ${tokens.glowColor}`,
        }}/>
      )}
      </div>
    </div>
  );
};

const Card = ({ tokens, phase }) => {
  const showFront = phase === "reveal" || phase === "text";
  const showBack = phase === "flipping";
  const visible = phase === "flipping" || phase === "reveal" || phase === "text";
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: 220, height: 320, zIndex: 10,
      marginLeft: -110, marginTop: -160,
      opacity: visible ? 1 : 0,
      pointerEvents: "none",
    }}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        animation: phase === "flipping" ? "scale-pop 0.5s cubic-bezier(.34,1.56,.64,1) forwards" : "none",
      }}>
        {/* BACK (shows briefly during flip) */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: `repeating-linear-gradient(45deg, #1A1410, #1A1410 8px, #2A1F00 8px, #2A1F00 16px)`,
          border: `2px solid ${tokens.accent}`,
          boxShadow: `0 0 40px ${tokens.glowColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: showBack ? 1 : 0,
          transition: "opacity .3s ease-out",
        }}>
          <div style={{ fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontWeight: 900, fontSize: 56, color: tokens.accent, opacity: 0.6 }}>P</div>
        </div>
        {/* FRONT */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: tokens.cardBg,
          border: `2px solid ${tokens.accent}`,
          boxShadow: `0 0 40px ${tokens.glowColor}, 0 16px 32px -8px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.2)`,
          padding: 18, display: "flex", flexDirection: "column", color: tokens.cardFg,
          overflow: "hidden",
          opacity: showFront ? 1 : 0,
          transform: showFront ? "scale(1)" : "scale(0.7) rotateY(60deg)",
          transition: "opacity .35s ease-out, transform .5s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(120deg, transparent 30%, rgba(255,255,255,.18) 50%, transparent 70%)`,
            mixBlendMode: "overlay",
          }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <span style={{ fontFamily: "var(--pc-font-mono)", fontSize: 10, fontWeight: 800, letterSpacing: ".12em", background: "rgba(0,0,0,.30)", padding: "3px 8px", borderRadius: 6 }}>{tokens.label}</span>
            <span style={{
              fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 900,
              color: tokens.accent, lineHeight: 1, textShadow: `0 0 12px ${tokens.glowColor}`,
            }}>{tokens.grade}</span>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "12px 0", position: "relative" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,.4), ${tokens.accent} 60%, ${tokens.accent} 100%)`,
              border: `3px solid rgba(255,255,255,.4)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontWeight: 900, fontSize: 48,
              color: tokens.cardFg,
              boxShadow: `0 0 28px ${tokens.glowColor}, inset 0 -8px 20px rgba(0,0,0,.3)`,
            }}>★</div>
          </div>
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: ".08em", marginBottom: 4 }}>{tokens.name}</div>
            <div style={{ fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>「{tokens.title}」</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TitleText = ({ tokens, phase }) => {
  const [typed, setTyped] = React.useState("");
  const fullText = `「${tokens.title}」`;
  React.useEffect(() => {
    if (phase !== "text") { setTyped(""); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, [phase, fullText]);

  if (phase !== "text") return null;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 80, zIndex: 25, padding: "0 32px",
      textAlign: "center", animation: "float-up 0.5s ease-out both",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: tokens.accent, letterSpacing: ".15em", marginBottom: 8, textShadow: `0 0 12px ${tokens.glowColor}` }}>
        {tokens.label} 칭호 획득
      </div>
      <div style={{
        fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontWeight: 900,
        fontSize: 24, color: "#FFF8EC", letterSpacing: "-0.02em", lineHeight: 1.2,
        textShadow: `0 0 20px ${tokens.glowColor}, 0 2px 8px rgba(0,0,0,.5)`,
      }}>
        {typed}<span style={{ animation: "typing-cursor 1s infinite", color: tokens.accent }}>▎</span>
      </div>
      <div style={{ fontSize: 12, color: "#C9BBA0", marginTop: 12, fontWeight: 600, lineHeight: 1.5 }}>
        {tokens.quote}
      </div>
    </div>
  );
};

const ConfirmButton = ({ tokens, phase, onReplay }) => {
  if (phase !== "text") return null;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 24, zIndex: 30,
      display: "flex", justifyContent: "center", gap: 10, padding: "0 32px",
      animation: "float-up 0.6s ease-out 0.4s both",
    }}>
      <button onClick={onReplay} style={{
        padding: "10px 16px", borderRadius: 9999, border: "1px solid var(--pc-border-strong)",
        background: "var(--pc-surface)", color: "var(--pc-ink-secondary)", fontWeight: 700, fontSize: 12, cursor: "pointer",
        fontFamily: "var(--pc-font-sans)",
      }}>다시 보기</button>
      <button style={{
        padding: "10px 22px", borderRadius: 9999, border: "none",
        background: "var(--pc-primary)", color: "var(--pc-ink-on-primary)", fontWeight: 800, fontSize: 13, cursor: "pointer",
        fontFamily: "var(--pc-font-sans)",
        boxShadow: "var(--pc-shadow-glow-amber)",
      }}>도감에 추가</button>
    </div>
  );
};

const RevealScreen = ({ rarity, autoplay, onReplay }) => {
  const tokens = RARITY_TOKENS[rarity];
  const [phase, setPhase] = React.useState("idle"); // idle, shake, tear, flash, flipping, reveal, text

  React.useEffect(() => {
    if (!autoplay) return;
    const timers = [];
    timers.push(setTimeout(() => setPhase("shake"), 800));
    timers.push(setTimeout(() => setPhase("charge"), 1800));
    timers.push(setTimeout(() => setPhase("tear"), 2300));
    timers.push(setTimeout(() => setPhase("flash"), 2700));
    timers.push(setTimeout(() => setPhase("flipping"), 2900));
    timers.push(setTimeout(() => setPhase("reveal"), 4100));
    timers.push(setTimeout(() => setPhase("text"), 4700));
    return () => timers.forEach(clearTimeout);
  }, [autoplay, rarity]);

  const start = () => setPhase("shake");

  // Idle shows mystery package; rarity color only appears at charge+
  const showRays = phase === "charge" || phase === "tear" || phase === "flash" || phase === "flipping" || phase === "reveal" || phase === "text";
  const showPackage = phase === "idle" || phase === "shake" || phase === "charge" || phase === "tear";
  // Pass a derived phase to Package: idle => idle-pkg (static, mystery)
  const pkgPhase = phase === "idle" ? "idle-pkg" : phase;
  const showFlash = phase === "flash" || phase === "flipping";
  const showCard = phase === "flipping" || phase === "reveal" || phase === "text";
  const showConfetti = (phase === "reveal" || phase === "text") && tokens.burst;
  const showSparkles = (phase === "reveal" || phase === "text") && rarity === "legendary";

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: `radial-gradient(circle at 50% 50%, #1C2030 0%, #06080F 75%)`,
      overflow: "hidden",
      animation: rarity === "legendary" && phase === "text" ? "camera-zoom 4s ease-out forwards" : "none",
    }}>
      {/* Status bar */}
      <div style={{ height: 36, padding: "8px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--pc-ink)", position: "relative", zIndex: 40 }}>
        <span>9:41</span>
        <span style={{ fontSize: 11 }}>●●●● 5G ▮▮▮</span>
      </div>

      {/* Header banner */}
      {phase !== "text" && (
        <div style={{
          position: "absolute", top: 50, left: 0, right: 0, textAlign: "center", zIndex: 4,
          opacity: phase === "flipping" || phase === "reveal" ? 0.4 : 1,
          transition: "opacity 0.4s",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--pc-ink-tertiary)", letterSpacing: ".15em" }}>
            10/28 · 한강체육공원
          </div>
          <div style={{ fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 900, color: "var(--pc-ink)", marginTop: 4, letterSpacing: "-0.02em" }}>
            AI가 선정한 이번 경기 칭호
          </div>
        </div>
      )}

      {/* idle: tap to open */}
      {phase === "idle" && (
        <div onClick={start} style={{
          position: "absolute", inset: 0, zIndex: 50, display: "flex",
          alignItems: "flex-end", justifyContent: "center", paddingBottom: 40,
          cursor: "pointer",
        }}>
          <div style={{
            padding: "12px 22px", borderRadius: 9999, background: "var(--pc-primary)", color: "var(--pc-ink-on-primary)",
            fontWeight: 800, fontSize: 13, boxShadow: "var(--pc-shadow-glow-amber)",
            animation: "pulse-glow 1.6s ease-in-out infinite",
          }}>탭하여 카드팩 열기</div>
        </div>
      )}

      {/* Background rays */}
      {showRays && <Rays tokens={tokens} intense={rarity === "legendary"}/>}

      {/* Package */}
      {showPackage && <Package tokens={tokens} phase={pkgPhase}/>}

      {/* Flash on tear */}
      {showFlash && <FlashBurst tokens={tokens}/>}

      {/* Card */}
      {showCard && <Card tokens={tokens} phase={phase}/>}

      {/* Sparkles around card (legend) */}
      {showSparkles && <Sparkles tokens={tokens}/>}

      {/* Confetti */}
      {showConfetti && <Confetti tokens={tokens}/>}

      {/* Final text */}
      <TitleText tokens={tokens} phase={phase}/>

      {/* Buttons */}
      <ConfirmButton tokens={tokens} phase={phase} onReplay={onReplay}/>
    </div>
  );
};

Object.assign(window, { RevealScreen });
