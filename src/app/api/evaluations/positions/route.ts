import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Match from '@/lib/models/Match';
import ClubRoom from '@/lib/models/ClubRoom';
import { broadcastNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

type SubmitPositionBody = {
  matchId?: string;
  selectedMetrics?: string[];
};

async function _POST(request: NextRequest) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json()) as SubmitPositionBody;
  const matchId = body.matchId?.trim() ?? '';
  const selectedMetrics = (body.selectedMetrics ?? []).map((value) => value.trim()).filter(Boolean);

  if (!matchId || selectedMetrics.length === 0) {
    return NextResponse.json({ success: false, message: 'matchId와 selectedMetrics는 필수입니다.' }, { status: 400 });
  }

  const match = await Match.findById(matchId).lean();
  if (!match) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }
  if (!match.participants.includes(actorId)) {
    return NextResponse.json({ success: false, message: '참가자만 포지션을 제출할 수 있습니다.' }, { status: 403 });
  }
  if (match.status !== 'evaluating') {
    return NextResponse.json({ success: false, message: '포지션 제출 가능한 경기 상태가 아닙니다.' }, { status: 400 });
  }

  const clubRoom = await ClubRoom.findById(match.clubRoomId).lean();
  const activeMetricKeys = new Set(
    (clubRoom?.positionMetrics ?? []).filter((metric) => metric.isActive).map((metric) => metric.key)
  );
  const hasInvalid = selectedMetrics.some((key) => !activeMetricKeys.has(key));
  if (hasInvalid) {
    return NextResponse.json({ success: false, message: '유효하지 않은 포지션이 포함되어 있습니다.' }, { status: 400 });
  }

  await Match.findByIdAndUpdate(matchId, {
    $pull: { positionSubmissions: { userId: actorId } }
  });
  await Match.findByIdAndUpdate(matchId, {
    $push: {
      positionSubmissions: {
        userId: actorId,
        selectedMetrics: Array.from(new Set(selectedMetrics)),
        submittedAt: new Date()
      }
    }
  });

  const refreshed = await Match.findById(matchId).lean();
  const allSubmitted = (refreshed?.positionSubmissions ?? []).length >= (refreshed?.participants ?? []).length;

  if (allSubmitted && refreshed) {
    await broadcastNotification({
      userIds: refreshed.participants,
      type: 'evaluation.started',
      title: '평가 시작',
      message: '참여자 포지션 제출이 완료되어 평가를 시작할 수 있습니다.',
      path: '/evaluation',
      clubRoomId: refreshed.clubRoomId,
      matchId: String(refreshed._id)
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      matchId,
      userId: actorId,
      submitted: true,
      allSubmitted
    }
  });
}

export const POST = withApiLogging(_POST, '/api/evaluations/positions');
