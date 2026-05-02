import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const user = await User.findById(actorId).lean();
  if (!user) {
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const role = user.role ?? 'member';
  const isServiceAdmin = role === 'service_admin' || role === 'admin';
  const managedClubRooms = await ClubRoom.find({
    $or: [{ ownerId: actorId }, { managers: actorId }]
  })
    .select({ _id: 1, name: 1 })
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      actorId,
      role,
      isServiceAdmin,
      managedClubRooms: managedClubRooms.map((room) => ({
        _id: String(room._id),
        name: room.name
      }))
    }
  });
}

export const GET = withApiLogging(_GET, '/api/auth/me');
