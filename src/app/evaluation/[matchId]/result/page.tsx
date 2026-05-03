'use client';

import { useEffect, useState } from 'react';

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
        setMessage(json.message || '결과를 불러오지 못했습니다.');
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
    load().catch(() => setMessage('결과를 불러오지 못했습니다.'));
  }, [params.matchId]);

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
    <section className="card">
      <h1>경기 결과</h1>
      <p>
        {String(data.match.date).slice(0, 10)} {data.match.time} {data.match.venue ? `/ ${data.match.venue}` : ''}
      </p>
      <ul className="check-list" style={{ marginTop: 10 }}>
        {data.playerStats.map((row) => {
          const isMine = row.userId === data.viewerId;
          const isMvp = row.userId === data.mvpUserId;
          return (
            <li
              key={row.userId}
              style={{
                border: isMvp ? '2px solid #f59e0b' : isMine ? '2px solid #2563eb' : '1px solid #ddd',
                borderRadius: 8,
                padding: 10,
                background: isMine ? '#eff6ff' : '#fff'
              }}
            >
              <strong>
                {row.rank}위 {row.displayName}
              </strong>{' '}
              / 종합 {row.overall}
              {isMvp ? ' / MVP' : ''}
              {isMine ? ' / 내 점수' : ''}
              <div style={{ marginTop: 4 }}>
                항목: {row.metricStats.map((metric) => `${metric.metricKey} ${metric.avg}`).join(', ') || '-'}
              </div>
              <div>결장: {row.absences.join(', ') || '-'}</div>
              <div>한줄평: {row.comments.join(' | ') || '-'}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

