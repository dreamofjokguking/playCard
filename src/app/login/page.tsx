'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: '보안 검증에 실패했습니다. 다시 시도해주세요.',
  missing_code: '인증 코드가 없습니다. 다시 시도해주세요.',
  token_failed: '토큰 교환에 실패했습니다.',
  userinfo_failed: '사용자 정보 조회에 실패했습니다.',
  userinfo_invalid: '사용자 정보가 올바르지 않습니다.',
  access_denied: '소셜 로그인이 취소되었습니다.'
};

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="card"><h1>로그인</h1><p>로딩 중...</p></section>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const kakaoErr = searchParams?.get('kakao_error');
    const googleErr = searchParams?.get('google_error');
    const code = kakaoErr || googleErr;
    if (code) {
      const provider = kakaoErr ? '카카오' : '구글';
      setMessage(OAUTH_ERROR_MESSAGES[code] ?? `${provider} 로그인 오류: ${code}`);
    }
  }, [searchParams]);

  return (
    <>
      <section className="card">
        <h1>로그인</h1>
        <p className="pc-meta" style={{ marginTop: 0 }}>
          카카오 계정으로 시작하면 닉네임/프로필이 자동 등록됩니다.
        </p>
        <div className="pc-oauth-stack">
          <a href="/api/auth/kakao/start" className="pc-kakao-btn" aria-label="카카오로 시작하기">
            <KakaoSymbol />
            카카오로 시작하기
          </a>
          <a href="/api/auth/google/start" className="pc-google-btn" aria-label="Google로 시작하기">
            <GoogleSymbol />
            Google로 시작하기
          </a>
        </div>
        {!sessionUserId ? (
          <p className="pc-meta" style={{ marginTop: 12, lineHeight: 1.6 }}>
            소셜 계정으로 가입 시{' '}
            <Link href="/terms" className="pc-link-inline">
              이용약관
            </Link>
            {' 및 '}
            <Link href="/privacy" className="pc-link-inline">
              개인정보처리방침
            </Link>
            에 동의한 것으로 간주합니다.
          </p>
        ) : null}
        {sessionUserId ? (
          <p className="pc-meta" style={{ marginTop: 12 }}>
            현재 세션: <strong>{sessionUserId}</strong>
            {me?.role ? <span> · 권한 {me.role}</span> : null}
          </p>
        ) : null}
        <div className="pc-row" style={{ marginTop: 12 }}>
          <button className="pc-button" type="button" onClick={() => router.push('/')}>
            홈으로
          </button>
          {sessionUserId ? (
            <button className="pc-button" type="button" onClick={() => signOutSession()}>
              로그아웃
            </button>
          ) : null}
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
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}

function KakaoSymbol() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.477 3 2 6.582 2 11c0 2.83 1.836 5.31 4.605 6.762l-1.13 4.13a.5.5 0 0 0 .76.55l4.86-3.21c.302.025.609.038.918.038c5.523 0 10-3.582 10-8s-4.477-8.27-10-8.27z"
      />
    </svg>
  );
}

function GoogleSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
