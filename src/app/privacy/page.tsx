import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 | PlayCard',
  description: 'PlayCard 개인정보처리방침'
};

export default function PrivacyPage() {
  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">PRIVACY</div>
        <h1 className="pc-hero-title">개인정보처리방침</h1>
        <p className="pc-meta" style={{ marginTop: 4 }}>최종 개정일: 2026-05-09 (베타 테스트용 더미)</p>
      </section>

      <section className="card">
        <h2>1. 수집하는 개인정보 항목</h2>
        <p>PlayCard는 회원가입 및 서비스 제공을 위해 아래의 개인정보를 수집합니다.</p>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li><strong>카카오 로그인</strong>: 카카오 식별자(kakaoId), 닉네임, 프로필 이미지</li>
          <li><strong>구글 로그인</strong>: 구글 식별자(googleId), 이메일, 이름, 프로필 이미지</li>
          <li><strong>서비스 이용 중 생성</strong>: 클럽 가입 신청 메시지, 경기 평가 점수/한줄평, 칭호, MVP 투표 내역</li>
        </ul>
      </section>

      <section className="card">
        <h2>2. 개인정보의 이용 목적</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li>회원 식별 및 본인 인증</li>
          <li>클럽 가입·운영 및 멤버 간 평가 기능 제공</li>
          <li>알림(평가 시작/완료, 가입 승인 등) 발송</li>
          <li>서비스 이용 통계 및 품질 개선</li>
        </ul>
      </section>

      <section className="card">
        <h2>3. 보유 및 이용 기간</h2>
        <p>회원 탈퇴 시 즉시 파기를 원칙으로 하나, 관계 법령(전자상거래법, 통신비밀보호법 등)에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
      </section>

      <section className="card">
        <h2>4. 제3자 제공</h2>
        <p>법령에 의하거나 수사기관의 적법한 절차에 따른 요청이 있는 경우를 제외하고, 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.</p>
      </section>

      <section className="card">
        <h2>5. 처리 위탁</h2>
        <p>서비스 운영을 위해 아래 업체에 일부 데이터 처리를 위탁합니다.</p>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li><strong>MongoDB Atlas</strong>: 데이터베이스 호스팅</li>
          <li><strong>Render</strong>: 애플리케이션 호스팅</li>
          <li><strong>Cloudinary</strong>: 클럽 커버 이미지·프로필 이미지 저장</li>
          <li><strong>Google Gemini</strong>: AI 칭호 생성 (평가 결과 일부를 익명 형태로 전송)</li>
        </ul>
      </section>

      <section className="card">
        <h2>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 회원 탈퇴를 통해 모든 개인정보의 삭제를 요청할 수 있습니다.</p>
      </section>

      <section className="card">
        <h2>7. 안전성 확보 조치</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li>비밀번호 미저장(소셜 로그인 전용)</li>
          <li>HTTPS 전송 암호화</li>
          <li>접근 권한 분리(클럽 단위 권한)</li>
        </ul>
      </section>

      <section className="card">
        <h2>8. 개인정보 보호책임자</h2>
        <p>PlayCard는 개인정보 보호 관련 문의를 운영자 이메일(추후 공지)로 받습니다. 베타 기간 동안에는 GitHub Issues를 통해서도 문의 가능합니다.</p>
      </section>

      <section className="card">
        <h2>9. 고지</h2>
        <p>본 개인정보처리방침은 베타 테스트를 위한 더미이며, 정식 출시 전에 운영자 정보·처리 위탁 업체·문의처 등을 갱신할 예정입니다.</p>
      </section>

      <section className="card">
        <Link href="/login" className="pc-pill">← 로그인으로</Link>
      </section>
    </>
  );
}
