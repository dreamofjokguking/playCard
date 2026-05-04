'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ClubBrief = { _id: string; name: string; sportType?: string };

export default function ClubRoomSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [rooms, setRooms] = useState<ClubBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/club-rooms', { cache: 'no-store' });
        const json = (await res.json()) as { success: boolean; data?: ClubBrief[]; message?: string };
        if (!active) return;
        if (!res.ok || !json.success) {
          setMessage(json.message || '클럽 목록을 불러오지 못했습니다.');
          return;
        }
        setRooms(json.data ?? []);
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

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) => room.name.toLowerCase().includes(q));
  }, [keyword, rooms]);

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">CLUB SEARCH</div>
        <h1 className="pc-hero-title">클럽 검색</h1>
      </section>

      <section className="card">
        <input
          className="pc-field"
          placeholder="클럽 이름으로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <p className="pc-meta" style={{ marginTop: 6 }}>
          공개된 모든 클럽이 표시됩니다. 가입 신청은 향후 기능으로 추가 예정입니다.
        </p>
      </section>

      <section className="card">
        <h2>클럽 목록</h2>
        {loading ? <p>로딩 중...</p> : null}
        {!loading && message ? <p className="pc-meta">{message}</p> : null}
        {!loading && filtered.length === 0 && !message ? <p className="pc-meta">검색 결과가 없습니다.</p> : null}
        <div className="pc-stack">
          {filtered.map((room) => (
            <Link
              key={room._id}
              href={`/club-rooms/${room._id}`}
              className="quick-link"
              style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}
            >
              <strong>{room.name}</strong>
              <span className="pc-meta">{room.sportType || ''}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
