import Link from 'next/link';

export default function EvaluationPage() {
  return (
    <section className="card">
      <h1>평가</h1>
      <p>진행 중인 경기 평가 진입, 결장 체크, MVP 선택 흐름을 이 영역에 통합합니다.</p>
      <p>
        현재 테스트 페이지는 <Link href="/club-rooms">/club-rooms</Link>에서 사용할 수 있습니다.
      </p>
    </section>
  );
}
