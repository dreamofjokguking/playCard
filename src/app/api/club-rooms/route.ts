import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';
import {
  isSportType,
  normalizeCategory,
  normalizeDescription,
  normalizeMetricInput,
  type MetricInput
} from '@/lib/clubRoomValidation';

export const dynamic = 'force-dynamic';

type CreateClubRoomBody = {
  name?: string;
  sportType?: string;
  category?: string;
  description?: string;
  coverImage?: string;
  ownerId?: string;
  managers?: string[];
  positionMetrics?: MetricInput[];
};

async function _GET(_request: NextRequest) {
  await dbConnect();
  const rooms = await ClubRoom.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .select({ _id: 1, name: 1, sportType: 1, category: 1, description: 1, coverImage: 1, managers: 1, ownerId: 1 })
    .lean();
  return NextResponse.json({ success: true, data: rooms });
}

async function _POST(request: NextRequest) {
  await dbConnect();

  const body = (await request.json()) as CreateClubRoomBody;
  const name = body?.name?.trim() || '';
  const ownerId = body?.ownerId?.trim() || '';
  const sportType = (body?.sportType?.trim() || 'etc').toLowerCase();
  const category = normalizeCategory(body?.category);
  const description = normalizeDescription(body?.description);
  const coverImage = body?.coverImage?.trim() ?? '';
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
        message: 'sportType은 jokgu, soccer, baseball, etc 중 하나여야 합니다.'
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
    category,
    description,
    coverImage,
    ownerId,
    managers,
    positionMetrics: normalizedMetrics.data
  });

  // 클럽 owner는 자동으로 admin role + 본인 클럽으로 자동 합류
  await User.findByIdAndUpdate(ownerId, {
    $set: {
      role: 'admin',
      clubRoomId: String(created._id),
      onboardedAt: new Date()
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        _id: created._id,
        name: created.name,
        sportType: created.sportType,
        category: created.category,
        description: created.description,
        coverImage: created.coverImage
      }
    },
    { status: 201 }
  );
}

export const GET = withApiLogging(_GET, '/api/club-rooms');
export const POST = withApiLogging(_POST, '/api/club-rooms');
