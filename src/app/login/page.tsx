'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type MeResponse = {
  actorId: string;
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('kimis0719');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [message, setMessage] = useState('');

  async function readJsonSafe<T>(res: Response): Promise<ApiResponse<T> | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return null;
    }
  }

  async function refreshSession() {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const json = await readJsonSafe<{ userId: string | null }>(res);
    if (!json) {
      setSessionUserId(null);
      return;
    }
    if (json.success && json.data) setSessionUserId(json.data.userId);
  }

  async function refreshMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const json = await readJsonSafe<MeResponse>(res);
    if (!json || !res.ok || !json.success || !json.data) {
      setMe(null);
      return;
    }
    setMe(json.data);
  }

  async function signInSession() {
    setMessage('');
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const json = await readJsonSafe<{ userId: string }>(res);
    if (!json) {
      setMessage('세션 로그인 응답을 읽지 못했습니다.');
      return;
    }
    if (!res.ok || !json.success) {
      setMessage(json.message || '세션 로그인에 실패했습니다.');
      return;
    }
    setMessage(`세션 로그인 완료: ${json.data?.userId}`);
    await refreshSession();
    await refreshMe();
  }

  async function signOutSession() {
    setMessage('');
    const res = await fetch('/api/auth/session', { method: 'DELETE' });
    const json = await readJsonSafe<{ signedOut: boolean }>(res);
    if (!json) {
      setMessage('세션 로그아웃 응답을 읽지 못했습니다.');
      return;
    }
    if (!res.ok || !json.success) {
      setMessage(json.message || '세션 로그아웃에 실패했습니다.');
      return;
    }
    setMessage('세션 로그아웃 완료');
    setMe(null);
    await refreshSession();
  }

  useEffect(() => {
    refreshSession().catch(() => setMessage('세션 조회에 실패했습니다.'));
    refreshMe().catch(() => setMe(null));
  }, []);

  return (
    <>
      <section className="card">
        <h1>로그인</h1>
        <p>테스트용 세션 로그인으로 평가/관리 화면을 바로 검증할 수 있습니다.</p>
      </section>

      <section className="card">
        <h2>세션 설정</h2>
        <div className="pc-form-grid">
          <input className="pc-field" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="userId 입력" />
          <div className="pc-row">
            <button className="pc-button pc-button-primary" type="button" onClick={() => signInSession()}>
              로그인
            </button>
            <button className="pc-button" type="button" onClick={() => signOutSession()}>
              로그아웃
            </button>
            <button className="pc-button" type="button" onClick={() => router.push('/')}>
              홈으로
            </button>
          </div>
          <div className="quick-link">
            <div>현재 세션: {sessionUserId || '(없음)'}</div>
            <div className="pc-meta">권한: {me ? `${me.role} / actorId: ${me.actorId}` : '미로그인'}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>바로 이동</h2>
        <div className="pc-admin-actions">
          <Link href="/" className="pc-pill is-active">
            내 클럽
          </Link>
          <Link href="/club-rooms/search" className="pc-pill">
            클럽 검색
          </Link>
          <Link href="/club-rooms/new" className="pc-pill">
            클럽 생성
          </Link>
          <Link href="/club-rooms" className="pc-pill">
            클럽룸 테스트(레거시)
          </Link>
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
