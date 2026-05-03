type RankRowProps = {
  rank: number;
  name: string;
  score: number;
  badge: string;
};

export default function RankRow({ rank, name, score, badge }: RankRowProps) {
  const isTop = rank === 1;

  return (
    <div
      style={{
        border: `1px solid ${isTop ? 'var(--pc-accent)' : 'var(--pc-line)'}`,
        borderRadius: 12,
        padding: 12,
        background: isTop ? 'rgba(255, 224, 102, 0.12)' : '#262b40',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <strong>{rank}위</strong> {name}
      </div>
      <div style={{ fontWeight: 700 }}>
        {score} / <span style={{ color: 'var(--pc-muted)' }}>{badge}</span>
      </div>
    </div>
  );
}
