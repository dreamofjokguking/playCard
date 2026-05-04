'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SeedUser = { userId: string; displayName: string; kakaoId: string; role: string };
type SeedSummary = {
  clubRoomId: string;
  matchIds: string[];
  users: SeedUser[];
  autoLoggedInAs: { userId: string; displayName: string };
};

export default function DevToolsPage() {
  const [summary, setSummary] = useState<SeedSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [meRole, setMeRole] = useState<string | null>(null);
  const [meKakaoId, setMeKakaoId] = useState<string | null>(null);

  async function refreshSession() {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: { userId: string | null } };
      setSessionUserId(json.data?.userId ?? null);
    } catch {
      setSessionUserId(null);
    }
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setMeRole(null);
        setMeKakaoId(null);
        return;
      }
      const json = (await res.json()) as { success: boolean; data?: { role?: string; actorId?: string } };
      setMeRole(json.data?.role ?? null);
      setMeKakaoId(json.data?.actorId ?? null);
    } catch {
      setMeRole(null);
      setMeKakaoId(null);
    }
  }

  async function promoteToServiceAdmin() {
    setMessage('');
    try {
      const res = await fetch('/api/dev/promote', { method: 'POST' });
      const json = (await res.json()) as { success: boolean; data?: { role: string }; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '승격 실패');
        return;
      }
      setMessage(`현재 사용자가 ${json.data?.role}로 승격되었습니다. 새로고침하면 메뉴에 "관리"가 노출됩니다.`);
      await refreshSession();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    }
  }

  useEffect(() => {
    refreshSession().catch(() => undefined);
  }, []);

  async function runSeed() {
    setRunning(true);
    setMessage('');
    try {
      const res = await fetch('/api/dev/seed', { method: 'POST' });
      const json = (await res.json()) as { success: boolean; data?: SeedSummary; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '시드 실패');
        return;
      }
      setSummary(json.data);
      await refreshSession();
      setMessage(`시드 성공: ClubRoom 1개 / User ${json.data.users.length}명 / Match ${json.data.matchIds.length}경기 생성, ${json.data.autoLoggedInAs.displayName}으로 자동 로그인됨`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '시드 실패');
    } finally {
      setRunning(false);
    }
  }

  async function loginAs(userId: string) {
    setMessage('');
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '로그인 실패');
        return;
      }
      await refreshSession();
      setMessage(`${userId}로 세션 전환 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '로그인 실패');
    }
  }

  async function signOut() {
    setMessage('');
    await fetch('/api/auth/session', { method: 'DELETE' });
    await refreshSession();
    setMessage('로그아웃 완료');
  }

  return (
    <>
      <section className="pc-banner-card">
        <div>
          <div className="pc-banner-meta">DEV TOOLS</div>
          <div className="pc-banner-title">더미 데이터 시드 + 빠른 로그인</div>
        </div>
        <button type="button" className="pc-button pc-button-primary" onClick={() => runSeed()} disabled={running}>
          {running ? '시드 중...' : '더미 데이터 시드'}
        </button>
      </section>

      <section className="card">
        <h2>현재 세션</h2>
        <p className="pc-meta">
          session userId: {sessionUserId || '(로그인 안 됨)'}
        </p>
        <p className="pc-meta">
          actor: {meKakaoId || '(없음)'} · role: <strong>{meRole || '(없음)'}</strong>
          {meRole === 'service_admin' ? ' ✅' : null}
        </p>
        <div className="pc-row" style={{ marginTop: 8 }}>
          <button type="button" className="pc-button" onClick={() => promoteToServiceAdmin()}>
            현재 사용자를 service_admin으로 승격
          </button>
          <button type="button" className="pc-button" onClick={() => refreshSession()}>
            권한 재조회
          </button>
        </div>
        <div className="pc-row" style={{ marginTop: 8 }}>
          <Link href="/" className="pc-pill is-active">/ (홈 · 클럽 선택)</Link>
          {summary?.clubRoomId ? (
            <Link href={`/club-rooms/${summary.clubRoomId}`} className="pc-pill">
              /club-rooms/[id] (클럽 메인)
            </Link>
          ) : null}
          <Link href="/ranking" className="pc-pill">/ranking</Link>
          <Link href="/ranking/preview" className="pc-pill">/ranking/preview</Link>
          <Link href="/evaluation/preview" className="pc-pill">/evaluation/preview</Link>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="button" className="pc-button" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>
      </section>

      {summary ? (
        <section className="card">
          <h2>시드 결과</h2>
          <p className="pc-meta">ClubRoom: <code>{summary.clubRoomId}</code></p>
          <p className="pc-meta">Match: {summary.matchIds.length}개 (오래된 순 → 최신 순)</p>
          <div className="pc-stack" style={{ marginTop: 10 }}>
            {summary.users.map((user) => {
              const isCurrent = sessionUserId === user.userId;
              return (
                <div key={user.userId} className="quick-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <strong>{user.displayName}</strong>
                    <span className="pc-meta" style={{ marginLeft: 8 }}>
                      {user.role}
                      {isCurrent ? ' · (로그인됨)' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`pc-button${isCurrent ? ' pc-button-primary' : ''}`}
                    onClick={() => loginAs(user.userId)}
                    disabled={isCurrent}
                  >
                    이 사용자로 로그인
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {message ? (
        <section className="card">
          <p>{message}</p>
        </section>
      ) : null}

      <section className="card">
        <h2>안내</h2>
        <ul>
          <li>"더미 데이터 시드" 버튼을 누르면 기존 시드를 정리하고 ClubRoom 1개 + User 8명 + Match 5경기를 새로 생성합니다.</li>
          <li>시드 실행 시 자동으로 김공격(admin)으로 로그인됩니다.</li>
          <li>다른 사용자 카드를 누르면 그 사용자로 세션이 전환됩니다 (대시보드 데이터가 사람별로 어떻게 보이는지 확인 가능).</li>
          <li>운영(NODE_ENV=production)에서는 /api/dev/seed 가 403을 반환합니다.</li>
        </ul>
      </section>
    </>
  );
}
