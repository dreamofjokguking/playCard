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

  const isObjectId = /^[a-fA-F0-9]{24}$/.test(actorId);
  const user = await User.findOne(
    isObjectId
      ? { $or: [{ _id: actorId }, { kakaoId: actorId }] }
      : { kakaoId: actorId }
  ).lean();
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

  let primaryClubRoom: { _id: string; name: string } | null = null;
  const myClubRoomId = user.clubRoomId ? String(user.clubRoomId) : '';
  if (myClubRoomId) {
    const room = await ClubRoom.findById(myClubRoomId).select({ _id: 1, name: 1 }).lean();
    if (room) primaryClubRoom = { _id: String(room._id), name: room.name };
  }
  if (!primaryClubRoom && managedClubRooms.length > 0) {
    primaryClubRoom = { _id: String(managedClubRooms[0]._id), name: managedClubRooms[0].name };
  }

  return NextResponse.json({
    success: true,
    data: {
      actorId,
      role,
      isServiceAdmin,
      displayName: user.displayName || user.nickname || actorId,
      clubRoomId: myClubRoomId,
      primaryClubRoom,
      managedClubRooms: managedClubRooms.map((room) => ({
        _id: String(room._id),
        name: room.name
      }))
    }
  });
}

export const GET = withApiLogging(_GET, '/api/auth/me');
