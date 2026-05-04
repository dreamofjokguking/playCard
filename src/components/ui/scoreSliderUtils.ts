export const MIN_SCORE = 0;
export const MAX_SCORE = 10;
export const SCORE_STEP = 0.1;

export function roundToStep(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return MIN_SCORE;
  if (value < MIN_SCORE) return MIN_SCORE;
  if (value > MAX_SCORE) return MAX_SCORE;
  return roundToStep(value);
}
