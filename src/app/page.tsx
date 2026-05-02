const checks = [
  'Next.js 앱 실행',
  'TypeScript 경로 별칭(@/)',
  'MongoDB 연결 모듈',
  'API 헬스체크(/api/health)',
  '기본 API 응답(/api/ping)'
];

export default function HomePage() {
  return (
    <main>
      <h1>PlayCard Bootstrap</h1>
      <p>기초 구동 체크용 최소 구축 상태입니다.</p>
      <section className="card">
        <h2>현재 체크 포인트</h2>
        <ul className="check-list">
          {checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
