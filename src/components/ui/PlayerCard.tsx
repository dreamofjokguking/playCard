import type { CSSProperties, ReactNode } from 'react';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type PlayerCardMetric = {
  metricKey: string;
  label?: string;
  avg: number;
};

export type PlayerCardProps = {
  displayName: string;
  rarity?: Rarity;
  title?: string;
  level?: number;
  overall?: number;
  metrics?: PlayerCardMetric[];
  /** compact: 메트릭 그리드 생략, 클럽 메인용. full: 메트릭 그리드 포함, 도감용 */
  variant?: 'compact' | 'full';
  /** 우상단 추가 정보 (예: 최근 점수 라벨) */
  trailing?: ReactNode;
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: '★ LEGENDARY'
};

// 시안의 그라디언트 그대로
const RARITY_GRADIENT: Record<Rarity, string> = {
  common: 'linear-gradient(160deg, #9CA3AF 0%, #4B5563 100%)',
  rare: 'linear-gradient(160deg, #60A5FA 0%, #1E40AF 100%)',
  epic: 'linear-gradient(160deg, #C084FC 0%, #6D28D9 100%)',
  legendary: 'linear-gradient(160deg, #FFD24A 0%, #FF6B35 60%, #C73E20 100%)'
};

export default function PlayerCard({
  displayName,
  rarity = 'common',
  title,
  level,
  overall,
  metrics,
  variant = 'compact',
  trailing
}: PlayerCardProps) {
  const cardStyle: CSSProperties = {
    width: '100%',
    borderRadius: 'var(--pc-r-xl)',
    padding: 'var(--pc-space-5)',
    position: 'relative',
    overflow: 'hidden',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--pc-space-4)',
    background: RARITY_GRADIENT[rarity],
    boxShadow:
      rarity === 'legendary'
        ? 'var(--pc-shadow-glow-gold)'
        : 'var(--pc-shadow-md)',
    border: rarity === 'legendary' ? '1px solid var(--pc-rarity-legendary)' : 'none'
  };

  const initial = displayName.slice(0, 1);

  return (
    <article style={cardStyle} aria-label={`${displayName} 카드 (${RARITY_LABEL[rarity]})`}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontFamily: 'var(--pc-font-mono)',
            fontWeight: 700,
            fontSize: 11,
            background: 'rgba(0,0,0,0.25)',
            padding: '3px 8px',
            borderRadius: 'var(--pc-r-sm)'
          }}
        >
          LV.{(level ?? 1).toString().padStart(2, '0')}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            background: 'rgba(255,255,255,0.2)',
            padding: '3px 8px',
            borderRadius: 'var(--pc-r-sm)'
          }}
        >
          {RARITY_LABEL[rarity]}
        </span>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-4)' }}>
        <span
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 900,
            fontFamily: 'var(--pc-font-display)',
            fontStyle: 'italic',
            flexShrink: 0
          }}
        >
          {initial}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 'var(--pc-ls-normal)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayName}
          </div>
          {title ? (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(0,0,0,0.2)',
                padding: '3px 8px',
                borderRadius: 'var(--pc-r-sm)',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ {title}
            </div>
          ) : null}
        </div>
        {trailing ? (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>{trailing}</div>
        ) : overall !== undefined ? (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontFamily: 'var(--pc-font-display)',
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: 22,
                fontFeatureSettings: '"tnum"'
              }}
            >
              {overall.toFixed(1)}
            </div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>OVERALL</div>
          </div>
        ) : null}
      </div>

      {variant === 'full' && metrics && metrics.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '6px 14px',
            fontSize: 12,
            fontFamily: 'var(--pc-font-mono)',
            fontWeight: 700,
            background: 'rgba(0,0,0,0.18)',
            padding: 'var(--pc-space-4)',
            borderRadius: 'var(--pc-r-md)'
          }}
        >
          {metrics.map((metric) => (
            <div
              key={metric.metricKey}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ opacity: 0.85 }}>{metric.label ?? metric.metricKey}</span>
              <span
                style={{
                  fontFamily: 'var(--pc-font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  fontFeatureSettings: '"tnum"'
                }}
              >
                {metric.avg.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
