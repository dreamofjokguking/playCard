'use client';

import RankRow from '@/components/ui/RankRow';

const MOCK_ROWS = [
  { rank: 1, userId: 'u1', name: '김공격', score: 8.42, mvp: 4, previousRank: 3 }, // ▲2
  { rank: 2, userId: 'u2', name: '이올라운더', score: 8.10, mvp: 2, previousRank: 1 }, // ▼1
  { rank: 3, userId: 'u3', name: '박수비', score: 7.95, mvp: 1, previousRank: 3 }, // -
  { rank: 4, userId: 'u4', name: '최서브', score: 7.62, mvp: 0, previousRank: 2 }, // ▼2
  { rank: 5, userId: 'u5', name: '정신예', score: 7.30, mvp: 0, previousRank: null }, // 신규
  { rank: 6, userId: 'u6', name: '한토스', score: 6.88, mvp: 0, previousRank: 7 } // ▲1
];

export default function RankingPreviewPage() {
  return (
    <>
      <section className="pc-banner-card">
        <div>
          <div className="pc-banner-meta">PREVIEW · MOCK 데이터</div>
          <div className="pc-banner-title">순위 변동(▲▼−) 미리보기</div>
        </div>
      </section>

      <section className="card">
        <h2>전체 랭킹</h2>
        <div className="pc-stack">
          {MOCK_ROWS.map((row) => (
            <RankRow
              key={row.userId}
              rank={row.rank}
              name={row.name}
              score={row.score}
              badge={`MVP ${row.mvp}`}
              previousRank={row.previousRank}
            />
          ))}
        </div>
        <p className="pc-meta" style={{ marginTop: 10 }}>
          ▲ 빨강 = 직전 경기 대비 상승 · ▼ 파랑 = 하락 · − 회색 = 유지/신규
        </p>
      </section>
    </>
  );
}
