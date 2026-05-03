'use client';

import { useEffect, useState } from 'react';

type DashboardResponse = {
  user: { _id: string; displayName: string; currentTitle: string };
  timeline: Array<{ matchId: string; date: string; overall: number }>;
  metricAverages: Array<{ metricKey: string; avg: number }>;
  bestMetric: { metricKey: string; avg: number } | null;
  worstMetric: { metricKey: string; avg: number } | null;
  recentMatches: Array<{
    matchId: string;
    date: string;
    overall: number;
    metrics: Array<{ metricKey: string; avg: number }>;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meJson = (await meRes.json()) as { success: boolean; data?: { actorId: string }; message?: string };
      if (!meRes.ok || !meJson.success || !meJson.data?.actorId) {
        setMessage(meJson.message || '로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`/api/users/${meJson.data.actorId}/dashboard`, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: DashboardResponse; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '대시보드를 불러오지 못했습니다.');
        return;
      }
      setData(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('대시보드를 불러오지 못했습니다.'));
  }, []);

  if (loading) {
    return (
      <section className="card">
        <h1>대시보드</h1>
        <p>로딩 중...</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <h1>대시보드</h1>
        <p>{message || '데이터 없음'}</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>대시보드</h1>
      <p>
        {data.user.displayName} / 현재 칭호: {data.user.currentTitle || '-'}
      </p>
      <p style={{ marginTop: 6 }}>
        BEST: {data.bestMetric ? `${data.bestMetric.metricKey} ${data.bestMetric.avg}` : '-'} / NEED IMPROVEMENT:{' '}
        {data.worstMetric ? `${data.worstMetric.metricKey} ${data.worstMetric.avg}` : '-'}
      </p>

      <h2 style={{ marginTop: 12 }}>최근 경기</h2>
      <ul className="check-list">
        {data.recentMatches.map((row) => (
          <li key={row.matchId}>
            {String(row.date).slice(0, 10)} / 종합 {row.overall}
            <div>항목: {row.metrics.map((metric) => `${metric.metricKey} ${metric.avg}`).join(', ') || '-'}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
