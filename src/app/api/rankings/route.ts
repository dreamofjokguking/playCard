import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import Match from '@/lib/models/Match';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

type RankingRow = {
  userId: string;
  displayName: string;
  currentTitle: string;
  score: number;
  mvpCount: number;
  matchCount: number;
  previousRank: number | null;
};

type Totals = { scoreTotal: number; scoreCount: number; mvpCount: number; matchCount: number };

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

type MatchResultsLean = {
  results?: {
    playerStats?: Array<{
      userId: string;
      overall: number;
      mvpCount?: number;
      metricStats: Array<{ metricKey: string; avg: number; count: number }>;
    }>;
  };
};

function accumulate(matches: MatchResultsLean[], type: string): Map<string, Totals> {
  const totals = new Map<string, Totals>();
  for (const match of matches) {
    const stats = match.results?.playerStats ?? [];
    for (const row of stats) {
      const current = totals.get(row.userId) ?? { scoreTotal: 0, scoreCount: 0, mvpCount: 0, matchCount: 0 };
      if (type === 'overall') {
        current.scoreTotal += row.overall;
        current.scoreCount += 1;
      } else {
        const metric = row.metricStats.find((metricStat) => metricStat.metricKey === type);
        if (metric) {
          current.scoreTotal += metric.avg * metric.count;
          current.scoreCount += metric.count;
        }
      }
      current.mvpCount += row.mvpCount ?? 0;
      current.matchCount += 1;
      totals.set(row.userId, current);
    }
  }
  return totals;
}

function rankByTotals(totals: Map<string, Totals>, displayNameMap: Map<string, string>): Map<string, number> {
  const rows = Array.from(totals.entries())
    .filter(([, value]) => value.scoreCount > 0)
    .map(([userId, value]) => ({
      userId,
      score: roundScore(value.scoreTotal / value.scoreCount),
      mvpCount: value.mvpCount,
      displayName: displayNameMap.get(userId) ?? userId
    }));
  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
    return a.displayName.localeCompare(b.displayName, 'ko');
  });
  const rankMap = new Map<string, number>();
  rows.forEach((row, index) => rankMap.set(row.userId, index + 1));
  return rankMap;
}

async function _GET(request: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type')?.trim() || 'overall';

  const matches = (await Match.find({ status: 'completed' })
    .select({ results: 1, date: 1 })
    .sort({ date: -1 })
    .lean()) as MatchResultsLean[];

  const totals = accumulate(matches, type);
  // 직전 순위 산출 — 최신 1경기를 제외한 누적
  const previousMatches = matches.slice(1);
  const previousTotals = accumulate(previousMatches, type);

  const candidateUserIds = Array.from(totals.entries())
    .filter(([, value]) => value.scoreCount > 0)
    .map(([userId]) => userId);

  const users = await User.find({ _id: { $in: candidateUserIds } })
    .select({ _id: 1, displayName: 1, nickname: 1, currentTitle: 1 })
    .lean();
  const userMap = new Map(
    users.map((user) => [
      String(user._id),
      {
        displayName: user.displayName || user.nickname || String(user._id),
        currentTitle: user.currentTitle || ''
      }
    ])
  );
  const displayNameMap = new Map(Array.from(userMap.entries()).map(([id, value]) => [id, value.displayName]));
  const previousRankMap = rankByTotals(previousTotals, displayNameMap);

  const rankings: RankingRow[] = candidateUserIds.map((userId) => {
    const value = totals.get(userId)!;
    const user = userMap.get(userId);
    return {
      userId,
      displayName: user?.displayName ?? userId,
      currentTitle: user?.currentTitle ?? '',
      score: value.scoreCount > 0 ? roundScore(value.scoreTotal / value.scoreCount) : 0,
      mvpCount: value.mvpCount,
      matchCount: value.matchCount,
      previousRank: previousRankMap.get(userId) ?? null
    };
  });

  rankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
    return a.displayName.localeCompare(b.displayName, 'ko');
  });

  return NextResponse.json({
    success: true,
    data: rankings.map((row, index) => ({
      rank: index + 1,
      ...row
    }))
  });
}

export const GET = withApiLogging(_GET, '/api/rankings');
