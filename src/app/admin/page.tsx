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
    <section className="card">
      <h1>관리</h1>
      <p>
        서비스 관리자와 클럽 관리자의 기능을 분리합니다. 현재 권한:
        <strong>{me ? ` ${me.role}` : ' 확인 중'}</strong>
      </p>
      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {me?.isServiceAdmin ? <p>서비스 관리자 기능: 전체 클럽 조회/운영 관리 가능</p> : null}
        {hasClubAdminAccess ? (
          <p>클럽 관리자 기능: 본인이 관리하는 클럽 경기만 생성/수정 가능</p>
        ) : (
          <p>클럽 관리자 기능: 현재 관리 가능한 클럽이 없습니다.</p>
        )}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
        <Link href="/admin/matches">경기 관리</Link>
        <Link href="/admin/matches/new">경기 생성</Link>
      </div>
      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
    </section>
  );
}
