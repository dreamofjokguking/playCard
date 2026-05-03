'use client';

import { useEffect, useMemo, useState } from 'react';
import RankRow from '@/components/ui/RankRow';

type RankingRow = {
  rank: number;
  userId: string;
  displayName: string;
  currentTitle: string;
  score: number;
  mvpCount: number;
  matchCount: number;
};

const tabs = [
  { key: 'overall', label: '종합' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '수비' },
  { key: 'pass', label: '패스' }
];

export default function RankingPage() {
  const [tab, setTab] = useState('overall');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/rankings?type=${encodeURIComponent(tab)}`, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: RankingRow[]; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '순위를 불러오지 못했습니다.');
        return;
      }
      setRows(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('순위를 불러오지 못했습니다.'));
  }, [tab]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);

  return (
    <>
      <section className="card">
        <h1>순위</h1>
        <p>시즌 누적 점수와 포지션별 랭킹을 확인하세요.</p>
        <div className="pc-pill-row">
          {tabs.map((item) => (
            <button key={item.key} type="button" className={`pc-pill${tab === item.key ? ' is-active' : ''}`} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {podium.length > 0 ? (
        <section className="pc-podium">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: 'var(--pc-accent)' }}>SEASON PODIUM</div>
          <div className="pc-podium-stand">
            {[podium[1], podium[0], podium[2]].map((row, index) => {
              if (!row) return null;
              const rank = row.rank;
              const height = rank === 1 ? 84 : rank === 2 ? 62 : 48;
              const bg =
                rank === 1
                  ? 'linear-gradient(180deg,#ffe066,#f0a020)'
                  : rank === 2
                    ? 'linear-gradient(180deg,#94a3b8,#475569)'
                    : 'linear-gradient(180deg,#f59e0b,#7c2d12)';
              return (
                <div className="pc-podium-col" key={`${row.userId}-${index}`}>
                  <div className="pc-podium-name">{row.displayName}</div>
                  <div className="pc-podium-score">{row.score}</div>
                  <div className="pc-podium-bar" style={{ height, background: bg }}>
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>전체 랭킹</h2>
        {loading ? <p style={{ marginTop: 10 }}>로딩 중...</p> : null}
        {!loading && rows.length === 0 ? <p style={{ marginTop: 10 }}>{message || '데이터가 없습니다.'}</p> : null}
        {!loading && rows.length > 0 ? (
          <div className="pc-stack">
            {rows.map((row) => (
              <RankRow key={row.userId} rank={row.rank} name={row.displayName} score={row.score} badge={`MVP ${row.mvpCount}`} />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
