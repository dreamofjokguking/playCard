'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ClubBrief = { _id: string; name: string };
type MeResponse = {
  actorId: string;
  displayName: string;
  primaryClubRoom: ClubBrief | null;
  managedClubRooms: ClubBrief[];
};

export default function HomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!active) return;
        if (res.status === 401) {
          setUnauthenticated(true);
          return;
        }
        const json = (await res.json()) as { success: boolean; data?: MeResponse };
        if (json.success && json.data) setMe(json.data);
      } catch {
        // 실패는 비로그인 취급
        if (active) setUnauthenticated(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const clubs: ClubBrief[] = (() => {
    if (!me) return [];
    const list: ClubBrief[] = [];
    if (me.primaryClubRoom) list.push(me.primaryClubRoom);
    for (const room of me.managedClubRooms) {
      if (!list.some((c) => c._id === room._id)) list.push(room);
    }
    return list;
  })();

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">PLAYCARD</div>
        <h1 className="pc-hero-title">
          {me ? `${me.displayName}님, 어느 클럽으로 갈까요?` : 'PlayCard에 오신 것을 환영합니다'}
        </h1>
      </section>

      {unauthenticated ? (
        <section className="card">
          <h2>로그인이 필요해요</h2>
          <p>로그인하면 가입한 클럽으로 이동해 능력치 카드와 성장 그래프를 볼 수 있습니다.</p>
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

      {!loading && me && clubs.length > 0 ? (
        <section className="card">
          <h2>내 클럽</h2>
          <div className="pc-stack">
            {clubs.map((club) => (
              <Link key={club._id} href={`/club-rooms/${club._id}`} className="quick-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <strong>{club.name}</strong>
                <span className="pc-meta">진입 →</span>
              </Link>
            ))}
          </div>
          <p className="pc-meta" style={{ marginTop: 10 }}>
            클럽 카드를 누르면 그 클럽의 능력치/성장/순위/평가 진행 상황을 한 화면에서 볼 수 있습니다.
          </p>
        </section>
      ) : null}

      {!loading && me && clubs.length === 0 ? (
        <section className="card">
          <h2>참여 중인 클럽이 없어요</h2>
          <p>관리자에게 클럽 가입 승인을 요청하거나, 신규 클럽을 만들어 시작할 수 있습니다.</p>
          <div className="pc-row" style={{ marginTop: 10 }}>
            <Link href="/club-rooms" className="pc-button">
              클럽 관리/생성
            </Link>
            <Link href="/admin/members" className="pc-button">
              멤버 가입 신청 보기
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
