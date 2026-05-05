import { describe, expect, it } from 'vitest';
import { aggregateResults } from './matchAggregation';

describe('aggregateResults', () => {
  it('averages metric scores per player and rounds to one decimal', () => {
    const result = aggregateResults(
      ['u1', 'u2'],
      [
        {
          mvpPick: 'u2',
          ratings: [
            { targetUserId: 'u2', metricScores: [{ metricKey: 'attack', score: 8 }], absences: [], comment: '' }
          ]
        },
        {
          mvpPick: 'u2',
          ratings: [
            { targetUserId: 'u2', metricScores: [{ metricKey: 'attack', score: 7 }], absences: [], comment: '' }
          ]
        }
      ]
    );
    const u2 = result.playerStats.find((row) => row.userId === 'u2');
    expect(u2?.metricStats[0].avg).toBe(7.5);
    expect(u2?.metricStats[0].count).toBe(2);
    expect(u2?.mvpCount).toBe(2);
  });

  it('marks undeclared active metrics as absences', () => {
    const result = aggregateResults(
      ['u1'],
      [
        {
          mvpPick: 'u1',
          ratings: [
            { targetUserId: 'u1', metricScores: [{ metricKey: 'attack', score: 8 }], absences: [], comment: '' }
          ]
        }
      ],
      {
        activeMetricKeys: ['attack', 'defense'],
        declaredMetricsByUser: new Map([['u1', ['attack']]])
      }
    );
    const u1 = result.playerStats.find((row) => row.userId === 'u1');
    expect(u1?.absences).toContain('defense');
    expect(u1?.absences).not.toContain('attack');
  });

  it('returns overall as weighted average across metrics', () => {
    const result = aggregateResults(
      ['u1'],
      [
        {
          mvpPick: 'u1',
          ratings: [
            {
              targetUserId: 'u1',
              metricScores: [
                { metricKey: 'attack', score: 8 },
                { metricKey: 'defense', score: 6 }
              ],
              absences: [],
              comment: ''
            }
          ]
        }
      ]
    );
    const u1 = result.playerStats.find((row) => row.userId === 'u1');
    // attack: avg=8(count=1), defense: avg=6(count=1). totalScore=8*1+6*1=14, count=2, overall=7
    expect(u1?.overall).toBe(7);
  });

  it('collects unique comments from evaluators', () => {
    const result = aggregateResults(
      ['u1'],
      [
        {
          mvpPick: 'u1',
          ratings: [{ targetUserId: 'u1', metricScores: [], absences: [], comment: '좋음' }]
        },
        {
          mvpPick: 'u1',
          ratings: [{ targetUserId: 'u1', metricScores: [], absences: [], comment: '안정적' }]
        }
      ]
    );
    const u1 = result.playerStats.find((row) => row.userId === 'u1');
    expect(u1?.comments).toEqual(['좋음', '안정적']);
  });
});
