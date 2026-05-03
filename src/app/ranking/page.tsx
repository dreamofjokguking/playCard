'use client';

import { useEffect, useState } from 'react';

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
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('순위를 불러오지 못했습니다.'));
  }, [tab]);

  return (
    <section className="card">
      <h1>순위</h1>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{ fontWeight: tab === item.key ? 700 : 400 }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ marginTop: 10 }}>로딩 중...</p> : null}
      {!loading && rows.length === 0 ? <p style={{ marginTop: 10 }}>{message || '데이터 없음'}</p> : null}

      <ul className="check-list" style={{ marginTop: 10 }}>
        {rows.map((row) => (
          <li key={row.userId}>
            <strong>
              {row.rank}위 {row.displayName}
            </strong>{' '}
            / 점수 {row.score} / MVP {row.mvpCount}
            {row.currentTitle ? <div>칭호: {row.currentTitle}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
