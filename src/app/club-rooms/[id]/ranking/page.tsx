'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import RankRow from '@/components/ui/RankRow';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

type RankingRow = {
  rank: number;
  userId: string;
  displayName: string;
  currentTitle: string;
  score: number;
  mvpCount: number;
  matchCount: number;
  previousRank: number | null;
  title: string;
  rarity: Rarity;
};

type MatchOption = {
  _id: string;
  date: string;
  time: string;
  venue?: string;
};

const tabs = [
  { key: 'overall', label: '종합' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '수비' },
  { key: 'pass', label: '패스' }
];

const SEASON_ALL = '__season__';

export default function RankingPage() {
  const routeParams = useParams<{ id: string }>();
  const clubRoomId = routeParams.id;
  const [tab, setTab] = useState('overall');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [matchId, setMatchId] = useState<string>(SEASON_ALL);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 매치 목록 1회 로드 + 기본값을 가장 최근 매치로 설정
  useEffect(() => {
    let active = true;
    fetch(`/api/club-rooms/${encodeURIComponent(clubRoomId)}/matches`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; data?: MatchOption[] }) => {
        if (!active || !json.success) return;
        const list = json.data ?? [];
        setMatches(list);
        // 가장 최근 매치를 기본 선택. 매치 없으면 시즌 누적 유지.
        if (list.length > 0) setMatchId((prev) => (prev === SEASON_ALL ? list[0]._id : prev));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [clubRoomId]);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const search = new URLSearchParams();
      search.set('type', tab);
      search.set('clubRoomId', clubRoomId);
      if (matchId !== SEASON_ALL) search.set('matchId', matchId);
      const res = await fetch(`/api/rankings?${search.toString()}`, { cache: 'no-store' });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, matchId, clubRoomId]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const isMatchScope = matchId !== SEASON_ALL;

  return (
    <>
      <section className="card">
        <h1>순위</h1>
        <p>{isMatchScope ? '선택한 경기의 순위와 그 경기에 부여된 칭호' : '시즌 누적 점수와 현재 칭호'}를 확인하세요.</p>

        <label style={{ display: 'block', marginTop: 10 }}>
          <span className="pc-meta">기준 경기</span>
          <select
            className="pc-field"
            value={matchId}
            onChange={(event) => setMatchId(event.target.value)}
            style={{ marginTop: 6 }}
          >
            <option value={SEASON_ALL}>시즌 누적 (전체 완료 경기)</option>
            {matches.map((match) => (
              <option key={match._id} value={match._id}>
                {String(match.date).slice(0, 10)} {match.time}
                {match.venue ? ` · ${match.venue}` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="pc-pill-row">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`pc-pill${tab === item.key ? ' is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {podium.length > 0 ? (
        <section className="pc-podium">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: 'var(--pc-accent)' }}>
            {isMatchScope ? 'MATCH PODIUM' : 'SEASON PODIUM'}
          </div>
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
        <h2>{isMatchScope ? '경기 순위' : '전체 랭킹'}</h2>
        {loading ? <p style={{ marginTop: 10 }}>로딩 중...</p> : null}
        {!loading && rows.length === 0 ? <p style={{ marginTop: 10 }}>{message || '데이터가 없습니다.'}</p> : null}
        {!loading && rows.length > 0 ? (
          <div className="pc-stack">
            {rows.map((row) => (
              <RankRow
                key={row.userId}
                rank={row.rank}
                name={row.displayName}
                score={row.score}
                badge={`MVP ${row.mvpCount}`}
                previousRank={row.previousRank}
                title={row.title || undefined}
                rarity={row.rarity}
              />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
