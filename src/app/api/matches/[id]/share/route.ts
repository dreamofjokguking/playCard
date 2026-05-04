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

  const isObjectId = /^[a-fA-F0-9]{24}$/.test(actorId);
  const actor = await User.findOne(
    isObjectId ? { $or: [{ _id: actorId }, { kakaoId: actorId }] } : { kakaoId: actorId }
  )
    .select({ _id: 1, clubRoomId: 1 })
    .lean();
  if (!actor) {
    return NextResponse.json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { id } = context.params;
  const match = await Match.findById(id).lean();
  if (!match) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  if ((actor.clubRoomId ?? '') !== (match.clubRoomId ?? '')) {
    return NextResponse.json({ success: false, message: '같은 클럽 소속만 공유 화면을 볼 수 있습니다.' }, { status: 403 });
  }

  const participants = match.participants ?? [];
  const users = await User.find({ _id: { $in: participants } })
    .select({ _id: 1, displayName: 1, nickname: 1 })
    .lean();
  const nameMap = new Map(users.map((user) => [String(user._id), user.displayName || user.nickname || String(user._id)]));

  return NextResponse.json({
    success: true,
    data: {
      _id: String(match._id),
      clubRoomId: match.clubRoomId,
      participants,
      participantRows: participants.map((id) => ({
        _id: id,
        displayName: nameMap.get(id) ?? id
      })),
      teamAssignments: match.teamAssignments ?? []
    }
  });
}

export const GET = withApiLogging(_GET, '/api/matches/[id]/share');
