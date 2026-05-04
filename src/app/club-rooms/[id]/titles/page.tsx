'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

type TitlesResponse = {
  user: { _id: string; displayName: string; currentTitle: string; currentRarity: Rarity };
  titleHistory: Array<{ title: string; matchId: string; rarity: Rarity; createdAt: string }>;
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

type Filter = 'all' | Rarity;

export default function TitlesPage() {
  const params = useParams<{ id: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [data, setData] = useState<TitlesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (meRes.status === 401) {
          if (active) setMessage('로그인이 필요합니다.');
          return;
        }
        const meJson = (await meRes.json()) as { success: boolean; data?: { actorId: string } };
        const actorId = meJson.data?.actorId;
        if (!actorId) {
          if (active) setMessage('로그인이 필요합니다.');
          return;
        }
        const res = await fetch(`/api/users/${actorId}/titles`, { cache: 'no-store' });
        const json = (await res.json()) as { success: boolean; data?: TitlesResponse; message?: string };
        if (!active) return;
        if (!res.ok || !json.success || !json.data) {
          setMessage(json.message || '칭호 도감을 불러오지 못했습니다.');
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
  }, []);

  const counts = useMemo(() => {
    const map: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (const entry of data?.titleHistory ?? []) {
      map[entry.rarity] = (map[entry.rarity] ?? 0) + 1;
    }
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    const list = data?.titleHistory ?? [];
    if (filter === 'all') return list;
    return list.filter((entry) => entry.rarity === filter);
  }, [data, filter]);

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">TITLE COLLECTION</div>
        <h1 className="pc-hero-title">{data?.user.displayName ?? '내'}의 칭호 도감</h1>
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

      {!loading && data ? (
        <>
          <section className="card">
            <h2>현재 칭호</h2>
            {data.user.currentTitle ? (
              <div
                className="quick-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  borderColor: RARITY_COLOR[data.user.currentRarity],
                  background: 'rgba(255,255,255,0.04)'
                }}
              >
                <strong style={{ color: RARITY_COLOR[data.user.currentRarity], fontSize: 16 }}>
                  ⚡ {data.user.currentTitle}
                </strong>
                <span className="pc-meta">{RARITY_LABEL[data.user.currentRarity]}</span>
              </div>
            ) : (
              <p className="pc-meta">아직 부여된 칭호가 없습니다. 평가가 완료되면 자동으로 칭호가 부여됩니다.</p>
            )}
          </section>

          <section className="card">
            <h2>등급별 보유</h2>
            <div className="pc-pill-row">
              <button className={`pc-pill${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>
                전체 {data.titleHistory.length}
              </button>
              {(['legendary', 'epic', 'rare', 'common'] as Rarity[]).map((rarity) => (
                <button
                  key={rarity}
                  className={`pc-pill${filter === rarity ? ' is-active' : ''}`}
                  onClick={() => setFilter(rarity)}
                  style={{
                    color: filter === rarity ? undefined : RARITY_COLOR[rarity],
                    borderColor: filter === rarity ? undefined : RARITY_COLOR[rarity]
                  }}
                >
                  {RARITY_LABEL[rarity]} {counts[rarity]}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>역대 칭호</h2>
            {filtered.length === 0 ? (
              <p className="pc-meta">해당 등급의 칭호가 아직 없습니다.</p>
            ) : (
              <ul className="pc-list-reset pc-stack">
                {filtered.map((entry) => (
                  <li
                    key={`${entry.matchId}-${entry.createdAt}`}
                    className="quick-link"
                    style={{ borderColor: RARITY_COLOR[entry.rarity] }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ color: RARITY_COLOR[entry.rarity] }}>⚡ {entry.title}</strong>
                      <span className="pc-meta">{RARITY_LABEL[entry.rarity]}</span>
                    </div>
                    <div className="pc-meta" style={{ marginTop: 4 }}>
                      {new Date(entry.createdAt).toLocaleString('ko-KR')}
                      {' · '}
                      <Link href={`${clubBase}/evaluation/${entry.matchId}/result`} style={{ textDecoration: 'underline' }}>
                        그 경기 결과 보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
