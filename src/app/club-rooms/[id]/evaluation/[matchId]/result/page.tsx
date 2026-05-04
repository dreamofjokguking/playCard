'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

type ResultRow = {
  rank: number;
  userId: string;
  displayName: string;
  metricStats: { metricKey: string; avg: number; count: number }[];
  overall: number;
  absences: string[];
  mvpCount: number;
  comments: string[];
  title?: string;
  rarity?: Rarity;
};

type ResultPayload = {
  viewerId: string;
  match: {
    _id: string;
    date: string;
    time: string;
    venue?: string;
    teamAssignments?: Array<{ userId: string; team: 'red' | 'blue' }>;
  };
  mvpUserId: string;
  isUnanimousMvp: boolean;
  evaluatorCount: number;
  playerStats: ResultRow[];
};

const KOREAN_METRIC_LABELS: Record<string, string> = {
  attack: '공격',
  defense: '수비',
  toss: '토스',
  serve: '서브',
  pass: '패스',
  set: '세터'
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설'
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#94A3B8',
  rare: '#60A5FA',
  epic: '#C084FC',
  legendary: '#FFE066'
};

function metricLabel(key: string): string {
  return KOREAN_METRIC_LABELS[key] ?? key;
}

export default function EvaluationResultPage() {
  const params = useParams<{ id: string; matchId: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [data, setData] = useState<ResultPayload | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/matches/${params.matchId}/results`, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; message?: string; data?: ResultPayload };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '경기 결과를 불러오지 못했습니다.');
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
    load().catch(() => setMessage('경기 결과를 불러오지 못했습니다.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.matchId]);

  // 메트릭 키 목록 (응답 첫 stat의 metricStats 순서 따라)
  const metricKeys = useMemo(() => {
    if (!data || data.playerStats.length === 0) return [];
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const stat of data.playerStats) {
      for (const metric of stat.metricStats) {
        if (!seen.has(metric.metricKey)) {
          seen.add(metric.metricKey);
          keys.push(metric.metricKey);
        }
      }
    }
    return keys;
  }, [data]);

  // 메트릭별 랭킹 (동률 같은 순위)
  const rankingsByMetric = useMemo(() => {
    if (!data) return new Map<string, Array<{ userId: string; displayName: string; avg: number; absent: boolean; rank: number }>>();
    const map = new Map<string, Array<{ userId: string; displayName: string; avg: number; absent: boolean; rank: number }>>();
    for (const metricKey of metricKeys) {
      const rows = data.playerStats.map((stat) => {
        const metric = stat.metricStats.find((m) => m.metricKey === metricKey);
        const absent = stat.absences.includes(metricKey) || !metric || metric.count === 0;
        return {
          userId: stat.userId,
          displayName: stat.displayName,
          avg: absent ? 0 : metric!.avg,
          absent
        };
      });
      // 출전자 우선 정렬, 결장은 뒤로. 점수 내림차순.
      rows.sort((a, b) => {
        if (a.absent !== b.absent) return a.absent ? 1 : -1;
        return b.avg - a.avg;
      });
      // 동률 같은 순위 (출전자만)
      let lastAvg: number | null = null;
      let lastRank = 0;
      const ranked = rows.map((row, index) => {
        if (row.absent) return { ...row, rank: 0 };
        if (lastAvg !== null && Math.abs(lastAvg - row.avg) < 1e-9) {
          return { ...row, rank: lastRank };
        }
        lastAvg = row.avg;
        lastRank = index + 1;
        return { ...row, rank: lastRank };
      });
      map.set(metricKey, ranked);
    }
    return map;
  }, [data, metricKeys]);

  if (loading) {
    return (
      <section className="card">
        <h1>경기 결과</h1>
        <p>로딩 중...</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <h1>경기 결과</h1>
        <p>{message || '결과 데이터가 없습니다.'}</p>
      </section>
    );
  }

  const dateStr = String(data.match.date).slice(0, 10);
  const mvp = data.playerStats.find((row) => row.userId === data.mvpUserId);
  const titledStats = data.playerStats.filter((row) => row.title && row.title.length > 0);
  const allComments = data.playerStats.flatMap((row) => row.comments);

  return (
    <>
      <section className="card">
        <h1>{dateStr} 경기 결과</h1>
        <p className="pc-meta">
          {data.match.time}
          {data.match.venue ? ` · ${data.match.venue}` : ''} · 평가자 {data.evaluatorCount}명
        </p>
        <div style={{ marginTop: 8 }}>
          <Link href={`${clubBase}/history`} className="pc-pill">
            히스토리 보기 →
          </Link>
        </div>
      </section>

      {mvp ? (
        <section
          className="card"
          style={{
            border: `2px solid ${data.isUnanimousMvp ? RARITY_COLOR.legendary : 'var(--pc-accent)'}`,
            background: data.isUnanimousMvp
              ? 'radial-gradient(120% 80% at 50% 0%, rgba(255,224,102,0.18), transparent 70%), var(--pc-surface)'
              : undefined
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: 'var(--pc-accent)' }}>
            {data.isUnanimousMvp ? '👑 만장일치 MVP · LEGENDARY' : '🏆 MVP'}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <strong style={{ fontSize: 18 }}>{mvp.displayName}</strong>
            <span className="pc-meta">
              MVP 표 {mvp.mvpCount}/{data.evaluatorCount}
            </span>
          </div>
          {data.isUnanimousMvp ? (
            <p className="pc-meta" style={{ marginTop: 6 }}>
              모든 평가자가 같은 사람을 MVP로 뽑았습니다. 전설 등급 자동 부여.
            </p>
          ) : null}
        </section>
      ) : null}

      {titledStats.length > 0 ? (
        <section className="card">
          <h2>오늘의 칭호</h2>
          <div className="pc-stack">
            {titledStats.map((stat) => {
              const rarity = (stat.rarity ?? 'common') as Rarity;
              const isMine = stat.userId === data.viewerId;
              return (
                <div
                  key={stat.userId}
                  className="quick-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    borderColor: RARITY_COLOR[rarity]
                  }}
                >
                  <div>
                    <strong>{stat.displayName}</strong>
                    {isMine ? <span className="pc-meta" style={{ marginLeft: 6 }}>(나)</span> : null}
                  </div>
                  <span style={{ color: RARITY_COLOR[rarity], fontWeight: 800, fontSize: 13 }}>
                    ⚡ {stat.title} · {RARITY_LABEL[rarity]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>메트릭별 순위</h2>
        <div className="pc-stack">
          {metricKeys.map((metricKey) => {
            const rows = rankingsByMetric.get(metricKey) ?? [];
            return (
              <div key={metricKey} style={{ border: '1px solid var(--pc-line)', borderRadius: 12, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 176, 32, 0.1)',
                    borderBottom: '1px solid var(--pc-line)',
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'var(--pc-primary-strong)'
                  }}
                >
                  {metricLabel(metricKey)}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1c2030', color: 'var(--pc-muted)' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', width: 48 }}>순위</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>이름</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', width: 80 }}>평균</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isMine = row.userId === data.viewerId;
                      return (
                        <tr
                          key={row.userId}
                          style={{
                            borderTop: '1px solid var(--pc-line)',
                            background: isMine ? 'rgba(255, 90, 54, 0.08)' : undefined
                          }}
                        >
                          <td style={{ padding: '6px 10px', fontWeight: 800 }}>{row.absent ? '-' : row.rank}</td>
                          <td style={{ padding: '6px 10px' }}>
                            {row.displayName}
                            {isMine ? <span className="pc-meta" style={{ marginLeft: 4 }}>(나)</span> : null}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
                            {row.absent ? <span className="pc-meta">결장</span> : row.avg.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      {allComments.length > 0 ? (
        <section className="card">
          <h2>한줄평</h2>
          <ul className="pc-list-reset pc-stack">
            {data.playerStats.map((row) =>
              row.comments.length > 0 ? (
                <li key={row.userId} className="quick-link">
                  <strong>{row.displayName}</strong>
                  <ul className="pc-meta" style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {row.comments.map((comment, index) => (
                      <li key={index}>{comment}</li>
                    ))}
                  </ul>
                </li>
              ) : null
            )}
          </ul>
        </section>
      ) : null}
    </>
  );
}
