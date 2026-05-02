// PlayCard — Screens
const { useState } = React;

// ─── HOME / DASHBOARD ───
const HomeScreen = ({ onNav }) => (
  <div style={{ padding: "16px 16px 80px", display: "flex", flexDirection: "column", gap: 14 }}>
    {/* 인사 */}
    <div>
      <div style={{ fontSize: 12, color: "var(--pc-ink-tertiary)", fontWeight: 600 }}>오늘도 한 판?</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>{ME.name}님 👋</div>
    </div>

    {/* 평가 진행 배너 */}
    <EvaluationBanner onClick={() => onNav("evaluate")}/>

    {/* 내 카드 요약 */}
    <Card padding={14} style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, background: "linear-gradient(160deg,#C084FC,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontStyle: "italic", fontSize: 22, fontFamily: "var(--pc-font-display)" }}>{ME.name[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <RarityChip rarity={ME.rarity}/>
          <span style={{ fontSize: 11, fontFamily: "var(--pc-font-mono)", fontWeight: 700, color: "var(--pc-ink-tertiary)" }}>LV.{ME.level}</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{ME.name}</div>
        <div style={{ fontSize: 12, color: "var(--pc-ink-secondary)", fontWeight: 600 }}>「{ME.title}」</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="pc-score" style={{ fontSize: 28, color: "var(--pc-primary)" }}>{ME.avg.toFixed(1)}</div>
        <div style={{ fontSize: 10, color: "var(--pc-ink-tertiary)", fontWeight: 600, letterSpacing: ".06em" }}>AVG</div>
      </div>
    </Card>

    {/* EXP bar */}
    <Card padding={14}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pc-ink-secondary)" }}>다음 레벨까지</span>
        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--pc-font-mono)", color: "var(--pc-primary)" }}>+820 / 1000 EXP</span>
      </div>
      <div style={{ height: 10, background: "var(--pc-bg-deep)", borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ width: "82%", height: "100%", background: "linear-gradient(90deg,var(--pc-primary),var(--pc-accent))", borderRadius: 9999 }}/>
      </div>
    </Card>

    {/* 최근 경기 */}
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 4px 8px", whiteSpace: "nowrap", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>최근 경기</span>
        <span style={{ fontSize: 11, color: "var(--pc-primary)", fontWeight: 700, flexShrink: 0 }}>전체보기 ›</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { date: "10/28", venue: "한강체육공원", score: 8.7, mvp: false, delta: 0.6 },
          { date: "10/21", venue: "잠실종합", score: 8.1, mvp: true, delta: 0.7 },
          { date: "10/14", venue: "한강체육공원", score: 7.4, mvp: false, delta: -0.6 },
        ].map((m, i) => (
          <Card key={i} padding={12} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--pc-bg-deep)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 9, color: "var(--pc-ink-tertiary)", fontWeight: 700 }}>{m.date.split("/")[0]}월</div>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--pc-font-display)", fontStyle: "italic", color: "var(--pc-primary)" }}>{m.date.split("/")[1]}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.venue}</div>
              <div style={{ fontSize: 11, color: "var(--pc-ink-tertiary)", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                {m.mvp && <Badge tone="gold" style={{ fontSize: 10, padding: "2px 6px" }}>🏆 MVP</Badge>}
                <span>경기 종료</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pc-score" style={{ fontSize: 18 }}>{m.score.toFixed(1)}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: m.delta > 0 ? "var(--pc-trend-up)" : "var(--pc-trend-down)", fontFamily: "var(--pc-font-mono)" }}>
                {m.delta > 0 ? "▲" : "▼"} {Math.abs(m.delta).toFixed(1)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// ─── EVALUATION ───
const EvaluateScreen = () => {
  const [scores, setScores] = useState({ AT: 7.5, SE: null, DF: 6.8 });
  const target = PLAYERS[2]; // 이재훈
  const positions = [
    { key: "AT", label: "공격" },
    { key: "SE", label: "세터" },
    { key: "DF", label: "수비" },
  ];

  return (
    <div style={{ padding: "12px 16px 80px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 진행률 */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pc-ink-secondary)" }}>3 / 6명 평가 중</span>
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--pc-font-mono)", color: "var(--pc-primary)" }}>50%</span>
        </div>
        <div style={{ height: 6, background: "var(--pc-bg-deep)", borderRadius: 9999, overflow: "hidden" }}>
          <div style={{ width: "50%", height: "100%", background: "var(--pc-primary)", borderRadius: 9999 }}/>
        </div>
      </div>

      {/* 평가 카드 */}
      <Card padding={16}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Avatar name={target.name} size={48} color="var(--pc-info)"/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RarityChip rarity={target.rarity}/>
              <span style={{ fontSize: 10, fontFamily: "var(--pc-font-mono)", fontWeight: 700, color: "var(--pc-ink-tertiary)" }}>LV.{target.level}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, marginTop: 2 }}>{target.name}</div>
            <div style={{ fontSize: 11, color: "var(--pc-ink-tertiary)", fontWeight: 600 }}>「{target.title}」</div>
          </div>
          <Badge tone="primary">3/6</Badge>
        </div>

        {/* 슬라이더들 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {positions.map(p => {
            const v = scores[p.key];
            const absent = v === null;
            return (
              <div key={p.key} style={{ opacity: absent ? 0.45 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--pc-ink-secondary)", whiteSpace: "nowrap" }}>{p.label}</span>
                    {!absent && (
                      <button onClick={() => setScores({ ...scores, [p.key]: null })} style={{ border: "none", background: "transparent", color: "var(--pc-ink-tertiary)", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", padding: 0 }}>결장</button>
                    )}
                  </div>
                  <span className="pc-score" style={{ fontSize: 22, color: absent ? "var(--pc-ink-tertiary)" : "var(--pc-primary)", fontStyle: absent ? "normal" : "italic", fontFamily: absent ? "var(--pc-font-sans)" : "var(--pc-font-display)" }}>
                    {absent ? "결장" : v.toFixed(1)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => !absent && setScores({ ...scores, [p.key]: Math.max(0, +(v - 0.1).toFixed(1)) })}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid var(--pc-border-strong)", background: "var(--pc-surface)", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>−</button>
                  <div style={{ flex: 1, height: 6, background: "var(--pc-bg-deep)", borderRadius: 3, position: "relative" }}>
                    {!absent && (
                      <>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${v * 10}%`, background: "linear-gradient(90deg,var(--pc-primary),var(--pc-accent))", borderRadius: 3 }}/>
                        <div style={{ position: "absolute", top: "50%", left: `${v * 10}%`, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: "2.5px solid var(--pc-primary)", transform: "translate(-50%,-50%)", boxShadow: "var(--pc-shadow-md)" }}/>
                      </>
                    )}
                  </div>
                  <button onClick={() => !absent && setScores({ ...scores, [p.key]: Math.min(10, +(v + 0.1).toFixed(1)) })}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid var(--pc-border-strong)", background: "var(--pc-surface)", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 한줄평 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pc-ink-secondary)", marginBottom: 6 }}>한줄평 <span style={{ fontWeight: 500, color: "var(--pc-ink-tertiary)" }}>(선택)</span></div>
          <textarea placeholder="오늘 이 선수에 대해 한마디!" rows={2} style={{
            width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--pc-border)",
            fontSize: 13, fontFamily: "inherit", background: "var(--pc-bg)", resize: "none",
            boxSizing: "border-box",
          }}/>
        </div>
      </Card>

      {/* 액션 */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" full>이전</Button>
        <Button variant="primary" full>다음 →</Button>
      </div>

      <div style={{ fontSize: 11, color: "var(--pc-ink-tertiary)", textAlign: "center" }}>
        💡 한줄평이 모이면 AI가 분석해 칭호를 만들어줘요
      </div>
    </div>
  );
};

// ─── RANKING ───
const RankScreen = () => {
  const [tab, setTab] = useState("overall");
  const tabs = [
    { id: "overall", label: "종합" },
    { id: "AT", label: "공격" },
    { id: "SE", label: "세터" },
    { id: "DF", label: "수비" },
  ];
  const sorted = [...PLAYERS].sort((a, b) => tab === "overall" ? b.avg - a.avg : b.stats[tab] - a.stats[tab]);
  const score = (p) => tab === "overall" ? p.avg : p.stats[tab];
  const deltas = [2, -1, 0, 5, -2, 1, -3];

  return (
    <div style={{ padding: "12px 16px 80px" }}>
      {/* MVP 시상대 */}
      <Card padding={18} style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(255,224,102,.12), transparent 60%), var(--pc-surface)", border: "1px solid var(--pc-border-glow)", marginBottom: 16, boxShadow: "var(--pc-shadow-glow-gold)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, justifyContent: "center" }}>
          <IconCrown size={18}/>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--pc-accent)" }}>THIS SEASON · POTM</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12 }}>
          {[
            { p: sorted[1], h: 60, rank: 2, ringColor: "#94A3B8", barBg: "linear-gradient(180deg,#3D456A,#2F3550)" },
            { p: sorted[0], h: 80, rank: 1, ringColor: "var(--pc-accent)", barBg: "linear-gradient(180deg,#FFE066,#F0A020)" },
            { p: sorted[2], h: 44, rank: 3, ringColor: "#B45309", barBg: "linear-gradient(180deg,#7A4A12,#4A2D0A)" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <Avatar name={m.p.name} size={m.rank === 1 ? 56 : 44} ring={m.ringColor}/>
              <div style={{ fontWeight: 800, fontSize: m.rank === 1 ? 14 : 12, marginTop: 6, color: "var(--pc-ink)" }}>{m.p.name}</div>
              <div className="pc-score" style={{ fontSize: m.rank === 1 ? 20 : 16, color: m.rank === 1 ? "var(--pc-accent)" : "var(--pc-ink-secondary)", textShadow: m.rank === 1 ? "0 0 14px rgba(255,224,102,.55)" : "none" }}>{score(m.p).toFixed(1)}</div>
              <div style={{ width: "100%", height: m.h, background: m.barBg, borderRadius: "8px 8px 0 0", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", color: m.rank === 1 ? "#1A1206" : "#fff", fontWeight: 900, fontStyle: "italic", fontSize: m.rank === 1 ? 26 : 18, fontFamily: "var(--pc-font-display)", boxShadow: m.rank === 1 ? "0 0 18px rgba(255,224,102,.4), inset 0 1px 0 rgba(255,255,255,.4)" : "inset 0 1px 0 rgba(255,255,255,.08)" }}>{m.rank}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", borderRadius: 9999, border: "none",
            background: tab === t.id ? "var(--pc-primary)" : "var(--pc-surface)",
            color: tab === t.id ? "var(--pc-ink-on-primary)" : "var(--pc-ink-secondary)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: tab === t.id ? "var(--pc-shadow-glow-amber)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      <Card padding={0} style={{ overflow: "hidden" }}>
        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            borderBottom: i < sorted.length - 1 ? "1px solid var(--pc-border)" : "none",
            background: p.id === ME.id ? "var(--pc-primary-tint)" : "transparent",
          }}>
            <span style={{
              fontFamily: "var(--pc-font-display)", fontStyle: "italic", fontWeight: 900, fontSize: 22,
              width: 28, textAlign: "center",
              color: i === 0 ? "var(--pc-accent-deep)" : i === 1 ? "#78716C" : i === 2 ? "#B45309" : "var(--pc-ink-tertiary)",
            }}>{i + 1}</span>
            <Avatar name={p.name} size={36}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                {p.id === ME.id && <span style={{ fontSize: 9, color: "var(--pc-primary)", fontWeight: 800 }}>나</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--pc-ink-tertiary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>「{p.title}」</div>
            </div>
            <span className="pc-score" style={{ fontSize: 17 }}>{score(p).toFixed(1)}</span>
            <div style={{ width: 36, textAlign: "right" }}><TrendDelta delta={deltas[i]}/></div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── PROFILE / DASHBOARD ───
const ProfileScreen = () => (
  <div style={{ padding: "12px 16px 80px", display: "flex", flexDirection: "column", gap: 14 }}>
    {/* 큰 카드 */}
    <PlayerCard player={ME}/>

    {/* 능력치 레이더 */}
    <Card padding={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>능력치</span>
        <span style={{ fontSize: 11, color: "var(--pc-ink-tertiary)", fontWeight: 600, whiteSpace: "nowrap" }}>최근 12경기 평균</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: "0 8px" }}>
        <RadarChart stats={ME.stats} size={200}/>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center", fontSize: 11 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--pc-accent-deep)", fontWeight: 700 }}><span style={{ color: "var(--pc-accent)" }}>★</span> BEST · 토스</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--pc-info)", fontWeight: 700 }}>▼ NEED IMPROVEMENT · 수비</span>
      </div>
    </Card>

    {/* 성장 그래프 */}
    <Card padding={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>성장 그래프</span>
        <span style={{ fontSize: 11, fontFamily: "var(--pc-font-mono)", color: "var(--pc-success)", fontWeight: 800 }}>▲ +1.5 / 6경기</span>
      </div>
      <LineChart data={GROWTH}/>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--pc-ink-tertiary)", fontWeight: 600, marginTop: 6, fontFamily: "var(--pc-font-mono)" }}>
        <span>09/16</span><span>09/23</span><span>09/30</span><span>10/07</span><span>10/14</span><span>10/28</span>
      </div>
    </Card>

    {/* 칭호 도감 */}
    <Card padding={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>칭호 도감</span>
        <span style={{ fontSize: 11, color: "var(--pc-primary)", fontWeight: 700 }}>{TITLE_HISTORY.length}개 모음 ›</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {TITLE_HISTORY.map((t, i) => {
          const grad = {
            common: "var(--pc-rarity-common-bg)",
            rare: "var(--pc-rarity-rare-bg)",
            epic: "var(--pc-rarity-epic-bg)",
            legendary: "linear-gradient(135deg,rgba(255,224,102,.18),rgba(255,140,66,.18))",
          };
          const fg = {
            common: "var(--pc-rarity-common)", rare: "var(--pc-rarity-rare)",
            epic: "var(--pc-rarity-epic)", legendary: "var(--pc-accent)",
          };
          return (
            <div key={i} style={{ background: grad[t.rarity], borderRadius: 12, padding: "10px 12px", border: i === 0 ? "1.5px solid var(--pc-primary)" : "1px solid var(--pc-border)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: fg[t.rarity], lineHeight: 1.2 }}>{t.title}</div>
              <div style={{ fontSize: 10, color: "var(--pc-ink-tertiary)", fontFamily: "var(--pc-font-mono)", fontWeight: 600, marginTop: 4 }}>{t.date}{i === 0 && " · 현재"}</div>
            </div>
          );
        })}
      </div>
    </Card>
  </div>
);

window.HomeScreen = HomeScreen;
window.EvaluateScreen = EvaluateScreen;
window.RankScreen = RankScreen;
window.ProfileScreen = ProfileScreen;
