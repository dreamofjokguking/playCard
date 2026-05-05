import type { TitleRarity } from '@/lib/gemini';

export type AggregatedPlayerStat = {
  userId: string;
  metricStats: { metricKey: string; avg: number; count: number }[];
  overall: number;
  absences: string[];
  mvpCount: number;
  comments: string[];
  title?: string;
  rarity?: TitleRarity;
};

export type AggregationEvaluation = {
  mvpPick: string;
  ratings: Array<{
    targetUserId: string;
    metricScores: Array<{ metricKey: string; score?: number | null }>;
    absences?: string[];
    comment?: string;
  }>;
};

export type AggregationContext = {
  activeMetricKeys: string[];
  declaredMetricsByUser: Map<string, string[]>;
};

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

export function aggregateResults(
  participants: string[],
  evaluations: AggregationEvaluation[],
  context: AggregationContext = { activeMetricKeys: [], declaredMetricsByUser: new Map() }
): { playerStats: AggregatedPlayerStat[] } {
  const mvpCountMap = new Map<string, number>();
  for (const evaluation of evaluations) {
    const current = mvpCountMap.get(evaluation.mvpPick) ?? 0;
    mvpCountMap.set(evaluation.mvpPick, current + 1);
  }

  const byPlayer: AggregatedPlayerStat[] = participants.map((userId) => {
    const metricTotals = new Map<string, { total: number; count: number }>();
    const absenceSet = new Set<string>();
    const comments: string[] = [];

    for (const evaluation of evaluations) {
      const rating = evaluation.ratings.find((value) => value.targetUserId === userId);
      if (!rating) continue;

      for (const absence of rating.absences ?? []) {
        absenceSet.add(absence);
      }

      if (rating.comment) {
        comments.push(rating.comment);
      }

      for (const metricScore of rating.metricScores) {
        if (typeof metricScore.score !== 'number') continue;
        const current = metricTotals.get(metricScore.metricKey) ?? { total: 0, count: 0 };
        metricTotals.set(metricScore.metricKey, {
          total: current.total + metricScore.score,
          count: current.count + 1
        });
      }
    }

    const declared = context.declaredMetricsByUser.get(userId);
    if (declared && context.activeMetricKeys.length > 0) {
      const declaredSet = new Set(declared);
      for (const metricKey of context.activeMetricKeys) {
        if (!declaredSet.has(metricKey)) absenceSet.add(metricKey);
      }
    }

    const metricStats = Array.from(metricTotals.entries()).map(([metricKey, value]) => ({
      metricKey,
      avg: roundScore(value.total / value.count),
      count: value.count
    }));

    const totalScore = metricStats.reduce((sum, metric) => sum + metric.avg * metric.count, 0);
    const totalCount = metricStats.reduce((sum, metric) => sum + metric.count, 0);
    const overall = totalCount > 0 ? roundScore(totalScore / totalCount) : 0;

    return {
      userId,
      metricStats,
      overall,
      absences: Array.from(absenceSet),
      mvpCount: mvpCountMap.get(userId) ?? 0,
      comments
    };
  });

  return { playerStats: byPlayer };
}
