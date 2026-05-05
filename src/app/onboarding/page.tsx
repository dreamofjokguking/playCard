'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Me = {
  actorId: string;
  nickname: string;
  displayName: string;
  needsOnboarding: boolean;
  primaryClubRoom: { _id: string; name: string } | null;
};

type ClubBrief = {
  _id: string;
  name: string;
  category?: string;
  sportType?: string;
  description?: string;
  coverImage?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [me, setMe] = useState<Me | null>(null);
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [keyword, setKeyword] = useState('');
  const [clubs, setClubs] = useState<ClubBrief[]>([]);
  const [appliedClubId, setAppliedClubId] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: Me };
      if (!active) return;
      if (!res.ok || !json.success || !json.data) {
        router.replace('/login');
        return;
      }
      if (!json.data.needsOnboarding) {
        router.replace('/');
        return;
      }
      setMe(json.data);
      setNickname(json.data.nickname || json.data.displayName || '');
    }
    load().catch(() => router.replace('/login'));
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (step !== 2) return;
    let active = true;
    async function load() {
      const res = await fetch('/api/club-rooms', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: ClubBrief[] };
      if (!active) return;
      if (json.success && json.data) setClubs(json.data);
    }
    load().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [step]);

  async function saveNicknameAndNext() {
    setSubmitting(true);
    setMessage('');
    try {
      const trimmed = nickname.trim();
      if (!trimmed) {
        setMessage('닉네임을 입력해주세요.');
        return;
      }
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed })
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '닉네임 저장에 실패했습니다.');
        return;
      }
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  }

  async function applyToClub(clubId: string) {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`/api/club-rooms/${clubId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '온보딩에서 가입 신청' })
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '가입 신청에 실패했습니다.');
        return;
      }
      setAppliedClubId(clubId);
      setMessage('가입 신청을 보냈습니다. 클럽 운영자가 승인하면 알림이 옵니다.');
      // 신청 완료 후 온보딩 마감 처리
      await completeOnboarding();
    } finally {
      setSubmitting(false);
    }
  }

  async function completeOnboarding() {
    await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completeOnboarding: true })
    });
  }

  async function skipAndCreate() {
    setSubmitting(true);
    try {
      await completeOnboarding();
      router.push('/club-rooms/new');
    } finally {
      setSubmitting(false);
    }
  }

  async function skipForNow() {
    setSubmitting(true);
    try {
      await completeOnboarding();
      router.push('/');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredClubs = clubs.filter((club) => {
    if (!keyword.trim()) return true;
    const q = keyword.trim().toLowerCase();
    return (
      club.name.toLowerCase().includes(q) ||
      (club.category ?? '').toLowerCase().includes(q) ||
      (club.description ?? '').toLowerCase().includes(q)
    );
  });

  if (!me) {
    return (
      <section className="card">
        <p>불러오는 중...</p>
      </section>
    );
  }

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">WELCOME</div>
        <h1 className="pc-hero-title">PlayCard에 오신 것을 환영합니다</h1>
      </section>

      <section className="card">
        <div className="pc-pill-row">
          <span className={`pc-pill${step === 1 ? ' is-active' : ''}`}>1. 닉네임</span>
          <span className={`pc-pill${step === 2 ? ' is-active' : ''}`}>2. 첫 클럽</span>
        </div>
      </section>

      {step === 1 ? (
        <section className="card">
          <h2>클럽에서 사용할 닉네임</h2>
          <p className="pc-meta">소셜 표시명을 그대로 써도 되고, 클럽에서 쓰고 싶은 이름으로 바꿔도 됩니다.</p>
          <input
            className="pc-field"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="20자 이내"
            maxLength={20}
            style={{ marginTop: 8 }}
          />
          <div className="pc-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="pc-button pc-button-primary"
              onClick={() => saveNicknameAndNext()}
              disabled={submitting || !nickname.trim()}
            >
              {submitting ? '저장 중...' : '다음'}
            </button>
          </div>
          {message ? <p className="pc-meta" style={{ marginTop: 8 }}>{message}</p> : null}
        </section>
      ) : null}

      {step === 2 ? (
        <>
          <section className="card">
            <h2>첫 클럽 합류하기</h2>
            <p className="pc-meta">
              참여하고 싶은 클럽을 검색해 가입 신청하거나, 직접 클럽을 만들 수 있어요.
            </p>
            <div className="pc-row" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="pc-button pc-button-primary"
                onClick={() => skipAndCreate()}
                disabled={submitting}
              >
                + 내가 클럽 만들기
              </button>
              <button type="button" className="pc-button" onClick={() => skipForNow()} disabled={submitting}>
                나중에 하기
              </button>
            </div>
          </section>

          <section className="card">
            <h2>클럽 둘러보기</h2>
            <input
              className="pc-field"
              placeholder="클럽 이름 / 카테고리로 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ marginTop: 6 }}
            />
            <div className="pc-stack" style={{ marginTop: 12 }}>
              {filteredClubs.length === 0 ? (
                <p className="pc-meta">표시할 클럽이 없습니다.</p>
              ) : null}
              {filteredClubs.map((club) => {
                const applied = appliedClubId === club._id;
                return (
                  <div key={club._id} className="quick-link" style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong>{club.name}</strong>
                      <span className="pc-meta">{club.category || club.sportType || ''}</span>
                    </div>
                    {club.description ? (
                      <div className="pc-meta" style={{ whiteSpace: 'pre-line' }}>
                        {club.description.slice(0, 80)}
                        {club.description.length > 80 ? '...' : ''}
                      </div>
                    ) : null}
                    <div className="pc-row">
                      <Link href={`/club-rooms/${club._id}`} className="pc-button">
                        둘러보기
                      </Link>
                      <button
                        type="button"
                        className="pc-button pc-button-primary"
                        onClick={() => applyToClub(club._id)}
                        disabled={submitting || applied}
                      >
                        {applied ? '신청 완료' : '가입 신청'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {message ? <p className="pc-meta" style={{ marginTop: 8 }}>{message}</p> : null}
          </section>
        </>
      ) : null}
    </>
  );
}
