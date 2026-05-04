'use client';

import { lineChartGeometry, type LineDatum } from './chartUtils';

export type LineChartProps = {
  data: LineDatum[];
  width?: number;
  height?: number;
};

export default function LineChart({ data, width = 320, height = 120 }: LineChartProps) {
  if (data.length === 0) {
    return <p className="pc-meta">표시할 추이 데이터가 없습니다.</p>;
  }

  const { path, fill, points } = lineChartGeometry(data, width, height, 12);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
      role="img"
      aria-label="경기별 점수 추이"
    >
      <defs>
        <linearGradient id="pc-line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--pc-primary)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--pc-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? <path d={fill} fill="url(#pc-line-fill)" /> : null}
      {path ? (
        <path
          d={path}
          fill="none"
          stroke="var(--pc-primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255, 176, 32, 0.55))' }}
        />
      ) : null}
      {points.map((point, index) => (
        <g key={`pt-${index}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="4"
            fill="var(--pc-bg)"
            stroke="var(--pc-primary)"
            strokeWidth="2"
          />
          {index === points.length - 1 ? (
            <text
              x={Math.min(point.x + 6, width - 4)}
              y={point.y - 8}
              fontSize="11"
              fontWeight="800"
              fill="var(--pc-primary)"
              fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
            >
              {point.value.toFixed(1)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
