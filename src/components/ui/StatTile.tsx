type StatTileProps = {
  label: string;
  value: string;
  accent?: 'primary' | 'secondary' | 'accent';
};

const accentMap = {
  primary: 'var(--pc-primary)',
  secondary: 'var(--pc-secondary)',
  accent: 'var(--pc-accent)'
} as const;

export default function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className="quick-link">
      <strong>{label}</strong>
      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: accent ? accentMap[accent] : 'var(--pc-text)' }}>
        {value}
      </div>
    </div>
  );
}
