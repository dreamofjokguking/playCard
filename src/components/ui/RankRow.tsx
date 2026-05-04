import { rankDelta, type DeltaDirection } from './chartUtils';

type RankRowProps = {
  rank: number;
  name: string;
  score: number;
  badge: string;
  previousRank?: number | null;
};

const directionColor: Record<DeltaDirection, string> = {
  up: '#F87171',
  down: '#60A5FA',
  flat: 'var(--pc-muted)'
};

const directionGlyph: Record<DeltaDirection, string> = {
  up: '▲',
  down: '▼',
  flat: '−'
};

export default function RankRow({ rank, name, score, badge, previousRank = null }: RankRowProps) {
  const isTop = rank === 1;
  const delta = rankDelta(rank, previousRank);
  const deltaText = delta.direction === 'flat' ? directionGlyph.flat : `${directionGlyph[delta.direction]} ${delta.amount}`;

  return (
    <div
      style={{
        border: `1px solid ${isTop ? 'var(--pc-accent)' : 'var(--pc-line)'}`,
        borderRadius: 12,
        padding: 12,
        background: isTop ? 'rgba(255, 224, 102, 0.12)' : '#262b40',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <strong style={{ minWidth: 28 }}>{rank}위</strong>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span
          aria-label={`순위 변동 ${delta.direction === 'up' ? '상승' : delta.direction === 'down' ? '하락' : '유지'}`}
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: directionColor[delta.direction],
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${directionColor[delta.direction]}`,
            padding: '1px 6px',
            borderRadius: 999,
            whiteSpace: 'nowrap'
          }}
        >
          {deltaText}
        </span>
      </div>
      <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
        {score} / <span style={{ color: 'var(--pc-muted)' }}>{badge}</span>
      </div>
    </div>
  );
}
