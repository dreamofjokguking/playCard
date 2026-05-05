'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import RadarChart from '@/components/ui/RadarChart';
import LineChart from '@/components/ui/LineChart';
import PlayerCard, { type Rarity } from '@/components/ui/PlayerCard';
import type { RadarPoint } from '@/components/ui/chartUtils';

type DashboardResponse = {
  user: { _id: string; displayName: string; currentTitle: string; currentRarity?: Rarity };
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

type RankingRow = {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  mvpCount: number;
};

type CurrentEvaluationData = {
  match: {
    _id: string;
    participants: string[];
    evaluationsSubmitted: string[];
    clubRoomId?: string;
  };
} | null;

const KOREAN_METRIC_LABELS: Record<string, string> = {
  attack: '공격',
  defense: '수비',
  toss: '토스',
  serve: '서브',
  pass: '패스',
  set: '세터'
};

function metricLabel(key: string): string {
  return KOREAN_METRIC_LABELS[key] ?? key;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function ClubRoomMainPage({ params }: { params: { id: string } }) {
  const clubRoomId = params.id;
  const [actorId, setActorId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [currentEval, setCurrentEval] = useState<CurrentEvaluationData>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function loadAll() {
      setLoading(true);
      setMessage('');
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        const meJson = (await meRes.json()) as { success: boolean; data?: { actorId: string } };
        const id = meJson.data?.actorId ?? null;
        if (!active) return;
        setActorId(id);

        const rankRes = await fetch('/api/rankings?type=overall', { cache: 'no-store' });
        if (rankRes.ok) {
          const rankJson = (await rankRes.json()) as { success: boolean; data?: RankingRow[] };
          if (active) setRanking(rankJson.data ?? []);
        }

        if (id) {
          const [dashRes, evalRes] = await Promise.all([
            fetch(`/api/users/${id}/dashboard`, { cache: 'no-store' }),
            fetch('/api/evaluations/current', { cache: 'no-store' })
          ]);
          if (dashRes.ok) {
            const dashJson = (await dashRes.json()) as { success: boolean; data?: DashboardResponse };
            if (active && dashJson.success && dashJson.data) setDashboard(dashJson.data);
          }
          if (evalRes.ok) {
            const evalJson = (await evalRes.json()) as { success: boolean; data?: CurrentEvaluationData };
            if (active && evalJson.success) setCurrentEval(evalJson.data ?? null);
          }
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAll();
    return () => {
      active = false;
    };
  }, [clubRoomId]);

  const radarPoints = useMemo<RadarPoint[]>(() => {
    if (!dashboard) return [];
    return dashboard.metricAverages.map((metric) => ({
      metricKey: metric.metricKey,
      label: metricLabel(metric.metricKey),
      value: metric.avg
    }));
  }, [dashboard]);

  const lineData = useMemo(
    () =>
      dashboard?.timeline.map((row) => ({
        label: String(row.date).slice(5, 10),
        value: row.overall
      })) ?? [],
    [dashboard]
  );

  const latest = useMemo(() => dashboard?.timeline[dashboard.timeline.length - 1], [dashboard]);
  const expPercent = useMemo(() => clamp(Math.round((latest?.overall ?? 0) * 10), 0, 100), [latest]);

  const podium = useMemo(() => ranking.slice(0, 3), [ranking]);
  const meRanking = useMemo(() => ranking.find((row) => row.userId === actorId) ?? null, [ranking, actorId]);

  const evalProgress = useMemo(() => {
    if (!currentEval?.match) return null;
    const matchClubId = currentEval.match.clubRoomId ?? '';
    if (matchClubId && matchClubId !== clubRoomId) return null;
    const total = currentEval.match.participants.length;
    const done = currentEval.match.evaluationsSubmitted.length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [currentEval, clubRoomId]);

  return (
    <>
      {actorId && evalProgress ? (
        <section className="pc-banner-card">
          <div>
            <div className="pc-banner-meta">
              평가 진행중 · {evalProgress.done}/{evalProgress.total}명 제출
            </div>
            <div className="pc-banner-title">지금 평가 시작하기</div>
          </div>
          <Link href={`/club-rooms/${clubRoomId}/evaluation`} className="pc-button pc-button-primary">
            이동
          </Link>
        </section>
      ) : null}

      {!actorId && !loading ? (
        <section className="card">
          <h2>로그인하면 더 많은 정보가 보여요</h2>
          <p>능력치 카드와 성장 그래프, 최근 경기 기록은 로그인 후 표시됩니다.</p>
          <div style={{ marginTop: 10 }}>
            <Link href="/login" className="pc-button pc-button-primary">
              로그인 하러 가기
            </Link>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="card">
          <p>로딩 중...</p>
        </section>
      ) : null}

      {!loading && actorId && dashboard ? (
        <>
          <PlayerCard
            displayName={dashboard.user.displayName}
            rarity={dashboard.user.currentRarity ?? 'common'}
            title={dashboard.user.currentTitle || undefined}
            level={Math.max(1, dashboard.recentMatches.length)}
            overall={latest?.overall}
            variant="compact"
          />
          <section className="card">
            <div className="pc-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="pc-meta">EXP · 다음 레벨까지 {expPercent}%</span>
              <div className="pc-row" style={{ gap: 12 }}>
                <Link href={`/club-rooms/${clubRoomId}/titles`} className="pc-meta" style={{ textDecoration: 'underline' }}>
                  도감
                </Link>
                <Link href={`/club-rooms/${clubRoomId}/history`} className="pc-meta" style={{ textDecoration: 'underline' }}>
                  히스토리
                </Link>
              </div>
            </div>
            <div className="pc-progress-track" style={{ marginTop: 6 }}>
              <div className="pc-progress-fill" style={{ width: `${expPercent}%` }} />
            </div>
          </section>

          <section className="card">
            <h2>능력치</h2>
            {radarPoints.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <RadarChart points={radarPoints} />
              </div>
            ) : (
              <p className="pc-meta">아직 능력치 데이터가 없습니다.</p>
            )}
            <div className="pc-stack" style={{ marginTop: 4 }}>
              <div
                className="quick-link"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <strong style={{ color: 'var(--pc-accent)' }}>★ BEST</strong>
                <span style={{ fontWeight: 800 }}>
                  {dashboard.bestMetric ? `${metricLabel(dashboard.bestMetric.metricKey)} ${dashboard.bestMetric.avg}` : '-'}
                </span>
              </div>
              <div
                className="quick-link"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <strong style={{ color: '#60A5FA' }}>▼ NEED</strong>
                <span style={{ fontWeight: 800 }}>
                  {dashboard.worstMetric
                    ? `${metricLabel(dashboard.worstMetric.metricKey)} ${dashboard.worstMetric.avg}`
                    : '-'}
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
              {dashboard.recentMatches.map((row) => (
                <div key={row.matchId} className="quick-link">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{String(row.date).slice(5, 10)}</strong>
                    <span style={{ color: 'var(--pc-primary)', fontWeight: 800 }}>{row.overall}</span>
                  </div>
                  <div className="pc-meta" style={{ marginTop: 6 }}>
                    {row.metrics.map((metric) => `${metricLabel(metric.metricKey)} ${metric.avg}`).join(' · ') ||
                      '세부 지표 없음'}
                  </div>
                </div>
              ))}
              {dashboard.recentMatches.length === 0 ? <p>완료된 경기 데이터가 없습니다.</p> : null}
            </div>
          </section>
        </>
      ) : null}

      {!loading && podium.length > 0 ? (
        <section className="pc-podium">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: 'var(--pc-accent)' }}>
            SEASON PODIUM
          </div>
          <div className="pc-podium-stand">
            {[podium[1], podium[0], podium[2]].map((row, index) => {
              if (!row) return null;
              const rank = row.rank;
              const height = rank === 1 ? 84 : rank === 2 ? 62 : 48;
              const bg =
                rank === 1
                  ? 'linear-gradient(180deg, var(--pc-accent), var(--pc-accent-deep))'
                  : rank === 2
                    ? 'linear-gradient(180deg, var(--pc-podium-silver), #475569)'
                    : 'linear-gradient(180deg, #f59e0b, var(--pc-podium-bronze))';
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
          {meRanking ? (
            <p className="pc-meta" style={{ marginTop: 10, textAlign: 'center' }}>
              내 시즌 순위: <strong>{meRanking.rank}위</strong> · 평균 {meRanking.score}
            </p>
          ) : null}
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <Link href={`/club-rooms/${clubRoomId}/ranking`} className="pc-pill">
              전체 순위 보기
            </Link>
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="pc-meta" style={{ marginTop: 4 }}>
          {message}
        </p>
      ) : null}
    </>
  );
}
