'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MeResponse = {
  actorId: string;
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

export default function AdminPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json()) as { success: boolean; data?: MeResponse; message?: string };
        if (!res.ok || !json.success || !json.data) {
          setMessage(json.message || '권한 정보를 불러오지 못했습니다.');
          return;
        }
        setMe(json.data);
      })
      .catch(() => setMessage('권한 정보를 불러오지 못했습니다.'));
  }, []);

  const hasClubAdminAccess = (me?.managedClubRooms?.length ?? 0) > 0;

  return (
    <>
      <section className="card">
        <h1>관리</h1>
        <p>
          현재 권한: <strong>{me ? me.role : '확인 중'}</strong>
        </p>
        <div className="pc-stack">
          {me?.isServiceAdmin ? <div className="quick-link">서비스 관리자: 전체 클럽 조회/운영 관리 가능</div> : null}
          {hasClubAdminAccess ? (
            <div className="quick-link">클럽 관리자: 본인 관리 클럽의 경기 생성/수정 가능</div>
          ) : (
            <div className="quick-link">관리 가능한 클럽이 없습니다.</div>
          )}
        </div>
      </section>

      <section className="card">
        <h2>관리 작업</h2>
        <div className="pc-admin-actions">
          <Link href="/admin/matches" className="pc-pill is-active">
            경기 관리
          </Link>
          <Link href="/admin/matches/new" className="pc-pill">
            경기 생성
          </Link>
          <Link href="/admin/members" className="pc-pill">
            멤버 관리
          </Link>
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
