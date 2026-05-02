// PlayCard · Team Builder Screen (포지션 중심 v2)
// Flow: roster → mode → assigning → matchup
// 포지션: AT(공격수) / SE(세터) / DF(수비)
// 팀당 4명: AT 1 + SE 1 + DF 2 / 팀당 3명: AT 1 + SE 1 + DF 1

const TeamScreen = ({ variant = "vsCard" }) => {
  const [step, setStep] = React.useState("roster");
  const [selected, setSelected] = React.useState(window.PLAYERS.slice(0, 8).map(p => p.id));
  const [mode, setMode] = React.useState("auto");
  // semi-auto pin: { playerId: { team: 'a'|'b', pos: 'AT'|'SE'|'DF' } }
  const [pins, setPins] = React.useState({});
  // result: { a: {AT:[ids], SE:[ids], DF:[ids]}, b: {...}, nameA, nameB, formation }
  const [result, setResult] = React.useState(null);

  const players = window.PLAYERS.filter(p => selected.includes(p.id));
  const teamSize = players.length >= 8 ? 4 : 3; // 8명+ → 4vs4, 그 외 3vs3
  const formation = window.TEAM_FORMATION[teamSize];

  const balance = () => {
    const result_ = computeAssignment(players, mode, pins, formation);
    const nameA = window.TEAM_NAMES_A[Math.floor(Math.random() * window.TEAM_NAMES_A.length)];
    const nameB = window.TEAM_NAMES_B[Math.floor(Math.random() * window.TEAM_NAMES_B.length)];
    setResult({ ...result_, nameA, nameB, formation });
  };

  const startAssign = () => {
    setStep("assigning");
    setTimeout(() => { balance(); setStep("matchup"); }, 1500);
  };
  const reroll = () => {
    setStep("assigning");
    setTimeout(() => { balance(); setStep("matchup"); }, 900);
  };
  const swapSlot = (team, pos, idx, newPid) => {
    if (!result) return;
    const next = JSON.parse(JSON.stringify(result));
    next[team][pos][idx] = newPid;
    setResult(next);
  };
  const movePlayer = (pid, fromTeam, fromPos, toTeam, toPos) => {
    if (!result) return;
    const next = JSON.parse(JSON.stringify(result));
    const fromArr = next[fromTeam][fromPos];
    const i = fromArr.indexOf(pid);
    if (i >= 0) fromArr.splice(i, 1);
    next[toTeam][toPos].push(pid);
    setResult(next);
  };

  if (step === "roster") return <RosterStep selected={selected} setSelected={setSelected} onNext={() => setStep("mode")} teamSize={teamSize}/>;
  if (step === "mode") return <ModeStep mode={mode} setMode={setMode} pins={pins} setPins={setPins} players={players} formation={formation} onBack={() => setStep("roster")} onNext={startAssign}/>;
  if (step === "assigning") return <AssigningStep mode={mode}/>;
  return <MatchupStep result={result} mode={mode} formation={formation}
    onReroll={reroll} onMove={movePlayer} onSwap={swapSlot}
    onRename={(side, n) => setResult({ ...result, [side === "a" ? "nameA" : "nameB"]: n })}
    onBack={() => setStep("mode")}/>;
};

// ─────────── ASSIGNMENT LOGIC ───────────
// Returns { a: {AT:[..], SE:[..], DF:[..]}, b: {...}, warnings: [str] }
function computeAssignment(players, mode, pins, formation) {
  const a = { AT: [], SE: [], DF: [] };
  const b = { AT: [], SE: [], DF: [] };
  const warnings = [];

  // Apply pins first (semi mode)
  const pinned = mode === "semi" ? pins : {};
  const pinnedIds = new Set(Object.keys(pinned));

  Object.entries(pinned).forEach(([pid, { team, pos }]) => {
    (team === "a" ? a : b)[pos].push(pid);
  });

  const remaining = players.filter(p => !pinnedIds.has(p.id));

  if (mode === "manual") {
    // Manual: dump everyone into A.AT initially as "to be placed"
    // Actually, we'll keep them in unassigned pool — but our shape needs slots.
    // For manual UX simplicity: do an initial AI-like assignment user can rearrange.
    return aiAssign(remaining, a, b, formation, warnings);
  }

  // auto / semi: position-priority snake draft
  return aiAssign(remaining, a, b, formation, warnings);
}

function aiAssign(remaining, a, b, formation, warnings) {
  // 전체 선수가 모든 포지션을 가능하다고 가정
  // 각 포지션에 대해 점수 높은 순으로 양 팀에 배분 (snake-draft, 공 → 세 → 수 순)
  const POS = ["AT", "SE", "DF"];
  POS.forEach(pos => {
    const needA = formation[pos] - a[pos].length;
    const needB = formation[pos] - b[pos].length;
    const totalNeed = needA + needB;
    if (totalNeed <= 0) return;

    const candidates = remaining
      .filter(p => !alreadyPlaced(p.id, a, b))
      .sort((x, y) => y.stats[pos] - x.stats[pos]);

    if (candidates.length < totalNeed) {
      warnings.push(`${window.POSITION_LABEL[pos]} ${totalNeed - candidates.length}자리 부족`);
    }

    candidates.slice(0, totalNeed).forEach((p) => {
      const aSum = a[pos].reduce((s, id) => s + scoreOf(id, pos), 0);
      const bSum = b[pos].reduce((s, id) => s + scoreOf(id, pos), 0);
      const aFull = a[pos].length >= formation[pos];
      const bFull = b[pos].length >= formation[pos];
      if (aFull) b[pos].push(p.id);
      else if (bFull) a[pos].push(p.id);
      else (aSum <= bSum ? a : b)[pos].push(p.id);
    });
  });

  return { a, b, warnings };
}

function alreadyPlaced(pid, a, b) {
  return ["AT", "SE", "DF"].some(pos => a[pos].includes(pid) || b[pos].includes(pid));
}
function scoreOf(pid, pos) {
  const p = window.PLAYERS.find(x => x.id === pid);
  return p ? p.stats[pos] : 0;
}

// ─────────── STEP 1: 참가자 선택 (roster) ───────────
const RosterStep = ({ selected, setSelected, onNext, teamSize }) => {
  const all = window.PLAYERS;
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const isEven = selected.length % 2 === 0;
  const isMin = selected.length >= 6;
  const formation = window.TEAM_FORMATION[teamSize];

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <SectionLabel n="STEP 1" title="참가자 선택" sub={`${selected.length}명 · 한 팀 ${teamSize}명 (${formation.AT}공·${formation.SE}세·${formation.DF}수)`}/>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        {all.map(p => (
          <RosterChip key={p.id} player={p} selected={selected.includes(p.id)} onClick={() => toggle(p.id)}/>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setSelected(all.map(p => p.id))}>전체</Button>
        <Button variant="ghost" size="sm" onClick={() => setSelected([])}>해제</Button>
      </div>

      <div style={{
        marginTop: 16, padding: "10px 12px", background: "var(--pc-surface)", border: "1px solid var(--pc-border)",
        borderRadius: 10, fontSize: 11, color: "var(--pc-ink-tertiary)", display: "flex", alignItems: "center", gap: 6,
      }}>
        {!isMin && <span style={{ color: "var(--pc-danger)" }}>⚠ 최소 6명 (3 vs 3)</span>}
        {isMin && !isEven && <span style={{ color: "var(--pc-warning)" }}>⚠ 홀수 — 한 팀이 1명 더 많아져요</span>}
        {isMin && isEven && <span>✓ 준비 완료 · 다음 단계로</span>}
      </div>

      <div style={{ position: "sticky", bottom: 16, marginTop: 20 }}>
        <Button full size="lg" onClick={onNext} disabled={!isMin}>분배 방식 선택 →</Button>
      </div>
    </div>
  );
};

const RosterChip = ({ player, selected, onClick }) => {
  const POS = ["AT", "SE", "DF"];
  return (
    <div onClick={onClick} style={{
      padding: 10, borderRadius: 12,
      background: selected ? "var(--pc-primary-tint)" : "var(--pc-surface)",
      border: `1.5px solid ${selected ? "var(--pc-primary)" : "var(--pc-border)"}`,
      cursor: "pointer", transition: "all 180ms",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 14, height: 14, borderRadius: 4,
          background: selected ? "var(--pc-primary)" : "transparent",
          border: `2px solid ${selected ? "var(--pc-primary)" : "var(--pc-border-strong)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>{selected && <IconCheck size={10} strokeWidth={3} style={{ color: "var(--pc-ink-on-primary)" }}/>}</div>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--pc-ink)", flex: 1 }}>{player.name}</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8, paddingLeft: 22 }}>
        {POS.map(pos => {
          const v = player.stats[pos];
          const color = window.POSITION_COLOR[pos];
          return (
            <div key={pos} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: color, fontFamily: "var(--pc-font-mono)", letterSpacing: ".05em" }}>
                {window.POSITION_SHORT[pos]} {v.toFixed(1)}
              </span>
              <div style={{ width: "100%", height: 3, background: "var(--pc-bg-deep)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${v * 10}%`, height: "100%", background: color, opacity: selected ? 1 : 0.7 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SectionLabel = ({ n, title, sub }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--pc-primary)", letterSpacing: ".15em", fontFamily: "var(--pc-font-mono)" }}>{n}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--pc-ink)", letterSpacing: "-0.02em", marginTop: 2 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: "var(--pc-ink-tertiary)", marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─────────── STEP 2: 분배 방식 (mode) ───────────
const ModeStep = ({ mode, setMode, pins, setPins, players, formation, onBack, onNext }) => {
  const setPin = (pid, team, pos) => {
    setPins(p => {
      const cur = p[pid];
      if (cur && cur.team === team && cur.pos === pos) {
        const { [pid]: _, ...rest } = p;
        return rest;
      }
      return { ...p, [pid]: { team, pos } };
    });
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <SectionLabel n="STEP 2" title="분배 방식" sub="포지션별로 균형을 맞춥니다"/>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        <ModeCard id="auto" mode={mode} setMode={setMode}
          icon="✦" title="AI 자동분배"
          sub="포지션 1:1 매칭 (공vs공, 세vs세, 수vs수)"
          accent="var(--pc-primary)"/>
        <ModeCard id="semi" mode={mode} setMode={setMode}
          icon="⚐" title="반자동"
          sub="특정 선수를 특정 포지션·팀에 고정 후 AI"
          accent="var(--pc-info)"/>
        <ModeCard id="manual" mode={mode} setMode={setMode}
          icon="✋" title="완전 수동"
          sub="직접 슬롯에 배치 · 합산만 표시"
          accent="var(--pc-secondary)"/>
      </div>

      {mode === "semi" && (
        <SemiPinPanel players={players} pins={pins} setPin={setPin} formation={formation}/>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <Button variant="ghost" onClick={onBack}>이전</Button>
        <Button full onClick={onNext}>팀 짜기 시작 ▶</Button>
      </div>
    </div>
  );
};

const SemiPinPanel = ({ players, pins, setPin, formation }) => {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pc-ink-secondary)", marginBottom: 10 }}>
        선수 → 포지션·팀 고정
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {players.map(p => {
          const pin = pins[p.id];
          return (
            <div key={p.id} style={{
              padding: "10px 10px 8px", borderRadius: 10, background: "var(--pc-surface)",
              border: `1.5px solid ${pin ? (pin.team === "a" ? "var(--pc-primary)" : "var(--pc-info)") : "var(--pc-border)"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--pc-ink)" }}>{p.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--pc-ink-tertiary)", fontFamily: "var(--pc-font-mono)" }}>
                  공 {p.stats.AT.toFixed(1)} · 세 {p.stats.SE.toFixed(1)} · 수 {p.stats.DF.toFixed(1)}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                {window.POSITION_ORDER.map(pos => (
                  <div key={pos} style={{ display: "flex", gap: 3 }}>
                    {["a", "b"].map(team => {
                      const active = pin && pin.team === team && pin.pos === pos;
                      const tColor = team === "a" ? "var(--pc-primary)" : "var(--pc-info)";
                      return (
                        <button key={team} onClick={() => setPin(p.id, team, pos)} style={{
                          flex: 1, padding: "5px 0", border: "none", cursor: "pointer", borderRadius: 6,
                          fontSize: 10, fontWeight: 800, fontFamily: "var(--pc-font-mono)",
                          background: active ? tColor : "var(--pc-bg-deep)",
                          color: active ? (team === "a" ? "var(--pc-ink-on-primary)" : "#fff") : "var(--pc-ink-tertiary)",
                          letterSpacing: ".05em",
                        }}>{team.toUpperCase()}·{window.POSITION_SHORT[pos]}</button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ModeCard = ({ id, mode, setMode, icon, title, sub, accent }) => {
  const active = mode === id;
  return (
    <div onClick={() => setMode(id)} style={{
      padding: 14, borderRadius: 12,
      background: active ? "var(--pc-primary-tint)" : "var(--pc-surface)",
      border: `1.5px solid ${active ? accent : "var(--pc-border)"}`,
      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
      boxShadow: active ? `0 0 0 4px ${accent}1A` : "none", transition: "all 200ms",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: active ? accent : "var(--pc-bg-deep)",
        color: active ? "var(--pc-ink-on-primary)" : "var(--pc-ink-secondary)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--pc-ink)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--pc-ink-tertiary)", marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `2px solid ${active ? accent : "var(--pc-border-strong)"}`,
        background: active ? accent : "transparent", position: "relative",
      }}>
        {active && <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "var(--pc-surface)" }}/>}
      </div>
    </div>
  );
};

// ─────────── STEP 3: 분배 진행 ───────────
const AssigningStep = ({ mode }) => (
  <div style={{ padding: 24, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
    <div style={{
      width: 80, height: 80, borderRadius: "50%",
      border: "4px solid var(--pc-bg-deep)", borderTopColor: "var(--pc-primary)",
      animation: "team-spin 1s linear infinite", boxShadow: "var(--pc-shadow-glow-amber)",
    }}/>
    <style>{`@keyframes team-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } } @keyframes shuffle-card { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }`}</style>
    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--pc-ink)", marginTop: 6 }}>
      {mode === "auto" ? "포지션별 균형을 맞추는 중…" : mode === "semi" ? "고정 인원을 중심으로 배치 중…" : "초기 배치 준비 중…"}
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      {window.POSITION_ORDER.map((pos, i) => (
        <div key={pos} style={{
          padding: "4px 10px", borderRadius: 6, background: window.POSITION_COLOR[pos] + "33",
          color: window.POSITION_COLOR[pos], fontSize: 11, fontWeight: 800, fontFamily: "var(--pc-font-mono)",
          animation: `shuffle-card 0.7s ease-in-out infinite`, animationDelay: `${i * 0.12}s`,
        }}>{window.POSITION_LABEL[pos]}</div>
      ))}
    </div>
  </div>
);

Object.assign(window, { TeamScreen });
