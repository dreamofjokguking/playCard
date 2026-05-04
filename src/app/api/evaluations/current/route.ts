import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Match from '@/lib/models/Match';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

type Metric = {
  key: string;
  label: string;
  order: number;
};

async function _GET(request: NextRequest) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const match = await Match.findOne({
    status: 'evaluating',
    participants: actorId
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  if (!match) {
    return NextResponse.json({ success: true, data: null });
  }

  const clubRoomPromise = ClubRoom.findById(match.clubRoomId).lean();
  const usersPromise = User.find({ _id: { $in: match.participants } })
    .select({ _id: 1, displayName: 1, nickname: 1 })
    .lean();
  const [clubRoom, users] = await Promise.all([clubRoomPromise, usersPromise]);

  const activeMetrics: Metric[] = (clubRoom?.positionMetrics ?? [])
    .filter((metric) => metric.isActive)
    .sort((a, b) => a.order - b.order)
    .map((metric) => ({ key: metric.key, label: metric.label, order: metric.order }));

  return NextResponse.json({
    success: true,
    data: {
      actorId,
      match: {
        _id: String(match._id),
        clubRoomId: match.clubRoomId,
        date: match.date,
        time: match.time,
        participants: match.participants,
        teamAssignments: match.teamAssignments ?? [],
        evaluationsSubmitted: match.evaluationsSubmitted ?? []
      },
      metrics: activeMetrics,
      positionSubmissions: match.positionSubmissions ?? [],
      allPositionSubmitted: (match.positionSubmissions ?? []).length >= match.participants.length,
      participants: users.map((user) => ({
        _id: String(user._id),
        displayName: user.displayName || user.nickname || String(user._id)
      }))
    }
  });
}

export const GET = withApiLogging(_GET, '/api/evaluations/current');
