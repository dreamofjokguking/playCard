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
    if (json.success && json.data) {
      setSessionUserId(json.data.userId);
    }
  }

  async function refreshMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const json = await readJsonSafe<MeResponse>(res);
    if (!json) {
      setMe(null);
      return;
    }
    if (!res.ok || !json.success || !json.data) {
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
      setMessage(json.message || '세션 로그인 실패');
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
      setMessage(json.message || '세션 로그아웃 실패');
      return;
    }
    setMessage('세션 로그아웃 완료');
    setMe(null);
    await refreshSession();
  }

  useEffect(() => {
    refreshSession().catch(() => setMessage('세션 조회 실패'));
    refreshMe().catch(() => setMe(null));
  }, []);

  return (
    <section className="card">
      <h1>로그인 (로컬 테스트)</h1>
      <p>테스트용 userId로 세션을 설정해 평가/관리 페이지를 바로 검증할 수 있습니다.</p>

      <div style={{ marginTop: 12, display: 'grid', gap: 8, maxWidth: 420 }}>
        <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="userId 입력" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => signInSession()}>로그인(세션 설정)</button>
          <button onClick={() => signOutSession()}>로그아웃</button>
          <button onClick={() => router.push('/evaluation')}>평가 페이지 이동</button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
        <p>현재 세션: {sessionUserId || '(없음)'}</p>
        <p>현재 권한: {me ? `${me.role} / actorId: ${me.actorId}` : '(미확인 또는 미로그인)'}</p>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/evaluation">평가</Link>
        <Link href="/admin/members">회원 관리</Link>
        <Link href="/admin/matches">경기 관리</Link>
        <Link href="/club-rooms">클럽룸 테스트</Link>
      </div>

      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </section>
  );
}
