import { rankDelta, type DeltaDirection } from './chartUtils';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

type RankRowProps = {
  rank: number;
  name: string;
  score: number;
  badge: string;
  previousRank?: number | null;
  title?: string;
  rarity?: Rarity;
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

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#94A3B8',
  rare: '#60A5FA',
  epic: '#C084FC',
  legendary: '#FFE066'
};

const RANK_NUMBER_COLOR: Record<number, string> = {
  1: 'var(--pc-podium-gold)',
  2: 'var(--pc-podium-silver)',
  3: 'var(--pc-podium-bronze)'
};

export default function RankRow({
  rank,
  name,
  score,
  badge,
  previousRank = null,
  title,
  rarity = 'common'
}: RankRowProps) {
  const isTop = rank === 1;
  const isPodium = rank <= 3;
  const delta = rankDelta(rank, previousRank);
  const deltaText = delta.direction === 'flat' ? directionGlyph.flat : `${directionGlyph[delta.direction]} ${delta.amount}`;
  const titleColor = RARITY_COLOR[rarity];
  const rankColor = RANK_NUMBER_COLOR[rank] ?? 'var(--pc-ink-tertiary)';

  return (
    <div
      style={{
        border: `1px solid ${isTop ? 'var(--pc-accent)' : 'var(--pc-line)'}`,
        borderRadius: 12,
        padding: 12,
        background: isTop ? 'var(--pc-accent-tint)' : 'var(--pc-surface-elevated)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <strong
            style={{
              minWidth: 36,
              color: rankColor,
              fontFamily: 'var(--pc-font-display)',
              fontStyle: isPodium ? 'italic' : 'normal',
              fontWeight: 900,
              fontSize: isPodium ? 22 : 16,
              fontFeatureSettings: '"tnum"'
            }}
          >
            {rank}
          </strong>
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
      {title ? (
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            border: `1px solid ${titleColor}`,
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.04)',
            color: titleColor,
            fontSize: 11,
            fontWeight: 800,
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={title}
        >
          ⚡ {title}
        </div>
      ) : null}
    </div>
  );
}
