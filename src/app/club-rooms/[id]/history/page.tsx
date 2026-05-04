'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MatchOption = { _id: string; date: string; time: string; venue?: string };

type HistoryCell = { matchId: string; avg: number | null; absent: boolean; delta: number | null };

type HistoryRow = {
  userId: string;
  displayName: string;
  metricKey: string;
  cells: HistoryCell[];
};

type HistoryResponse = {
  matches: MatchOption[];
  users: Array<{ _id: string; displayName: string }>;
  metricKeys: string[];
  rows: HistoryRow[];
};

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

function formatAvg(value: number | null): string {
  return value === null ? '결장' : value.toFixed(2);
}

function formatDelta(delta: number | null): { text: string; color: string } {
  if (delta === null || delta === 0) return { text: '0', color: 'var(--pc-muted)' };
  if (delta > 0) return { text: `▲${delta.toFixed(2)}`, color: '#F87171' };
  return { text: `▼${Math.abs(delta).toFixed(2)}`, color: '#60A5FA' };
}

export default function HistoryPage() {
  const params = useParams<{ id: string }>();
  const clubRoomId = params.id;
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterUserId, setFilterUserId] = useState<string>('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const res = await fetch(`/api/club-rooms/${encodeURIComponent(clubRoomId)}/history`, { cache: 'no-store' });
        const json = (await res.json()) as { success: boolean; data?: HistoryResponse; message?: string };
        if (!active) return;
        if (!res.ok || !json.success || !json.data) {
          setMessage(json.message || '히스토리를 불러오지 못했습니다.');
          return;
        }
        setData(json.data);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : '요청 실패');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [clubRoomId]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!filterUserId) return data.rows;
    return data.rows.filter((row) => row.userId === filterUserId);
  }, [data, filterUserId]);

  return (
    <>
      <section className="card">
        <h1>히스토리</h1>
        <p className="pc-meta">참여자별 메트릭 성적 추이와 직전 매치 대비 증감을 한눈에 확인할 수 있습니다.</p>
        <div style={{ marginTop: 8 }}>
          <Link href={`/club-rooms/${clubRoomId}`} className="pc-pill">
            ← 클럽 메인
          </Link>
        </div>
      </section>

      {loading ? (
        <section className="card">
          <p>로딩 중...</p>
        </section>
      ) : null}

      {!loading && message ? (
        <section className="card">
          <p>{message}</p>
        </section>
      ) : null}

      {!loading && data && data.matches.length === 0 ? (
        <section className="card">
          <p className="pc-meta">완료된 경기가 아직 없습니다.</p>
        </section>
      ) : null}

      {!loading && data && data.matches.length > 0 ? (
        <>
          <section className="card">
            <label style={{ display: 'block' }}>
              <span className="pc-meta">참여자 필터</span>
              <select
                className="pc-field"
                value={filterUserId}
                onChange={(event) => setFilterUserId(event.target.value)}
                style={{ marginTop: 6 }}
              >
                <option value="">전체</option>
                {data.users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        background: '#1c2030',
                        padding: '8px 12px',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--pc-line)',
                        minWidth: 180,
                        color: 'var(--pc-muted)'
                      }}
                    >
                      항목
                    </th>
                    {data.matches.map((match) => (
                      <th
                        key={match._id}
                        colSpan={2}
                        style={{
                          padding: '6px 8px',
                          textAlign: 'center',
                          background: '#1c2030',
                          borderBottom: '1px solid var(--pc-line)',
                          borderLeft: '1px solid var(--pc-line)',
                          color: 'var(--pc-muted)',
                          fontSize: 11,
                          minWidth: 120
                        }}
                      >
                        {String(match.date).slice(0, 10)}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        background: '#1c2030',
                        padding: '4px 12px',
                        borderBottom: '1px solid var(--pc-line)'
                      }}
                    />
                    {data.matches.flatMap((match) => [
                      <Cell key={`avg-${match._id}`} headerLeft>평균</Cell>,
                      <Cell key={`del-${match._id}`}>증감</Cell>
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`${row.userId}|${row.metricKey}`} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                      <td
                        style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          background: '#262b40',
                          padding: '6px 12px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {row.displayName}님의 {metricLabel(row.metricKey)} 성적
                      </td>
                      {row.cells.flatMap((cell) => {
                        const delta = formatDelta(cell.delta);
                        return [
                          <td
                            key={`avg-${cell.matchId}`}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'center',
                              borderLeft: '1px solid var(--pc-line)',
                              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                              color: cell.absent ? 'var(--pc-muted)' : undefined
                            }}
                          >
                            {formatAvg(cell.avg)}
                          </td>,
                          <td
                            key={`delta-${cell.matchId}`}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'center',
                              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                              color: delta.color,
                              fontSize: 11
                            }}
                          >
                            {cell.absent ? '-' : delta.text}
                          </td>
                        ];
                      })}
                    </tr>
                  ))}
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={1 + data.matches.length * 2} style={{ padding: 16, textAlign: 'center', color: 'var(--pc-muted)' }}>
                        표시할 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

function Cell({ children, headerLeft }: { children: React.ReactNode; headerLeft?: boolean }) {
  return (
    <th
      style={{
        padding: '4px 8px',
        textAlign: 'center',
        background: '#161a26',
        borderBottom: '1px solid var(--pc-line)',
        borderLeft: headerLeft ? '1px solid var(--pc-line)' : undefined,
        color: 'var(--pc-muted)',
        fontSize: 11,
        fontWeight: 600
      }}
    >
      {children}
    </th>
  );
}
