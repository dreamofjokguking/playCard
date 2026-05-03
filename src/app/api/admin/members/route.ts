import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { searchParams } = new URL(request.url);
  const clubRoomId = searchParams.get('clubRoomId')?.trim() ?? '';
  const status = searchParams.get('status')?.trim() ?? '';

  if (!access.isServiceAdmin) {
    if (!clubRoomId) {
      return NextResponse.json(
        { success: false, message: '클럽 관리자는 clubRoomId를 지정해야 합니다.' },
        { status: 403 }
      );
    }
    const canManage = await canManageClubRoomById(clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const query: { clubRoomId?: string; status?: string } = {};
  if (clubRoomId) query.clubRoomId = clubRoomId;
  if (status) query.status = status;

  const users = await User.find(query)
    .select({
      _id: 1,
      clubRoomId: 1,
      nickname: 1,
      displayName: 1,
      role: 1,
      status: 1,
      favoriteGroup: 1,
      createdAt: 1
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({ success: true, data: users });
}

export const GET = withApiLogging(_GET, '/api/admin/members');

