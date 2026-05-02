// PlayCard · Team Builder — Matchup screen (포지션 슬롯 v2)

const MatchupStep = ({ result, mode, formation, onReroll, onMove, onSwap, onRename, onBack }) => {
  const [editingName, setEditingName] = React.useState(null);
  const [moveTarget, setMoveTarget] = React.useState(null); // { pid, fromTeam, fromPos }
  if (!result) return null;

  const sumA = computeSum(result.a);
  const sumB = computeSum(result.b);
  const diff = Math.abs(sumA - sumB);
  const balanceLabel = diff < 0.3 ? "완벽한 균형" : diff < 0.8 ? "팽팽함" : diff < 1.5 ? "약간 우위" : "큰 격차";
  const balanceColor = diff < 0.3 ? "var(--pc-success)" : diff < 0.8 ? "var(--pc-primary)" : diff < 1.5 ? "var(--pc-warning)" : "var(--pc-danger)";

  const aFinder = (p) => p.id; // util

  return (
    <div style={{ padding: "12px 14px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--pc-ink-secondary)", fontSize: 22, cursor: "pointer", padding: 4 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "var(--pc-primary)", letterSpacing: ".2em", fontFamily: "var(--pc-font-mono)" }}>STEP 3</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--pc-ink)", letterSpacing: "-0.01em" }}>MATCHUP</div>
        </div>
        <div style={{ fontSize: 10, color: "var(--pc-ink-tertiary)", fontFamily: "var(--pc-font-mono)", textAlign: "right" }}>
          {mode === "auto" ? "AI 자동" : mode === "semi" ? "반자동" : "수동"}<br/>{formation.AT}공·{formation.SE}세·{formation.DF}수
        </div>
      </div>

      {/* VS Banner */}
      <VSBanner result={result} sumA={sumA} sumB={sumB}
        editingName={editingName} setEditingName={setEditingName} onRename={onRename}/>

      {/* Balance bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
          <span style={{ color: "var(--pc-ink-secondary)", fontWeight: 700 }}>팀 밸런스</span>
          <span style={{ color: balanceColor, fontWeight: 800, fontFamily: "var(--pc-font-mono)" }}>{balanceLabel} · Δ{diff.toFixed(2)}</span>
        </div>
        <BalanceBar sumA={sumA} sumB={sumB}/>
      </div>

      {/* Position-by-position breakdown */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {window.POSITION_ORDER.map(pos => {
          if (formation[pos] === 0) return null;
          return (
            <PositionRow key={pos} pos={pos} formation={formation}
              aIds={result.a[pos]} bIds={result.b[pos]}
              onSlotTap={(team, idx) => setMoveTarget({ team, pos, idx })}/>
          );
        })}
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--pc-warning)" + "1A", border: "1px solid var(--pc-warning)" + "55", borderRadius: 10, fontSize: 11, color: "var(--pc-warning)" }}>
          ⚠ {result.warnings.join(" · ")}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <Button variant="ghost" size="sm" onClick={onReroll}>↻ 다시</Button>
        <Button full size="sm">📋 공유</Button>
        <Button variant="primary" size="sm">✓ 확정</Button>
      </div>

      {/* Move modal */}
      {moveTarget && (
        <MoveSlotSheet target={moveTarget} result={result} formation={formation}
          onClose={() => setMoveTarget(null)}
          onPick={(newPid) => { onSwap(moveTarget.team, moveTarget.pos, moveTarget.idx, newPid); setMoveTarget(null); }}
          onMoveOut={(toTeam, toPos) => {
            const oldPid = result[moveTarget.team][moveTarget.pos][moveTarget.idx];
            onMove(oldPid, moveTarget.team, moveTarget.pos, toTeam, toPos);
            setMoveTarget(null);
          }}/>
      )}
    </div>
  );
};

function computeSum(teamObj) {
  let total = 0;
  Object.entries(teamObj).forEach(([pos, ids]) => {
    ids.forEach(id => {
      const p = window.PLAYERS.find(x => x.id === id);
      if (p) total += p.stats[pos];
    });
  });
  return total;
}

// ── VS Banner with two team identities ──
const VSBanner = ({ result, sumA, sumB, editingName, setEditingName, onRename }) => {
  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(135deg, var(--pc-bg-deep) 0%, var(--pc-surface) 100%)",
      border: "1px solid var(--pc-border)", padding: "16px 12px",
    }}>
      {/* Diagonal divider */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, transparent 48%, var(--pc-border) 49%, var(--pc-border) 51%, transparent 52%)", pointerEvents: "none" }}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", position: "relative" }}>
        {/* Team A */}
        <TeamIdentity side="a" name={result.nameA} sum={sumA}
          editing={editingName === "a"} setEditing={setEditingName}
          onRename={(n) => onRename("a", n)}/>
        <div style={{
          fontSize: 36, fontWeight: 900, color: "var(--pc-primary)", letterSpacing: "-0.04em",
          textShadow: "0 0 22px rgba(255,176,32,0.5)", fontStyle: "italic", lineHeight: 1,
          padding: "0 4px",
        }}>VS</div>
        <TeamIdentity side="b" name={result.nameB} sum={sumB}
          editing={editingName === "b"} setEditing={setEditingName}
          onRename={(n) => onRename("b", n)}/>
      </div>
    </div>
  );
};

const TeamIdentity = ({ side, name, sum, editing, setEditing, onRename }) => {
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => setDraft(name), [name]);
  const isA = side === "a";
  const accent = isA ? "var(--pc-primary)" : "var(--pc-info)";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: ".2em", fontFamily: "var(--pc-font-mono)" }}>TEAM {side.toUpperCase()}</div>
      {editing ? (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => { onRename(draft); setEditing(null); }} autoFocus
          style={{ width: "100%", marginTop: 4, fontSize: 14, fontWeight: 800, color: "var(--pc-ink)", background: "var(--pc-bg-deep)", border: `1px solid ${accent}`, borderRadius: 6, padding: "4px 6px", textAlign: "center" }}/>
      ) : (
        <button onClick={() => setEditing(side)} style={{
          background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 2,
          fontSize: 14, fontWeight: 800, color: "var(--pc-ink)", letterSpacing: "-0.01em", lineHeight: 1.2,
          width: "100%", textWrap: "balance",
        }}>{name} <span style={{ fontSize: 9, color: "var(--pc-ink-tertiary)" }}>✎</span></button>
      )}
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, fontFamily: "var(--pc-font-mono)", marginTop: 4, letterSpacing: "-0.03em" }}>{sum.toFixed(1)}</div>
      <div style={{ fontSize: 9, color: "var(--pc-ink-tertiary)", letterSpacing: ".15em", fontFamily: "var(--pc-font-mono)" }}>SUM</div>
    </div>
  );
};

// ── Position row: shows A side | label | B side ──
const PositionRow = ({ pos, formation, aIds, bIds, onSlotTap }) => {
  const accent = window.POSITION_COLOR[pos];
  const aSum = aIds.reduce((s, id) => s + (window.PLAYERS.find(p => p.id === id)?.stats[pos] ?? 0), 0);
  const bSum = bIds.reduce((s, id) => s + (window.PLAYERS.find(p => p.id === id)?.stats[pos] ?? 0), 0);
  const aWin = aSum > bSum + 0.05;
  const bWin = bSum > aSum + 0.05;

  return (
    <div style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 12, overflow: "hidden" }}>
      {/* Position label band */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 12px", background: accent + "1A", borderBottom: `1px solid ${accent}33`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: accent, color: "#0B0F1A", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--pc-font-mono)" }}>{window.POSITION_SHORT[pos]}</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: ".05em", fontFamily: "var(--pc-font-mono)" }}>{window.POSITION_LABEL[pos]} · {formation[pos]} vs {formation[pos]}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "var(--pc-font-mono)", color: "var(--pc-ink-tertiary)" }}>
          <span style={{ color: aWin ? "var(--pc-primary)" : "var(--pc-ink-tertiary)" }}>{aSum.toFixed(1)}</span>
          <span style={{ margin: "0 6px" }}>—</span>
          <span style={{ color: bWin ? "var(--pc-info)" : "var(--pc-ink-tertiary)" }}>{bSum.toFixed(1)}</span>
        </span>
      </div>

      {/* Slots */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--pc-border)" }}>
        <div style={{ background: "var(--pc-surface)", padding: "8px 10px 8px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: formation[pos] }).map((_, i) => (
            <PositionSlot key={i} pid={aIds[i]} pos={pos} side="a" onClick={() => onSlotTap("a", i)}/>
          ))}
        </div>
        <div style={{ background: "var(--pc-surface)", padding: "8px 8px 8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: formation[pos] }).map((_, i) => (
            <PositionSlot key={i} pid={bIds[i]} pos={pos} side="b" onClick={() => onSlotTap("b", i)}/>
          ))}
        </div>
      </div>
    </div>
  );
};

const PositionSlot = ({ pid, pos, side, onClick }) => {
  const player = pid ? window.PLAYERS.find(p => p.id === pid) : null;
  const accent = side === "a" ? "var(--pc-primary)" : "var(--pc-info)";
  const isA = side === "a";

  if (!player) {
    return (
      <button onClick={onClick} style={{
        padding: "8px 10px", borderRadius: 8, border: `1.5px dashed var(--pc-border-strong)`,
        background: "var(--pc-bg-deep)", color: "var(--pc-ink-tertiary)", fontSize: 11, fontWeight: 700,
        cursor: "pointer", textAlign: isA ? "left" : "right", flexDirection: isA ? "row" : "row-reverse",
        display: "flex", alignItems: "center", gap: 6,
      }}>＋ 빈자리</button>
    );
  }
  const score = player.stats[pos];
  return (
    <button onClick={onClick} style={{
      padding: "8px 10px", borderRadius: 8,
      background: "var(--pc-bg-deep)", border: `1px solid ${accent}55`,
      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
      flexDirection: isA ? "row" : "row-reverse", textAlign: isA ? "left" : "right",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: rarityFill(player.rarity), color: "#fff",
        fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{player.name[0]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--pc-ink)", lineHeight: 1.1 }}>{player.name}</div>
        <div style={{ fontSize: 9, color: "var(--pc-ink-tertiary)", marginTop: 2, fontFamily: "var(--pc-font-mono)" }}>
          공 {player.stats.AT.toFixed(1)} · 세 {player.stats.SE.toFixed(1)} · 수 {player.stats.DF.toFixed(1)}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: accent, fontFamily: "var(--pc-font-mono)" }}>{score.toFixed(1)}</div>
    </button>
  );
};

function rarityFill(r) {
  return ({
    legendary: "linear-gradient(135deg, #FFB020, #FF7A1A)",
    epic: "linear-gradient(135deg, #A26BFF, #6B3DCC)",
    rare: "linear-gradient(135deg, #3A6DFF, #2A4DCC)",
    common: "linear-gradient(135deg, #6B7080, #4A4F5C)",
  })[r];
}

// ── Slot tap modal: pick swap/move action ──
const MoveSlotSheet = ({ target, result, formation, onClose, onPick, onMoveOut }) => {
  const curId = result[target.team][target.pos][target.idx];
  const curPlayer = curId ? window.PLAYERS.find(p => p.id === curId) : null;
  const accent = target.team === "a" ? "var(--pc-primary)" : "var(--pc-info)";

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, background: "rgba(11,15,26,0.65)", zIndex: 30,
      display: "flex", alignItems: "flex-end", animation: "fade-in 200ms",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", background: "var(--pc-surface-elevated)", borderRadius: "20px 20px 0 0",
        padding: "16px 16px 20px", maxHeight: "70%", overflowY: "auto",
        borderTop: `2px solid ${accent}`,
      }}>
        <div style={{ width: 40, height: 4, background: "var(--pc-border-strong)", borderRadius: 2, margin: "0 auto 12px" }}/>
        <div style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: ".2em", fontFamily: "var(--pc-font-mono)" }}>TEAM {target.team.toUpperCase()} · {window.POSITION_LABEL[target.pos]}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--pc-ink)", marginTop: 2 }}>
          {curPlayer ? `${curPlayer.name} 슬롯 변경` : "빈 슬롯 채우기"}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: "var(--pc-ink-secondary)", marginBottom: 6 }}>다른 포지션·팀으로 이동</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
          {window.POSITION_ORDER.flatMap(pos => ["a", "b"].map(team => {
            const isCur = target.team === team && target.pos === pos;
            if (isCur) return null;
            const isFull = result[team][pos].filter(Boolean).length >= formation[pos];
            const teamColor = team === "a" ? "var(--pc-primary)" : "var(--pc-info)";
            return (
              <button key={`${team}-${pos}`} onClick={() => !isFull && curId && onMoveOut(team, pos)} disabled={isFull || !curId}
                style={{
                  padding: "8px 4px", borderRadius: 8, border: `1px solid ${isFull ? "var(--pc-border)" : teamColor + "55"}`,
                  background: "var(--pc-bg-deep)", cursor: isFull || !curId ? "not-allowed" : "pointer",
                  fontSize: 10, fontWeight: 800, fontFamily: "var(--pc-font-mono)",
                  color: isFull ? "var(--pc-ink-tertiary)" : teamColor, opacity: isFull ? 0.4 : 1,
                }}>{team.toUpperCase()}·{window.POSITION_SHORT[pos]} {isFull && "FULL"}</button>
            );
          }))}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, color: "var(--pc-ink-secondary)", marginBottom: 6 }}>현재 슬롯에 다른 선수 배치</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {window.PLAYERS.map(p => {
            const score = p.stats[target.pos];
            const isCur = p.id === curId;
            return (
              <button key={p.id} onClick={() => onPick(p.id)} disabled={isCur} style={{
                padding: "8px 10px", borderRadius: 8,
                background: isCur ? accent + "22" : "var(--pc-bg-deep)",
                border: `1px solid ${isCur ? accent : "var(--pc-border)"}`,
                cursor: isCur ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left",
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--pc-ink)", flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: accent, fontFamily: "var(--pc-font-mono)" }}>{score.toFixed(1)}</span>
              </button>
            );
          })}
        </div>

        <button onClick={onClose} style={{ marginTop: 14, width: "100%", padding: "10px 0", border: "none", background: "var(--pc-bg-deep)", color: "var(--pc-ink-secondary)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>취소</button>
      </div>
    </div>
  );
};

// ── Balance bar ──
const BalanceBar = ({ sumA, sumB }) => {
  const total = sumA + sumB;
  const aPct = total === 0 ? 50 : (sumA / total) * 100;
  return (
    <div style={{ position: "relative", height: 8, background: "var(--pc-bg-deep)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${aPct}%`, background: "var(--pc-primary)", transition: "width 400ms" }}/>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - aPct}%`, background: "var(--pc-info)" }}/>
      <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, background: "var(--pc-ink)", transform: "translateX(-50%)" }}/>
    </div>
  );
};

Object.assign(window, { MatchupStep });
