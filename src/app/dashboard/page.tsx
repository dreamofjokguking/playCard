'use client';

import { useEffect, useMemo, useState } from 'react';

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('대시보드를 불러오지 못했습니다.'));
  }, []);

  const latest = useMemo(() => data?.timeline[data.timeline.length - 1], [data]);
  const expPercent = useMemo(() => {
    const score = latest?.overall ?? 0;
    return clamp(Math.round(score * 10), 0, 100);
  }, [latest]);

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
        <p>{message || '데이터가 없습니다.'}</p>
      </section>
    );
  }

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">오늘의 플레이어</div>
        <h1 className="pc-hero-title">{data.user.displayName}님, 경기 준비 완료</h1>
      </section>

      <section className="pc-player-card">
        <div className="pc-player-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pc-avatar">{data.user.displayName.slice(0, 1)}</span>
            <div>
              <div style={{ fontWeight: 800 }}>{data.user.displayName}</div>
              <div className="pc-meta">{data.user.currentTitle || '칭호 없음'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--pc-primary)' }}>{latest?.overall ?? '-'}</div>
            <div className="pc-meta">최근 점수</div>
          </div>
        </div>

        <div className="pc-exp">
          <div className="pc-progress-head">
            <span>다음 레벨까지</span>
            <span>{expPercent}%</span>
          </div>
          <div className="pc-progress-track">
            <div className="pc-progress-fill" style={{ width: `${expPercent}%` }} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>능력치 요약</h2>
        <div className="pc-stack">
          <div className="quick-link">
            <strong>BEST</strong>
            <div style={{ marginTop: 6, fontWeight: 800 }}>
              {data.bestMetric ? `${data.bestMetric.metricKey} ${data.bestMetric.avg}` : '-'}
            </div>
          </div>
          <div className="quick-link">
            <strong>보완 필요</strong>
            <div style={{ marginTop: 6, fontWeight: 800 }}>
              {data.worstMetric ? `${data.worstMetric.metricKey} ${data.worstMetric.avg}` : '-'}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>최근 경기</h2>
        <div className="pc-stack">
          {data.recentMatches.map((row) => (
            <div key={row.matchId} className="quick-link">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{String(row.date).slice(5, 10)}</strong>
                <span style={{ color: 'var(--pc-primary)', fontWeight: 800 }}>{row.overall}</span>
              </div>
              <div className="pc-meta" style={{ marginTop: 6 }}>
                {row.metrics.map((metric) => `${metric.metricKey} ${metric.avg}`).join(' · ') || '세부 지표 없음'}
              </div>
            </div>
          ))}
          {data.recentMatches.length === 0 ? <p>완료된 경기 데이터가 없습니다.</p> : null}
        </div>
      </section>
    </>
  );
}
