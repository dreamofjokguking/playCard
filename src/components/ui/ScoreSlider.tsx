'use client';

import { MAX_SCORE, MIN_SCORE, SCORE_STEP, clampScore } from './scoreSliderUtils';

export type ScoreSliderProps = {
  metricKey: string;
  metricLabel: string;
  score: number;
  absent?: boolean;
  onScoreChange: (score: number) => void;
};

export default function ScoreSlider({
  metricKey,
  metricLabel,
  score,
  absent = false,
  onScoreChange
}: ScoreSliderProps) {
  const fillPercent = absent ? 0 : Math.round(((clampScore(score) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100);
  const inputId = `score-slider-${metricKey}`;

  return (
    <div className={`pc-slider-row${absent ? ' is-absent' : ''}`} data-testid={`score-slider-${metricKey}`}>
      <div className="pc-slider-head">
        <label htmlFor={inputId} className="pc-slider-label">
          {metricLabel}
        </label>
        {absent ? <span className="pc-slider-absent-tag">결장</span> : null}
      </div>

      <div className="pc-slider-control">
        <button
          type="button"
          className="pc-slider-step"
          aria-label={`${metricLabel} 점수 0.1 감소`}
          disabled={absent || score <= MIN_SCORE}
          onClick={() => onScoreChange(clampScore(score - SCORE_STEP))}
        >
          −
        </button>

        <div className="pc-slider-track">
          <div className="pc-slider-fill" style={{ width: `${fillPercent}%` }} />
          <input
            id={inputId}
            type="range"
            className="pc-slider-input"
            min={MIN_SCORE}
            max={MAX_SCORE}
            step={SCORE_STEP}
            value={absent ? MIN_SCORE : clampScore(score)}
            disabled={absent}
            aria-label={`${metricLabel} 점수`}
            aria-valuemin={MIN_SCORE}
            aria-valuemax={MAX_SCORE}
            aria-valuenow={absent ? undefined : clampScore(score)}
            onChange={(event) => onScoreChange(clampScore(Number(event.target.value)))}
          />
        </div>

        <button
          type="button"
          className="pc-slider-step"
          aria-label={`${metricLabel} 점수 0.1 증가`}
          disabled={absent || score >= MAX_SCORE}
          onClick={() => onScoreChange(clampScore(score + SCORE_STEP))}
        >
          +
        </button>

        <span className="pc-slider-value" aria-live="polite">
          {absent ? '결장' : clampScore(score).toFixed(1)}
        </span>
      </div>
    </div>
  );
}
