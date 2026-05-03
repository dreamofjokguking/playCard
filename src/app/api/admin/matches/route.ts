import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import Match from '@/lib/models/Match';
import { broadcastNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

type CreateMatchBody = {
  clubRoomId?: string;
  date?: string;
  time?: string;
  venue?: string;
  participants?: string[];
  evaluationDeadline?: string;
};

async function _GET(request: NextRequest) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status')?.trim();
  const clubRoomId = searchParams.get('clubRoomId')?.trim();

  if (!access.isServiceAdmin && !clubRoomId) {
    return NextResponse.json(
      { success: false, message: '클럽 관리자는 clubRoomId를 지정해야 합니다.' },
      { status: 403 }
    );
  }

  if (!access.isServiceAdmin && clubRoomId) {
    const canManage = await canManageClubRoomById(clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const query: { status?: string; clubRoomId?: string } = {};
  if (status) query.status = status;
  if (clubRoomId) query.clubRoomId = clubRoomId;

  const matches = await Match.find(query).sort({ date: -1, time: -1 }).limit(100).lean();
  return NextResponse.json({ success: true, data: matches });
}

async function _POST(request: NextRequest) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const body = (await request.json()) as CreateMatchBody;
  const clubRoomId = body.clubRoomId?.trim() ?? '';
  const dateRaw = body.date?.trim() ?? '';
  const time = body.time?.trim() ?? '';
  const venue = body.venue?.trim() ?? '';
  const participants = (body.participants ?? []).map((v) => v.trim()).filter(Boolean);
  const evaluationDeadlineRaw = body.evaluationDeadline?.trim() ?? '';

  if (!clubRoomId || !dateRaw || !time || participants.length === 0) {
    return NextResponse.json(
      { success: false, message: 'clubRoomId, date, time, participants는 필수입니다.' },
      { status: 400 }
    );
  }

  if (!access.isServiceAdmin) {
    const canManage = await canManageClubRoomById(clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ success: false, message: '유효한 date가 아닙니다.' }, { status: 400 });
  }

  let evaluationDeadline: Date | undefined;
  if (evaluationDeadlineRaw) {
    const parsed = new Date(evaluationDeadlineRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { success: false, message: '유효한 evaluationDeadline이 아닙니다.' },
        { status: 400 }
      );
    }
    evaluationDeadline = parsed;
  }

  const created = await Match.create({
    clubRoomId,
    date,
    time,
    venue,
    participants,
    status: 'evaluating',
    evaluationDeadline,
    createdBy: access.actorId
  });

  await broadcastNotification({
    userIds: participants,
    type: 'evaluation.position.requested',
    title: '포지션 선택 요청',
    message: '경기 포지션 선택을 제출해주세요.',
    path: '/evaluation',
    clubRoomId,
    matchId: String(created._id)
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}

export const GET = withApiLogging(_GET, '/api/admin/matches');
export const POST = withApiLogging(_POST, '/api/admin/matches');
