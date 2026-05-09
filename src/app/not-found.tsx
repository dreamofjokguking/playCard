import Link from 'next/link';

export const metadata = {
  title: '페이지를 찾을 수 없습니다 | PlayCard'
};

export default function NotFound() {
  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">404</div>
        <h1 className="pc-hero-title">페이지를 찾을 수 없습니다</h1>
      </section>

      <section className="card">
        <p>요청하신 페이지가 존재하지 않거나 이동했을 수 있습니다.</p>
        <p className="pc-meta" style={{ marginTop: 6 }}>
          링크를 다시 확인하시거나 홈으로 돌아가 다시 시도해주세요.
        </p>
        <div className="pc-row" style={{ marginTop: 12 }}>
          <Link href="/" className="pc-button pc-button-primary">
            홈으로
          </Link>
          <Link href="/club-rooms/search" className="pc-button">
            클럽 검색
          </Link>
        </div>
      </section>
    </>
  );
}
