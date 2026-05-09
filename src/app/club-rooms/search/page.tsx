'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cloudinaryTransform } from '@/lib/cloudinaryTransform';

type ClubBrief = {
  _id: string;
  name: string;
  sportType?: string;
  category?: string;
  description?: string;
  coverImage?: string;
  ownerId?: string;
  managers?: string[];
};

type Me = { actorId: string; clubRoomId: string };

export default function ClubRoomSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rooms, setRooms] = useState<ClubBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [me, setMe] = useState<Me | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [meRes, listRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/club-rooms', { cache: 'no-store' })
        ]);
        const meJson = (await meRes.json()) as { success: boolean; data?: Me };
        const listJson = (await listRes.json()) as { success: boolean; data?: ClubBrief[]; message?: string };
        if (!active) return;
        if (meRes.ok && meJson.success && meJson.data) setMe(meJson.data);
        if (!listRes.ok || !listJson.success) {
          setMessage(listJson.message || '클럽 목록을 불러오지 못했습니다.');
          return;
        }
        setRooms(listJson.data ?? []);
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

  async function applyToClub(clubId: string) {
    setSubmitting(clubId);
    setMessage('');
    try {
      const res = await fetch(`/api/club-rooms/${clubId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '클럽 검색에서 가입 신청' })
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '가입 신청에 실패했습니다.');
        return;
      }
      setAppliedIds((prev) => new Set([...prev, clubId]));
      setMessage('가입 신청을 보냈습니다.');
    } finally {
      setSubmitting('');
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const room of rooms) {
      if (room.category) set.add(room.category);
    }
    return Array.from(set).sort();
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      if (categoryFilter && room.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        room.name.toLowerCase().includes(q) ||
        (room.category ?? '').toLowerCase().includes(q) ||
        (room.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [keyword, categoryFilter, rooms]);

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">CLUB SEARCH</div>
        <h1 className="pc-hero-title">클럽 검색</h1>
      </section>

      <section className="card">
        <input
          className="pc-field"
          placeholder="클럽 이름 / 카테고리로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        {categories.length > 0 ? (
          <div className="pc-pill-row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className={`pc-pill${categoryFilter === '' ? ' is-active' : ''}`}
              onClick={() => setCategoryFilter('')}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pc-pill${categoryFilter === cat ? ' is-active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>클럽 목록</h2>
        {loading ? <p>로딩 중...</p> : null}
        {!loading && filtered.length === 0 && !message ? <p className="pc-meta">검색 결과가 없습니다.</p> : null}
        <div className="pc-club-grid">
          {filtered.map((room) => {
            const isMine = me && (room.ownerId === me.actorId || (room.managers ?? []).includes(me.actorId));
            const alreadyMember = me?.clubRoomId === room._id;
            const applied = appliedIds.has(room._id);
            const submittingThis = submitting === room._id;
            const showApply = !isMine && !alreadyMember;
            return (
              <Link
                key={room._id}
                href={`/club-rooms/${room._id}/about`}
                className="pc-club-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {room.coverImage ? (
                  <div className="pc-club-card-cover">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cloudinaryTransform(room.coverImage, { width: 480, crop: 'fill' })}
                      alt={room.name}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="pc-club-card-cover pc-club-card-cover-placeholder">
                    <span>{(room.category || room.name).slice(0, 1)}</span>
                  </div>
                )}
                <div className="pc-club-card-body">
                  <div className="pc-club-card-head">
                    <strong>{room.name}</strong>
                    <span className="pc-meta">{room.category || room.sportType || ''}</span>
                  </div>
                  {room.description ? (
                    <p className="pc-club-card-desc">{room.description.slice(0, 120)}{room.description.length > 120 ? '...' : ''}</p>
                  ) : null}
                  <div className="pc-row" style={{ marginTop: 'auto' }}>
                    {showApply ? (
                      <button
                        type="button"
                        className="pc-button pc-button-primary"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          applyToClub(room._id);
                        }}
                        disabled={applied || submittingThis}
                      >
                        {applied ? '신청 완료' : submittingThis ? '신청 중...' : '가입 신청'}
                      </button>
                    ) : alreadyMember ? (
                      <span className="pc-pill is-active">내 클럽</span>
                    ) : isMine ? (
                      <span className="pc-pill is-active">운영 중</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {message ? <p className="pc-meta" style={{ marginTop: 12 }}>{message}</p> : null}
      </section>
    </>
  );
}
