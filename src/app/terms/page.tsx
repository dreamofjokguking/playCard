import Link from 'next/link';

export const metadata = {
  title: '이용약관 | PlayCard',
  description: 'PlayCard 서비스 이용약관'
};

export default function TermsPage() {
  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">TERMS</div>
        <h1 className="pc-hero-title">이용약관</h1>
        <p className="pc-meta" style={{ marginTop: 4 }}>최종 개정일: 2026-05-09 (베타 테스트용 더미)</p>
      </section>

      <section className="card">
        <h2>제1조 (목적)</h2>
        <p>이 약관은 PlayCard(이하 &ldquo;서비스&rdquo;)가 제공하는 스포츠 동호회 통합 운영 플랫폼의 이용 조건과 절차, 이용자와 서비스의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
      </section>

      <section className="card">
        <h2>제2조 (정의)</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li><strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 회원</li>
          <li><strong>클럽</strong>: 이용자가 생성·운영하는 동호회 단위</li>
          <li><strong>운영자</strong>: 클럽을 생성한 사용자 또는 위임받은 관리자</li>
        </ul>
      </section>

      <section className="card">
        <h2>제3조 (가입 및 인증)</h2>
        <p>회원가입은 카카오 또는 구글 계정으로만 가능하며, 가입 시 본 약관과 개인정보처리방침에 동의한 것으로 간주합니다.</p>
      </section>

      <section className="card">
        <h2>제4조 (서비스 제공)</h2>
        <p>경기 등록, 평가, 순위, 칭호, 팀 구성, 알림 등의 기능을 제공합니다. 베타 기간 동안 기능과 데이터는 사전 통보 없이 변경되거나 초기화될 수 있습니다.</p>
      </section>

      <section className="card">
        <h2>제5조 (이용자의 의무)</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li>타인의 명예를 훼손하거나 모욕하는 평가/한줄평을 작성하지 않습니다.</li>
          <li>다른 이용자의 계정을 도용하거나 클럽 운영을 방해하지 않습니다.</li>
          <li>서비스의 정상 운영을 방해하는 자동화 도구를 사용하지 않습니다.</li>
        </ul>
      </section>

      <section className="card">
        <h2>제6조 (서비스의 변경 및 중단)</h2>
        <p>서비스는 시스템 점검, 기술적 문제, 운영상 필요에 의해 일시 중단되거나 변경될 수 있으며, 이 경우 사전 또는 사후에 공지합니다.</p>
      </section>

      <section className="card">
        <h2>제7조 (탈퇴)</h2>
        <p>이용자는 언제든지 탈퇴를 요청할 수 있으며, 탈퇴 시 본인의 계정 정보 및 작성 데이터(평가, 한줄평 등)는 관계 법령에 따른 보존 기간을 제외하고 삭제됩니다.</p>
      </section>

      <section className="card">
        <h2>제8조 (면책)</h2>
        <p>본 서비스는 베타 단계에 있으며, 데이터 손실·서비스 중단 등으로 발생한 손해에 대한 책임을 지지 않습니다. 정식 출시 시 별도의 약관으로 갱신됩니다.</p>
      </section>

      <section className="card">
        <h2>제9조 (문의)</h2>
        <p>본 약관 또는 서비스 관련 문의는 운영자 이메일(추후 공지)로 보내주시기 바랍니다.</p>
      </section>

      <section className="card">
        <Link href="/login" className="pc-pill">← 로그인으로</Link>
      </section>
    </>
  );
}
