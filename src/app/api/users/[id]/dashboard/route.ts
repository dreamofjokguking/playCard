import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Match from '@/lib/models/Match';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

type MetricSummary = {
  metricKey: string;
  avg: number;
};

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

async function _GET(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { id } = context.params;
  if (id !== actorId) {
    return NextResponse.json({ success: false, message: '본인 대시보드만 조회할 수 있습니다.' }, { status: 403 });
  }

  const user = await User.findById(id)
    .select({ _id: 1, displayName: 1, nickname: 1, currentTitle: 1 })
    .lean();
  if (!user) {
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const matches = await Match.find({ status: 'completed', participants: id })
    .select({ _id: 1, date: 1, results: 1 })
    .sort({ date: -1 })
    .lean();

  const timeline: Array<{ matchId: string; date: Date; overall: number }> = [];
  const metricTotals = new Map<string, { total: number; count: number }>();
  const recentMatches: Array<{ matchId: string; date: Date; overall: number; metrics: MetricSummary[] }> = [];

  for (const match of matches) {
    const stats = match.results?.playerStats?.find((row) => row.userId === id);
    if (!stats) continue;
    timeline.push({
      matchId: String(match._id),
      date: match.date,
      overall: stats.overall
    });

    const metrics = stats.metricStats.map((metric) => ({
      metricKey: metric.metricKey,
      avg: metric.avg
    }));
    recentMatches.push({
      matchId: String(match._id),
      date: match.date,
      overall: stats.overall,
      metrics
    });

    for (const metric of stats.metricStats) {
      const current = metricTotals.get(metric.metricKey) ?? { total: 0, count: 0 };
      metricTotals.set(metric.metricKey, {
        total: current.total + metric.avg * metric.count,
        count: current.count + metric.count
      });
    }
  }

  const metricAverages = Array.from(metricTotals.entries())
    .filter(([, value]) => value.count > 0)
    .map(([metricKey, value]) => ({
      metricKey,
      avg: roundScore(value.total / value.count)
    }))
    .sort((a, b) => b.avg - a.avg);

  const bestMetric = metricAverages[0] ?? null;
  const worstMetric = metricAverages.length > 0 ? metricAverages[metricAverages.length - 1] : null;

  return NextResponse.json({
    success: true,
    data: {
      user: {
        _id: String(user._id),
        displayName: user.displayName || user.nickname || String(user._id),
        currentTitle: user.currentTitle || ''
      },
      timeline: timeline
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((row) => ({ ...row, date: row.date })),
      metricAverages,
      bestMetric,
      worstMetric,
      recentMatches: recentMatches.slice(0, 5)
    }
  });
}

export const GET = withApiLogging(_GET, '/api/users/[id]/dashboard');
