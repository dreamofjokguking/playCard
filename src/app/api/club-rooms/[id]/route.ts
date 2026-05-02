import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import ClubRoom from '@/lib/models/ClubRoom';

export const dynamic = 'force-dynamic';

type UpdateClubRoomBody = {
  name?: string;
  sportType?: string;
  ownerId?: string;
  managers?: string[];
  positionMetrics?: Array<{
    key: string;
    label: string;
    isActive?: boolean;
    order?: number;
  }>;
};

async function _GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
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

async function _PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await dbConnect();
  const { id } = context.params;
  const body = (await request.json()) as UpdateClubRoomBody;

  const update: UpdateClubRoomBody = {};
  if (typeof body.name === 'string') {
    update.name = body.name.trim();
  }
  if (typeof body.sportType === 'string') {
    update.sportType = body.sportType.trim();
  }
  if (typeof body.ownerId === 'string') {
    update.ownerId = body.ownerId.trim();
  }
  if (Array.isArray(body.managers)) {
    update.managers = body.managers;
  }
  if (Array.isArray(body.positionMetrics)) {
    update.positionMetrics = body.positionMetrics;
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

async function _DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  await dbConnect();
  const { id } = context.params;

  const deleted = await ClubRoom.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: '클럽룸을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      _id: deleted._id
    }
  });
}

export const DELETE = withApiLogging(_DELETE, '/api/club-rooms/[id]');
