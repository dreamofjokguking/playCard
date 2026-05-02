import Link from 'next/link';

const checks = [
  'Next.js 실행',
  'TypeScript 경로 별칭(@/)',
  'MongoDB 연결 모듈',
  'API 상태 확인(/api/health)',
  '기본 API 응답(/api/ping)'
];

const quickLinks = [
  { href: '/club-rooms', label: '클럽룸 테스트' },
  { href: '/dashboard', label: '대시보드' },
  { href: '/evaluation', label: '평가' },
  { href: '/ranking', label: '순위' },
  { href: '/team-builder', label: '팀구성' },
  { href: '/admin', label: '관리' }
];

export default function HomePage() {
  return (
    <>
      <section className="card">
        <h1>PlayCard</h1>
        <p>계획서 기반 통합 구축을 위한 공통 골격과 테스트 진입점을 준비했습니다.</p>
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

      <section className="card">
        <h2>현재 체크 상태</h2>
        <ul className="check-list">
          {checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
