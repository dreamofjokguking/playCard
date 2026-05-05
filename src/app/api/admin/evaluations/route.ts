import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import Evaluation from '@/lib/models/Evaluation';
import Match from '@/lib/models/Match';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const matchId = request.nextUrl.searchParams.get('matchId')?.trim() ?? '';
  if (!matchId) {
    return NextResponse.json({ success: false, message: 'matchId는 필수입니다.' }, { status: 400 });
  }

  const match = await Match.findById(matchId).lean();
  if (!match) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!access.isServiceAdmin) {
    const canManage = await canManageClubRoomById(match.clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const evaluations = await Evaluation.find({ matchId }).lean();
  const userIds = Array.from(
    new Set([
      ...evaluations.map((evaluation) => evaluation.evaluatorId),
      ...evaluations.flatMap((evaluation) => evaluation.ratings.map((rating) => rating.targetUserId)),
      ...match.participants
    ])
  );
  const users = await User.find({ _id: { $in: userIds } })
    .select({ _id: 1, displayName: 1, nickname: 1 })
    .lean();
  const nameMap = new Map(
    users.map((user) => [String(user._id), user.displayName || user.nickname || String(user._id)])
  );

  return NextResponse.json({
    success: true,
    data: {
      match: {
        _id: String(match._id),
        clubRoomId: match.clubRoomId,
        status: match.status,
        participants: match.participants,
        positionSubmissions: match.positionSubmissions ?? []
      },
      evaluations: evaluations.map((evaluation) => ({
        _id: String(evaluation._id),
        evaluatorId: evaluation.evaluatorId,
        evaluatorName: nameMap.get(evaluation.evaluatorId) ?? evaluation.evaluatorId,
        ratings: evaluation.ratings,
        mvpPick: evaluation.mvpPick,
        submittedAt: evaluation.submittedAt,
        editLog: (evaluation.editLog ?? []).map((entry) => ({
          editorId: entry.editorId,
          editorName: nameMap.get(entry.editorId) ?? entry.editorId,
          editedAt: entry.editedAt,
          reason: entry.reason,
          prevMvpPick: entry.prevMvpPick
        }))
      })),
      nameMap: Object.fromEntries(nameMap)
    }
  });
}

export const GET = withApiLogging(_GET, '/api/admin/evaluations');
