'use client';

import { useMemo, useState } from 'react';
import { balancePosition, balanceTotal, randomBalance, topVsBottom, type PlayerScore } from '@/utils/teamBalancer';

const samplePlayers: PlayerScore[] = [
  { userId: 'u1', total: 8.6, metrics: { attack: 9.2, defense: 7.5 } },
  { userId: 'u2', total: 8.1, metrics: { attack: 8.7, defense: 7.3 } },
  { userId: 'u3', total: 7.8, metrics: { attack: 7.4, defense: 8.1 } },
  { userId: 'u4', total: 7.5, metrics: { attack: 7.2, defense: 7.8 } },
  { userId: 'u5', total: 7.1, metrics: { attack: 6.8, defense: 7.4 } },
  { userId: 'u6', total: 6.9, metrics: { attack: 6.2, defense: 7.6 } }
];

export default function TeamBuilderPage() {
  const [mode, setMode] = useState<'balance' | 'position' | 'top-bottom' | 'random'>('balance');

  const result = useMemo(() => {
    if (mode === 'position') return balancePosition(samplePlayers, 'attack');
    if (mode === 'top-bottom') return topVsBottom(samplePlayers);
    if (mode === 'random') return randomBalance(samplePlayers);
    return balanceTotal(samplePlayers);
  }, [mode]);

  return (
    <section className="card">
      <h1>팀구성</h1>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setMode('balance')} style={{ fontWeight: mode === 'balance' ? 700 : 400 }}>
          밸런스
        </button>
        <button onClick={() => setMode('position')} style={{ fontWeight: mode === 'position' ? 700 : 400 }}>
          포지션
        </button>
        <button onClick={() => setMode('top-bottom')} style={{ fontWeight: mode === 'top-bottom' ? 700 : 400 }}>
          상/하위
        </button>
        <button onClick={() => setMode('random')} style={{ fontWeight: mode === 'random' ? 700 : 400 }}>
          랜덤
        </button>
      </div>

      <p style={{ marginTop: 10 }}>
        점수 합: A {result.teamATotal.toFixed(1)} / B {result.teamBTotal.toFixed(1)} / 격차 {result.gap.toFixed(1)}
      </p>

      <div style={{ marginTop: 10, display: 'grid', gap: 12 }}>
        <div>
          <h2>청팀</h2>
          <ul className="check-list">
            {result.teamA.map((player) => (
              <li key={player.userId}>
                {player.userId} / {player.total}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>홍팀</h2>
          <ul className="check-list">
            {result.teamB.map((player) => (
              <li key={player.userId}>
                {player.userId} / {player.total}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
