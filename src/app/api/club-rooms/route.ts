import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import ClubRoom from '@/lib/models/ClubRoom';

export const dynamic = 'force-dynamic';

type CreateClubRoomBody = {
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

async function _GET(_request: NextRequest) {
  await dbConnect();

  // Bootstrap 단계: 목록은 최신 50개로 제한
  const rooms = await ClubRoom.find({}).sort({ createdAt: -1 }).limit(50).lean();

  return NextResponse.json({
    success: true,
    data: rooms
  });
}

async function _POST(request: NextRequest) {
  await dbConnect();

  const body = (await request.json()) as CreateClubRoomBody;
  if (!body?.name || !body?.ownerId) {
    return NextResponse.json(
      { success: false, message: 'name과 ownerId는 필수입니다.' },
      { status: 400 }
    );
  }

  const created = await ClubRoom.create({
    name: body.name.trim(),
    sportType: body.sportType?.trim() || 'etc',
    ownerId: body.ownerId.trim(),
    managers: body.managers ?? [],
    positionMetrics: body.positionMetrics ?? []
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        _id: created._id,
        name: created.name,
        sportType: created.sportType
      }
    },
    { status: 201 }
  );
}

export const GET = withApiLogging(_GET, '/api/club-rooms');
export const POST = withApiLogging(_POST, '/api/club-rooms');
