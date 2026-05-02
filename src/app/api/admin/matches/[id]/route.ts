import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import Match from '@/lib/models/Match';

export const dynamic = 'force-dynamic';

type UpdateMatchBody = {
  status?: 'evaluating' | 'completed' | 'cancelled';
  venue?: string;
  time?: string;
  date?: string;
  participants?: string[];
};

async function _PATCH(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { id } = context.params;
  const body = (await request.json()) as UpdateMatchBody;
  const target = await Match.findById(id).lean();
  if (!target) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!access.isServiceAdmin) {
    const canManage = await canManageClubRoomById(target.clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const update: {
    status?: string;
    venue?: string;
    time?: string;
    date?: Date;
    participants?: string[];
  } = {};

  if (body.status) {
    update.status = body.status;
  }
  if (typeof body.venue === 'string') {
    update.venue = body.venue.trim();
  }
  if (typeof body.time === 'string') {
    update.time = body.time.trim();
  }
  if (typeof body.date === 'string') {
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ success: false, message: '유효한 date가 아닙니다.' }, { status: 400 });
    }
    update.date = date;
  }
  if (Array.isArray(body.participants)) {
    update.participants = body.participants.map((v) => v.trim()).filter(Boolean);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: false, message: '수정할 필드가 없습니다.' }, { status: 400 });
  }

  const updated = await Match.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  if (!updated) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export const PATCH = withApiLogging(_PATCH, '/api/admin/matches/[id]');
