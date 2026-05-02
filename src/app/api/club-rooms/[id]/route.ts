import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import ClubRoom from '@/lib/models/ClubRoom';
import { getActorIdFromSession } from '@/lib/authSession';
import { isSportType, normalizeMetricInput, type MetricInput } from '@/lib/clubRoomValidation';

export const dynamic = 'force-dynamic';

type UpdateClubRoomBody = {
  name?: string;
  sportType?: string;
  ownerId?: string;
  managers?: string[];
  positionMetrics?: MetricInput[];
};

function canManageClubRoom(
  actorId: string,
  room: { ownerId: string; managers?: string[] } | null
) {
  if (!actorId || !room) {
    return false;
  }
  if (room.ownerId === actorId) {
    return true;
  }
  return Array.isArray(room.managers) && room.managers.includes(actorId);
}

async function _GET(_request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const { id } = context.params;
  const room = await ClubRoom.findById(id).lean();
  if (!room) {
    return NextResponse.json(
      { success: false, message: '클럽룸을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: room
  });
}

export const GET = withApiLogging(_GET, '/api/club-rooms/[id]');

async function _PATCH(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } = context.params;
  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const existing = await ClubRoom.findById(id);
  if (!existing) {
    return NextResponse.json(
      { success: false, message: '클럽룸을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  if (!canManageClubRoom(actorId, existing)) {
    return NextResponse.json({ success: false, message: '수정 권한이 없습니다.' }, { status: 403 });
  }

  const body = (await request.json()) as UpdateClubRoomBody;
  const update: UpdateClubRoomBody = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'name은 비어 있을 수 없습니다.' },
        { status: 400 }
      );
    }
    update.name = name;
  }

  if (typeof body.sportType === 'string') {
    const sportType = body.sportType.trim().toLowerCase();
    if (!isSportType(sportType)) {
      return NextResponse.json(
        { success: false, message: 'sportType은 jokgu, soccer, baseball, etc 중 하나여야 합니다.' },
        { status: 400 }
      );
    }
    update.sportType = sportType;
  }

  if (typeof body.ownerId === 'string') {
    const ownerId = body.ownerId.trim();
    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: 'ownerId는 비어 있을 수 없습니다.' },
        { status: 400 }
      );
    }
    update.ownerId = ownerId;
  }

  if (Array.isArray(body.managers)) {
    update.managers = body.managers.map((manager) => manager.trim()).filter(Boolean);
  }

  if (Array.isArray(body.positionMetrics)) {
    const normalizedMetrics = normalizeMetricInput(body.positionMetrics);
    if (!normalizedMetrics.ok) {
      return NextResponse.json(
        { success: false, message: normalizedMetrics.message },
        { status: 400 }
      );
    }
    update.positionMetrics = normalizedMetrics.data;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, message: '수정할 필드가 없습니다.' },
      { status: 400 }
    );
  }

  const updated = await ClubRoom.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  }).lean();

  if (!updated) {
    return NextResponse.json(
      { success: false, message: '클럽룸을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: updated
  });
}

export const PATCH = withApiLogging(_PATCH, '/api/club-rooms/[id]');

async function _DELETE(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } = context.params;
  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const existing = await ClubRoom.findById(id);
  if (!existing) {
    return NextResponse.json(
      { success: false, message: '클럽룸을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  if (!canManageClubRoom(actorId, existing)) {
    return NextResponse.json({ success: false, message: '삭제 권한이 없습니다.' }, { status: 403 });
  }

  const deleted = await ClubRoom.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: '클럽룸을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { _id: deleted._id }
  });
}

export const DELETE = withApiLogging(_DELETE, '/api/club-rooms/[id]');
