import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import ClubRoom from '@/lib/models/ClubRoom';
import { isSportType, normalizeMetricInput, type MetricInput } from '@/lib/clubRoomValidation';

export const dynamic = 'force-dynamic';

type CreateClubRoomBody = {
  name?: string;
  sportType?: string;
  ownerId?: string;
  managers?: string[];
  positionMetrics?: MetricInput[];
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
  const name = body?.name?.trim() || '';
  const ownerId = body?.ownerId?.trim() || '';
  const sportType = (body?.sportType?.trim() || 'etc').toLowerCase();
  const managers = (body?.managers ?? []).map((manager) => manager.trim()).filter(Boolean);
  const positionMetrics = body?.positionMetrics ?? [];

  if (!name || !ownerId) {
    return NextResponse.json(
      { success: false, message: 'name과 ownerId는 필수입니다.' },
      { status: 400 }
    );
  }

  if (!isSportType(sportType)) {
    return NextResponse.json(
      {
        success: false,
        message: `sportType은 ${['jokgu', 'soccer', 'baseball', 'etc'].join(', ')} 중 하나여야 합니다.`
      },
      { status: 400 }
    );
  }

  const normalizedMetrics = normalizeMetricInput(positionMetrics);
  if (!normalizedMetrics.ok) {
    return NextResponse.json({ success: false, message: normalizedMetrics.message }, { status: 400 });
  }

  const created = await ClubRoom.create({
    name,
    sportType,
    ownerId,
    managers,
    positionMetrics: normalizedMetrics.data
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
