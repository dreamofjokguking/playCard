'use client';

import { pickBestWorst, radarPolygon, type RadarPoint } from './chartUtils';

export type RadarChartProps = {
  points: RadarPoint[];
  size?: number;
  pad?: number;
};

export default function RadarChart({ points, size = 220, pad = 36 }: RadarChartProps) {
  if (points.length === 0) {
    return <p className="pc-meta">아직 능력치 데이터가 없습니다.</p>;
  }

  const { vertices, ringPolygons, outline } = radarPolygon(points, size, pad);
  const { best, worst } = pickBestWorst(points);
  const center = size / 2;
  const radius = size / 2 - pad;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: size, height: 'auto' }}
      role="img"
      aria-label="포지션별 능력치 레이더 차트"
    >
      {ringPolygons.map((polygon, index) => (
        <polygon
          key={`ring-${index}`}
          points={polygon}
          fill="none"
          stroke="var(--pc-line)"
          strokeWidth={index === ringPolygons.length - 1 ? 1.5 : 1}
        />
      ))}

      {vertices.map((v, index) => (
        <line
          key={`spoke-${index}`}
          x1={center}
          y1={center}
          x2={center + (v.x - center) * (radius / Math.max(1, Math.hypot(v.x - center, v.y - center)))}
          y2={center + (v.y - center) * (radius / Math.max(1, Math.hypot(v.x - center, v.y - center)))}
          stroke="var(--pc-line)"
          strokeWidth="1"
          opacity="0.4"
        />
      ))}

      <polygon
        points={outline}
        fill="rgba(255, 176, 32, 0.22)"
        stroke="var(--pc-primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255, 176, 32, 0.6))' }}
      />

      {points.map((point, index) => {
        const v = vertices[index];
        const isBest = best?.metricKey === point.metricKey;
        const isWorst = worst?.metricKey === point.metricKey && best?.metricKey !== point.metricKey;
        const dotColor = isBest ? 'var(--pc-accent)' : isWorst ? '#60A5FA' : 'var(--pc-primary)';
        const labelAngle = Math.atan2(v.y - center, v.x - center);
        const labelRadius = radius + pad * 0.6;
        const labelX = center + Math.cos(labelAngle) * labelRadius;
        const labelY = center + Math.sin(labelAngle) * labelRadius;

        return (
          <g key={point.metricKey}>
            <circle cx={v.x} cy={v.y} r="4.5" fill={dotColor} stroke="var(--pc-bg)" strokeWidth="2" />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="700"
              fill="var(--pc-text)"
            >
              {point.label}
            </text>
            <text
              x={labelX}
              y={labelY + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="800"
              fill={isBest ? 'var(--pc-accent)' : isWorst ? '#60A5FA' : 'var(--pc-muted)'}
              fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
            >
              {point.value.toFixed(1)}
            </text>
            {isBest ? (
              <text x={labelX + 18} y={labelY - 2} fontSize="11" fill="var(--pc-accent)" aria-hidden="true">
                ★
              </text>
            ) : null}
            {isWorst ? (
              <text x={labelX + 18} y={labelY - 2} fontSize="11" fill="#60A5FA" aria-hidden="true">
                ▼
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
