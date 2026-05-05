import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

type ApplyBody = {
  message?: string;
};

async function _POST(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { id } = context.params;
  const club = await ClubRoom.findById(id).lean();
  if (!club) {
    return NextResponse.json({ success: false, message: '클럽을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 이미 멤버이거나 owner/manager인 경우 차단
  if (club.ownerId === access.actorId || club.managers.includes(access.actorId)) {
    return NextResponse.json(
      { success: false, message: '이미 이 클럽의 운영자입니다.' },
      { status: 400 }
    );
  }

  const user = await User.findById(access.actorId).lean();
  if (user?.clubRoomId === id) {
    return NextResponse.json({ success: false, message: '이미 이 클럽의 멤버입니다.' }, { status: 400 });
  }

  const alreadyApplied = (club.pendingApplications ?? []).some((app) => app.userId === access.actorId);
  if (alreadyApplied) {
    return NextResponse.json({ success: false, message: '이미 가입 신청을 보냈습니다.' }, { status: 409 });
  }

  const body = (await request.json().catch(() => ({}))) as ApplyBody;
  const message = (body.message ?? '').trim().slice(0, 200);

  await ClubRoom.findByIdAndUpdate(id, {
    $push: {
      pendingApplications: {
        userId: access.actorId,
        message,
        requestedAt: new Date()
      }
    }
  });

  return NextResponse.json({ success: true, data: { applied: true } }, { status: 201 });
}

async function _GET(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { id } = context.params;
  const club = await ClubRoom.findById(id).lean();
  if (!club) {
    return NextResponse.json({ success: false, message: '클럽을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!access.isServiceAdmin) {
    const canManage = await canManageClubRoomById(id, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const applications = club.pendingApplications ?? [];
  const userIds = applications.map((app) => app.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select({ _id: 1, displayName: 1, nickname: 1, profileImage: 1 })
    .lean();
  const userMap = new Map(
    users.map((u) => [
      String(u._id),
      {
        displayName: u.displayName || u.nickname || String(u._id),
        profileImage: u.profileImage || ''
      }
    ])
  );

  return NextResponse.json({
    success: true,
    data: applications.map((app) => ({
      userId: app.userId,
      displayName: userMap.get(app.userId)?.displayName ?? app.userId,
      profileImage: userMap.get(app.userId)?.profileImage ?? '',
      message: app.message,
      requestedAt: app.requestedAt
    }))
  });
}

export const POST = withApiLogging(_POST, '/api/club-rooms/[id]/applications');
export const GET = withApiLogging(_GET, '/api/club-rooms/[id]/applications');
