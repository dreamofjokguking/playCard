import { describe, expect, it } from 'vitest';
import {
  RADAR_MAX,
  lineChartGeometry,
  pickBestWorst,
  polarToXY,
  radarPolygon,
  radarVertexAngles,
  rankDelta
} from './chartUtils';

describe('chartUtils', () => {
  describe('radarVertexAngles', () => {
    it('starts at -90 (top) and spaces evenly', () => {
      expect(radarVertexAngles(4)).toEqual([-90, 0, 90, 180]);
    });

    it('returns empty array for non-positive count', () => {
      expect(radarVertexAngles(0)).toEqual([]);
      expect(radarVertexAngles(-1)).toEqual([]);
    });
  });

  describe('polarToXY', () => {
    it('places top vertex above center for angle -90', () => {
      const point = polarToXY(100, 50, 1, -90);
      expect(Math.round(point.x)).toBe(100);
      expect(Math.round(point.y)).toBe(50);
    });

    it('clamps ratio to [0,1]', () => {
      const big = polarToXY(0, 10, 5, 0);
      const small = polarToXY(0, 10, -1, 0);
      expect(big.x).toBe(10);
      expect(small.x).toBe(0);
    });
  });

  describe('radarPolygon', () => {
    it('produces vertices and three ring polygons + outline', () => {
      const result = radarPolygon(
        [
          { metricKey: 'a', label: '공격', value: RADAR_MAX },
          { metricKey: 'b', label: '수비', value: RADAR_MAX / 2 },
          { metricKey: 'c', label: '토스', value: 0 }
        ],
        200,
        32
      );
      expect(result.vertices).toHaveLength(3);
      expect(result.ringPolygons).toHaveLength(4);
      expect(result.outline.split(' ')).toHaveLength(3);
    });
  });

  describe('pickBestWorst', () => {
    it('returns null pair for empty input', () => {
      expect(pickBestWorst([])).toEqual({ best: null, worst: null });
    });

    it('picks max and min', () => {
      const result = pickBestWorst([
        { metricKey: 'a', label: '공격', value: 5 },
        { metricKey: 'b', label: '수비', value: 9 },
        { metricKey: 'c', label: '토스', value: 3 }
      ]);
      expect(result.best?.metricKey).toBe('b');
      expect(result.worst?.metricKey).toBe('c');
    });
  });

  describe('lineChartGeometry', () => {
    it('handles empty data', () => {
      const result = lineChartGeometry([], 320, 120);
      expect(result.path).toBe('');
      expect(result.points).toEqual([]);
    });

    it('produces path command for multi-point series', () => {
      const result = lineChartGeometry(
        [
          { label: '1', value: 6 },
          { label: '2', value: 7 },
          { label: '3', value: 8 }
        ],
        320,
        120
      );
      expect(result.points).toHaveLength(3);
      expect(result.path.startsWith('M')).toBe(true);
      expect(result.fill).toContain('Z');
    });

    it('centers single point and skips fill', () => {
      const result = lineChartGeometry([{ label: '1', value: 5 }], 200, 100);
      expect(result.points).toHaveLength(1);
      expect(result.points[0].x).toBe(100);
      expect(result.fill).toBe('');
    });
  });

  describe('rankDelta', () => {
    it('reports up when previous rank was lower (larger number)', () => {
      expect(rankDelta(2, 5)).toEqual({ direction: 'up', amount: 3 });
    });

    it('reports down when previous rank was higher (smaller number)', () => {
      expect(rankDelta(7, 4)).toEqual({ direction: 'down', amount: 3 });
    });

    it('reports flat for equal or missing previous', () => {
      expect(rankDelta(3, 3).direction).toBe('flat');
      expect(rankDelta(3, null).direction).toBe('flat');
      expect(rankDelta(3, undefined).direction).toBe('flat');
      expect(rankDelta(3, 0).direction).toBe('flat');
    });
  });
});
