'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cloudinaryTransform } from '@/lib/cloudinaryTransform';

type ClubDetail = {
  _id: string;
  name: string;
  sportType?: string;
  category?: string;
  description?: string;
  coverImage?: string;
  ownerId: string;
  managers?: string[];
  pendingApplications?: Array<{ userId: string }>;
};

type Me = { actorId: string; clubRoomId: string };

export default function ClubAboutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [clubRes, meRes] = await Promise.all([
          fetch(`/api/club-rooms/${params.id}`, { cache: 'no-store' }),
          fetch('/api/auth/me', { cache: 'no-store' })
        ]);
        const clubJson = (await clubRes.json()) as { success: boolean; data?: ClubDetail; message?: string };
        const meJson = (await meRes.json()) as { success: boolean; data?: Me };
        if (!active) return;
        if (!clubRes.ok || !clubJson.success || !clubJson.data) {
          setMessage(clubJson.message || '클럽 정보를 불러오지 못했습니다.');
          return;
        }
        setClub(clubJson.data);
        if (meRes.ok && meJson.success && meJson.data) {
          setMe(meJson.data);
          const alreadyApplied = (clubJson.data.pendingApplications ?? []).some(
            (app) => app.userId === meJson.data!.actorId
          );
          setApplied(alreadyApplied);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load().catch(() => setMessage('클럽 정보를 불러오지 못했습니다.'));
    return () => {
      active = false;
    };
  }, [params.id]);

  async function applyToClub() {
    if (!club) return;
    if (!me) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`/api/club-rooms/${club._id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '클럽 소개에서 가입 신청' })
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '가입 신청에 실패했습니다.');
        return;
      }
      setApplied(true);
      setMessage('가입 신청을 보냈습니다. 클럽 운영자가 승인하면 알림이 옵니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <p>클럽 정보를 불러오는 중...</p>
      </section>
    );
  }

  if (!club) {
    return (
      <section className="card">
        <h1>클럽을 찾을 수 없습니다</h1>
        <p className="pc-meta">{message || '존재하지 않거나 비공개 클럽일 수 있습니다.'}</p>
        <Link href="/club-rooms/search" className="pc-pill">
          ← 클럽 검색으로
        </Link>
      </section>
    );
  }

  const isOwner = me?.actorId === club.ownerId;
  const isManager = (club.managers ?? []).includes(me?.actorId ?? '');
  const isMember = me?.clubRoomId === club._id;
  const showApplyButton = me && !isOwner && !isManager && !isMember;

  return (
    <>
      <section className="card pc-club-about">
        {club.coverImage ? (
          <div className="pc-club-about-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryTransform(club.coverImage, { width: 1024, crop: 'fill' })}
              alt={club.name}
            />
          </div>
        ) : (
          <div className="pc-club-about-cover pc-club-card-cover-placeholder">
            <span>{(club.category || club.name).slice(0, 1)}</span>
          </div>
        )}
        <div style={{ padding: '16px 0 0' }}>
          <div className="pc-pill-row" style={{ marginTop: 0 }}>
            <span className="pc-pill is-active">{club.category || club.sportType || '클럽'}</span>
          </div>
          <h1 style={{ marginTop: 8, marginBottom: 4 }}>{club.name}</h1>
        </div>
      </section>

      <section className="card">
        <h2>클럽 소개</h2>
        {club.description ? (
          <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: 'var(--pc-ink)' }}>
            {club.description}
          </p>
        ) : (
          <p className="pc-meta">아직 소개 글이 등록되지 않았습니다.</p>
        )}
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <strong>이 클럽에 합류하시겠어요?</strong>
            <p className="pc-meta" style={{ marginTop: 4 }}>
              운영자가 가입을 승인하면 평가, 순위, 일정 등 모든 클럽 활동에 참여할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="pc-row" style={{ marginTop: 12 }}>
          {!me ? (
            <Link href="/login" className="pc-button pc-button-primary">
              로그인 후 신청
            </Link>
          ) : isMember ? (
            <Link href={`/club-rooms/${club._id}`} className="pc-button pc-button-primary">
              내 클럽으로 이동
            </Link>
          ) : isOwner || isManager ? (
            <Link href={`/club-rooms/${club._id}`} className="pc-button pc-button-primary">
              운영 페이지로
            </Link>
          ) : showApplyButton ? (
            <button
              type="button"
              className="pc-button pc-button-primary"
              onClick={() => applyToClub()}
              disabled={applied || submitting}
            >
              {applied ? '신청 완료 — 승인 대기' : submitting ? '신청 중...' : '가입 신청'}
            </button>
          ) : null}
          <Link href="/club-rooms/search" className="pc-button">
            다른 클럽 보기
          </Link>
        </div>
        {message ? <p className="pc-meta" style={{ marginTop: 10 }}>{message}</p> : null}
      </section>
    </>
  );
}
