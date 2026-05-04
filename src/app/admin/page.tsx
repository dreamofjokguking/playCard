'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MeResponse = {
  actorId: string;
  role: string;
  displayName?: string;
};

export default function ServiceAdminHomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) {
          if (active) setMessage('로그인이 필요합니다.');
          return;
        }
        const json = (await res.json()) as { success: boolean; data?: MeResponse };
        if (active && json.success && json.data) setMe(json.data);
      })
      .catch(() => {
        if (active) setMessage('권한 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isServiceAdmin = me?.role === 'service_admin';

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">SERVICE ADMIN</div>
        <h1 className="pc-hero-title">최상위 관리</h1>
      </section>

      {loading ? (
        <section className="card">
          <p>로딩 중...</p>
        </section>
      ) : null}

      {!loading && !isServiceAdmin ? (
        <section className="card">
          <h2>접근 불가</h2>
          <p>{message || '서비스 관리자 권한이 있는 사용자만 접근할 수 있습니다.'}</p>
          <div style={{ marginTop: 10 }}>
            <Link href="/" className="pc-button">
              홈으로
            </Link>
          </div>
        </section>
      ) : null}

      {!loading && isServiceAdmin ? (
        <section className="card">
          <h2>관리 영역</h2>
          <div className="pc-stack">
            <Link href="/admin/ai" className="quick-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <strong>AI 관리</strong>
              <span className="pc-meta">칭호 생성 프롬프트 / 모델 →</span>
            </Link>
            <div className="quick-link" style={{ opacity: 0.6 }}>
              <strong>(예정) 클럽 관리</strong>
              <div className="pc-meta">전체 클럽룸 조회/정지/이양</div>
            </div>
            <div className="quick-link" style={{ opacity: 0.6 }}>
              <strong>(예정) 사용자 관리</strong>
              <div className="pc-meta">전체 사용자 권한/상태 조정</div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
