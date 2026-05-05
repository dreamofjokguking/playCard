'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type MeResponse = {
  actorId: string;
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

type ClubDetail = {
  _id: string;
  name: string;
  ownerId: string;
  managers?: string[];
  pendingApplications?: Array<{ userId: string }>;
};

const ROLE_LABEL: Record<string, string> = {
  service_admin: '서비스 관리자',
  admin: '클럽 관리자',
  member: '멤버',
  pending: '승인 대기'
};

export default function AdminPage() {
  const params = useParams<{ id: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [me, setMe] = useState<MeResponse | null>(null);
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [meRes, clubRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch(`/api/club-rooms/${params.id}`, { cache: 'no-store' })
        ]);
        const meJson = (await meRes.json()) as { success: boolean; data?: MeResponse; message?: string };
        const clubJson = (await clubRes.json()) as { success: boolean; data?: ClubDetail };
        if (!active) return;
        if (!meRes.ok || !meJson.success || !meJson.data) {
          setMessage(meJson.message || '권한 정보를 불러오지 못했습니다.');
          return;
        }
        setMe(meJson.data);
        if (clubRes.ok && clubJson.success && clubJson.data) {
          setClub(clubJson.data);
        }
      } catch {
        if (active) setMessage('정보를 불러오지 못했습니다.');
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id]);

  const isOwner = !!(me && club && club.ownerId === me.actorId);
  const isManager = !!(me && club && (club.managers ?? []).includes(me.actorId));
  const clubRoleLabel = me?.isServiceAdmin
    ? '서비스 관리자'
    : isOwner
      ? '클럽 오너'
      : isManager
        ? '클럽 매니저'
        : me
          ? ROLE_LABEL[me.role] ?? me.role
          : '확인 중';

  const pendingCount = club?.pendingApplications?.length ?? 0;

  return (
    <>
      <section className="card">
        <h1>관리</h1>
        <p>
          이 클럽에서의 권한: <strong>{clubRoleLabel}</strong>
        </p>
        <div className="pc-stack">
          {me?.isServiceAdmin ? <div className="quick-link">서비스 관리자: 전체 클럽 조회/운영 관리 가능</div> : null}
          {isOwner ? <div className="quick-link">클럽 오너: 멤버 승인, 매니저 지정, 경기 관리 모두 가능</div> : null}
          {isManager ? <div className="quick-link">클럽 매니저: 경기 관리 + 멤버 승인 가능</div> : null}
          {!me?.isServiceAdmin && !isOwner && !isManager ? (
            <div className="quick-link">이 클럽의 운영 권한이 없습니다.</div>
          ) : null}
        </div>
      </section>

      {pendingCount > 0 ? (
        <section className="card" style={{ borderColor: 'var(--pc-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <strong>가입 신청 {pendingCount}건이 대기 중입니다</strong>
              <p className="pc-meta" style={{ marginTop: 4 }}>
                멤버 관리 페이지에서 승인 또는 거절할 수 있습니다.
              </p>
            </div>
            <Link href={`${clubBase}/admin/members`} className="pc-button pc-button-primary">
              신청 확인 →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>관리 작업</h2>
        <div className="pc-admin-actions">
          <Link href={`${clubBase}/admin/matches`} className="pc-pill is-active">
            경기 관리
          </Link>
          <Link href={`${clubBase}/admin/matches/new`} className="pc-pill">
            경기 생성
          </Link>
          <Link href={`${clubBase}/admin/members`} className="pc-pill" style={{ position: 'relative' }}>
            멤버 관리
            {pendingCount > 0 ? (
              <span
                className="pc-badge-dot"
                style={{ position: 'static', marginLeft: 6 }}
              >
                {pendingCount}
              </span>
            ) : null}
          </Link>
          <Link href={`${clubBase}/admin/positions`} className="pc-pill">
            평가 항목 관리
          </Link>
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
