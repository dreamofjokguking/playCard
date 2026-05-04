import Link from 'next/link';

export const metadata = {
  title: 'PlayCard · 오프라인'
};

export default function OfflinePage() {
  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">OFFLINE</div>
        <h1 className="pc-hero-title">잠시 끊겼어요</h1>
      </section>

      <section className="card">
        <h2>네트워크에 연결되어 있지 않습니다</h2>
        <p>일부 캐시된 화면은 그대로 볼 수 있지만, 실시간 평가/순위 데이터는 다시 연결된 뒤에 갱신됩니다.</p>
        <div style={{ marginTop: 12 }}>
          <Link href="/" className="pc-button pc-button-primary">
            다시 시도
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>오프라인에서 가능한 것</h2>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>마지막으로 본 클럽 메인/순위 화면 확인 (브라우저 캐시 한정)</li>
          <li>홈 화면 아이콘으로 즉시 재시작</li>
        </ul>
      </section>
    </>
  );
}
