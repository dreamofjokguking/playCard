'use client';

import { useEffect, useMemo, useState } from 'react';
import RadarChart from '@/components/ui/RadarChart';
import LineChart from '@/components/ui/LineChart';
import type { RadarPoint } from '@/components/ui/chartUtils';

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

const KOREAN_METRIC_LABELS: Record<string, string> = {
  attack: '공격',
  defense: '수비',
  toss: '토스',
  serve: '서브',
  pass: '패스',
  set: '세터'
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function metricLabel(key: string): string {
  return KOREAN_METRIC_LABELS[key] ?? key;
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

  const radarPoints = useMemo<RadarPoint[]>(() => {
    if (!data) return [];
    return data.metricAverages.map((metric) => ({
      metricKey: metric.metricKey,
      label: metricLabel(metric.metricKey),
      value: metric.avg
    }));
  }, [data]);

  const lineData = useMemo(() => {
    if (!data) return [];
    return data.timeline.map((row) => ({
      label: String(row.date).slice(5, 10),
      value: row.overall
    }));
  }, [data]);

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
        <h2>능력치</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <RadarChart points={radarPoints} />
        </div>
        <div className="pc-stack" style={{ marginTop: 4 }}>
          <div className="quick-link" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: 'var(--pc-accent)' }}>★ BEST</strong>
            <span style={{ fontWeight: 800 }}>
              {data.bestMetric ? `${metricLabel(data.bestMetric.metricKey)} ${data.bestMetric.avg}` : '-'}
            </span>
          </div>
          <div className="quick-link" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#60A5FA' }}>▼ NEED</strong>
            <span style={{ fontWeight: 800 }}>
              {data.worstMetric ? `${metricLabel(data.worstMetric.metricKey)} ${data.worstMetric.avg}` : '-'}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>성장 그래프</h2>
        {lineData.length > 0 ? (
          <LineChart data={lineData} />
        ) : (
          <p className="pc-meta">완료된 경기 데이터가 쌓이면 추이가 표시됩니다.</p>
        )}
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
                {row.metrics.map((metric) => `${metricLabel(metric.metricKey)} ${metric.avg}`).join(' · ') || '세부 지표 없음'}
              </div>
            </div>
          ))}
          {data.recentMatches.length === 0 ? <p>완료된 경기 데이터가 없습니다.</p> : null}
        </div>
      </section>
    </>
  );
}
