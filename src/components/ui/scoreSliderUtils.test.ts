import { describe, expect, it } from 'vitest';
import { MAX_SCORE, MIN_SCORE, clampScore, roundToStep } from './scoreSliderUtils';

describe('scoreSliderUtils', () => {
  describe('roundToStep', () => {
    it('rounds to one decimal place', () => {
      expect(roundToStep(7.34)).toBe(7.3);
      expect(roundToStep(7.36)).toBe(7.4);
      expect(roundToStep(0)).toBe(0);
    });
  });

  describe('clampScore', () => {
    it('clamps below minimum to MIN_SCORE', () => {
      expect(clampScore(-3)).toBe(MIN_SCORE);
    });

    it('clamps above maximum to MAX_SCORE', () => {
      expect(clampScore(99)).toBe(MAX_SCORE);
    });

    it('rounds in-range values to step', () => {
      expect(clampScore(5.55)).toBe(5.6);
      expect(clampScore(5.54)).toBe(5.5);
    });

    it('treats NaN as MIN_SCORE', () => {
      expect(clampScore(Number.NaN)).toBe(MIN_SCORE);
    });

    it('preserves boundaries exactly', () => {
      expect(clampScore(MIN_SCORE)).toBe(MIN_SCORE);
      expect(clampScore(MAX_SCORE)).toBe(MAX_SCORE);
    });

    it('handles small step deltas without floating drift', () => {
      const value = clampScore(5 + 0.1);
      expect(value).toBe(5.1);
      const stepped = clampScore(value - 0.1);
      expect(stepped).toBe(5);
    });
  });
});
