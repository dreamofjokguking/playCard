export const RADAR_MIN = 0;
export const RADAR_MAX = 10;

export type RadarPoint = {
  metricKey: string;
  label: string;
  value: number;
};

export type Vec2 = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function radarVertexAngles(count: number): number[] {
  if (count <= 0) return [];
  const step = 360 / count;
  return Array.from({ length: count }, (_, index) => -90 + step * index);
}

export function polarToXY(center: number, radius: number, ratio: number, angleDeg: number): Vec2 {
  const rad = (angleDeg * Math.PI) / 180;
  const r = radius * clamp(ratio, 0, 1);
  return {
    x: center + Math.cos(rad) * r,
    y: center + Math.sin(rad) * r
  };
}

export function radarPolygon(
  points: RadarPoint[],
  size: number,
  pad: number
): { vertices: Vec2[]; ringPolygons: string[]; outline: string } {
  const center = size / 2;
  const radius = size / 2 - pad;
  const angles = radarVertexAngles(points.length);

  const vertices = points.map((point, index) => {
    const ratio = clamp(point.value / RADAR_MAX, 0, 1);
    return polarToXY(center, radius, ratio, angles[index] ?? 0);
  });

  const ringPolygons = [0.25, 0.5, 0.75, 1].map((ratio) =>
    angles
      .map((angle) => {
        const v = polarToXY(center, radius, ratio, angle);
        return `${v.x},${v.y}`;
      })
      .join(' ')
  );

  const outline = vertices.map((v) => `${v.x},${v.y}`).join(' ');

  return { vertices, ringPolygons, outline };
}

export function pickBestWorst(points: RadarPoint[]): { best: RadarPoint | null; worst: RadarPoint | null } {
  if (points.length === 0) return { best: null, worst: null };
  let best = points[0];
  let worst = points[0];
  for (const point of points) {
    if (point.value > best.value) best = point;
    if (point.value < worst.value) worst = point;
  }
  return { best, worst };
}

export type LineDatum = { label: string; value: number };

export function lineChartGeometry(
  data: LineDatum[],
  width: number,
  height: number,
  padding = 8
): {
  path: string;
  fill: string;
  points: Array<Vec2 & { value: number; label: string }>;
  min: number;
  max: number;
} {
  if (data.length === 0) {
    return { path: '', fill: '', points: [], min: 0, max: 0 };
  }

  const values = data.map((datum) => datum.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = rawMin === rawMax ? rawMin - 0.5 : rawMin - 0.5;
  const max = rawMin === rawMax ? rawMax + 0.5 : rawMax + 0.5;
  const range = max - min || 1;

  const usableHeight = Math.max(height - padding * 2, 1);
  const dx = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((datum, index) => ({
    x: data.length > 1 ? index * dx : width / 2,
    y: height - ((datum.value - min) / range) * usableHeight - padding,
    value: datum.value,
    label: datum.label
  }));

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const lastX = points[points.length - 1].x;
  const fill = points.length > 1 ? `${path} L ${lastX} ${height} L 0 ${height} Z` : '';

  return { path, fill, points, min, max };
}

export type DeltaDirection = 'up' | 'down' | 'flat';

export function rankDelta(currentRank: number, previousRank: number | null | undefined): {
  direction: DeltaDirection;
  amount: number;
} {
  if (previousRank == null || previousRank <= 0) {
    return { direction: 'flat', amount: 0 };
  }
  if (previousRank > currentRank) return { direction: 'up', amount: previousRank - currentRank };
  if (previousRank < currentRank) return { direction: 'down', amount: currentRank - previousRank };
  return { direction: 'flat', amount: 0 };
}
