'use client';

import { useEffect, useMemo, useState } from 'react';

type ResultRow = {
  rank: number;
  userId: string;
  displayName: string;
  metricStats: { metricKey: string; avg: number; count: number }[];
  overall: number;
  absences: string[];
  mvpCount: number;
  comments: string[];
};

type ResultPayload = {
  viewerId: string;
  match: { _id: string; date: string; time: string; venue?: string };
  mvpUserId: string;
  playerStats: ResultRow[];
};

export default function EvaluationResultPage({ params }: { params: { matchId: string } }) {
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
  }, [params.matchId]);

  const podium = useMemo(() => data?.playerStats.slice(0, 3) ?? [], [data]);

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

  return (
    <>
      <section className="card">
        <h1>경기 결과</h1>
        <p>
          {String(data.match.date).slice(0, 10)} {data.match.time}
          {data.match.venue ? ` / ${data.match.venue}` : ''}
        </p>
      </section>

      {podium.length === 3 ? (
        <section className="pc-podium">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: 'var(--pc-accent)' }}>MVP PODIUM</div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800 }}>
            1위 {podium[0].displayName} · {podium[0].overall}
          </div>
          <div style={{ marginTop: 4, color: 'var(--pc-muted)', fontSize: 12 }}>
            2위 {podium[1].displayName} · 3위 {podium[2].displayName}
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>참여자 상세 결과</h2>
        <ul className="pc-list-reset pc-stack">
          {data.playerStats.map((row) => {
            const isMine = row.userId === data.viewerId;
            const isMvp = row.userId === data.mvpUserId;
            return (
              <li key={row.userId} className={`pc-result-item${isMine ? ' is-mine' : ''}${isMvp ? ' is-mvp' : ''}`}>
                <strong>
                  {row.rank}위 {row.displayName}
                </strong>{' '}
                / 종합 {row.overall}
                {isMvp ? ' / MVP' : ''}
                {isMine ? ' / 내 점수' : ''}
                <div style={{ marginTop: 4 }}>항목: {row.metricStats.map((metric) => `${metric.metricKey} ${metric.avg}`).join(', ') || '-'}</div>
                <div>결장: {row.absences.join(', ') || '-'}</div>
                <div>코멘트: {row.comments.join(' | ') || '-'}</div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
