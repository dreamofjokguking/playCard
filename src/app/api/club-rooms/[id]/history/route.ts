import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import Match from '@/lib/models/Match';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _GET(_request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const clubRoomId = context.params.id;
  if (!clubRoomId) {
    return NextResponse.json({ success: false, message: 'clubRoomId가 필요합니다.' }, { status: 400 });
  }

  const matches = await Match.find({ clubRoomId, status: 'completed' })
    .select({ _id: 1, date: 1, time: 1, venue: 1, results: 1 })
    .sort({ date: 1 })
    .lean();

  if (matches.length === 0) {
    return NextResponse.json({ success: true, data: { matches: [], users: [], rows: [] } });
  }

  const userIds = new Set<string>();
  const metricKeys = new Set<string>();
  for (const match of matches) {
    for (const stat of match.results?.playerStats ?? []) {
      userIds.add(stat.userId);
      for (const metric of stat.metricStats) metricKeys.add(metric.metricKey);
    }
  }

  const users = await User.find({ _id: { $in: Array.from(userIds) } })
    .select({ _id: 1, displayName: 1, nickname: 1 })
    .lean();
  const nameMap = new Map(users.map((user) => [String(user._id), user.displayName || user.nickname || String(user._id)]));

  // matrix: userId × metricKey 별 매치별 평균 + 결장 여부
  type Cell = { avg: number | null; absent: boolean };
  const matrix = new Map<string, Map<string, Cell>>(); // key = `${userId}|${metricKey}`, inner key = matchId

  for (const match of matches) {
    const matchId = String(match._id);
    for (const stat of match.results?.playerStats ?? []) {
      for (const metricKey of metricKeys) {
        const metric = stat.metricStats.find((m) => m.metricKey === metricKey);
        const absent = stat.absences.includes(metricKey) || !metric || metric.count === 0;
        const cellKey = `${stat.userId}|${metricKey}`;
        if (!matrix.has(cellKey)) matrix.set(cellKey, new Map());
        matrix.get(cellKey)!.set(matchId, { avg: absent ? null : metric!.avg, absent });
      }
    }
  }

  // 행 구성: userId × metricKey, 각 행에 매치별 cell 배열 (date 순)
  const matchList = matches.map((match) => ({
    _id: String(match._id),
    date: match.date,
    time: match.time,
    venue: match.venue ?? ''
  }));

  const sortedUserIds = Array.from(userIds).sort((a, b) => {
    const an = nameMap.get(a) ?? a;
    const bn = nameMap.get(b) ?? b;
    return an.localeCompare(bn, 'ko');
  });
  const sortedMetricKeys = Array.from(metricKeys);

  const rows: Array<{
    userId: string;
    displayName: string;
    metricKey: string;
    cells: Array<{ matchId: string; avg: number | null; absent: boolean; delta: number | null }>;
  }> = [];

  for (const userId of sortedUserIds) {
    const displayName = nameMap.get(userId) ?? userId;
    for (const metricKey of sortedMetricKeys) {
      const cellMap = matrix.get(`${userId}|${metricKey}`) ?? new Map<string, Cell>();
      let lastAvg: number | null = null;
      const cells = matchList.map((match) => {
        const cell = cellMap.get(match._id) ?? { avg: null, absent: true };
        let delta: number | null = null;
        if (cell.avg !== null && lastAvg !== null) {
          delta = Math.round((cell.avg - lastAvg) * 100) / 100;
        }
        if (cell.avg !== null) lastAvg = cell.avg;
        return { matchId: match._id, avg: cell.avg, absent: cell.absent, delta };
      });
      rows.push({ userId, displayName, metricKey, cells });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      matches: matchList,
      users: sortedUserIds.map((id) => ({ _id: id, displayName: nameMap.get(id) ?? id })),
      metricKeys: sortedMetricKeys,
      rows
    }
  });
}

export const GET = withApiLogging(_GET, '/api/club-rooms/[id]/history');
