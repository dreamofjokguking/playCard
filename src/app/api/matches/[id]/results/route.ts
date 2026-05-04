import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Match from '@/lib/models/Match';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { id } = context.params;
  const match = await Match.findById(id).lean();
  if (!match) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!match.participants.includes(actorId)) {
    return NextResponse.json({ success: false, message: '해당 경기 참가자만 결과를 조회할 수 있습니다.' }, { status: 403 });
  }

  if (match.status !== 'completed' || !match.results?.playerStats) {
    return NextResponse.json({ success: false, message: '아직 집계가 완료되지 않았습니다.' }, { status: 400 });
  }

  const users = await User.find({ _id: { $in: match.participants } })
    .select({ _id: 1, displayName: 1, nickname: 1 })
    .lean();
  const nameMap = new Map(users.map((user) => [String(user._id), user.displayName || user.nickname || String(user._id)]));

  const sorted = [...match.results.playerStats].sort((a, b) => b.overall - a.overall);
  const mvpUserId = sorted.reduce(
    (best, row) => {
      if (!best) return row;
      if (row.mvpCount > best.mvpCount) return row;
      if (row.mvpCount === best.mvpCount && row.overall > best.overall) return row;
      return best;
    },
    null as (typeof sorted)[number] | null
  )?.userId;

  return NextResponse.json({
    success: true,
    data: {
      viewerId: actorId,
      match: {
        _id: String(match._id),
        date: match.date,
        time: match.time,
        venue: match.venue,
        teamAssignments: match.teamAssignments ?? []
      },
      mvpUserId: mvpUserId ?? '',
      playerStats: sorted.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        displayName: nameMap.get(row.userId) ?? row.userId,
        metricStats: row.metricStats,
        overall: row.overall,
        absences: row.absences,
        mvpCount: row.mvpCount,
        comments: row.comments
      }))
    }
  });
}

export const GET = withApiLogging(_GET, '/api/matches/[id]/results');
