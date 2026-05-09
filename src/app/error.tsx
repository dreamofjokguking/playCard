'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 운영 환경에선 외부 에러 모니터링 도구로 보낼 자리 (Sentry 등)
      console.error('[client error]', error);
    }
  }, [error]);

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">ERROR</div>
        <h1 className="pc-hero-title">문제가 발생했습니다</h1>
      </section>

      <section className="card">
        <p>일시적인 오류로 화면을 표시하지 못했습니다.</p>
        <p className="pc-meta" style={{ marginTop: 6 }}>
          새로고침으로 다시 시도해보시고, 계속 같은 문제가 발생하면 운영자에게 문의해주세요.
        </p>
        {error?.digest ? (
          <p className="pc-meta" style={{ marginTop: 6, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
            오류 ID: {error.digest}
          </p>
        ) : null}
        <div className="pc-row" style={{ marginTop: 12 }}>
          <button type="button" className="pc-button pc-button-primary" onClick={() => reset()}>
            다시 시도
          </button>
          <Link href="/" className="pc-button">
            홈으로
          </Link>
        </div>
      </section>
    </>
  );
}
