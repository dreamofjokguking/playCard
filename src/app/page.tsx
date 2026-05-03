import Link from 'next/link';

const quickLinks = [
  { href: '/dashboard', label: '내 카드 보기' },
  { href: '/evaluation', label: '경기 평가하기' },
  { href: '/ranking', label: '전체 순위 확인' },
  { href: '/team-builder', label: '팀 자동 구성' }
];

export default function HomePage() {
  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">오늘의 플레이어</div>
        <h1 className="pc-hero-title">테스터1님, 경기 준비 완료</h1>
      </section>

      <section className="pc-banner-card">
        <div>
          <div className="pc-banner-meta">평가 진행중 · 마감 23:59</div>
          <div className="pc-banner-title">참여 5/7명 · 지금 평가 시작하기</div>
        </div>
        <Link href="/evaluation" className="pc-button pc-button-primary">
          이동
        </Link>
      </section>

      <section className="card">
        <h2>빠른 이동</h2>
        <div className="quick-links">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="quick-link">
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
