import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';
import { broadcastNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

type PatchBody = {
  action?: 'accept' | 'reject';
};

async function _PATCH(request: NextRequest, context: { params: { id: string; applicantId: string } }) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { id, applicantId } = context.params;
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

  const application = (club.pendingApplications ?? []).find((app) => app.userId === applicantId);
  if (!application) {
    return NextResponse.json({ success: false, message: '신청을 찾을 수 없습니다.' }, { status: 404 });
  }

  const body = (await request.json()) as PatchBody;
  const action = body.action;
  if (action !== 'accept' && action !== 'reject') {
    return NextResponse.json(
      { success: false, message: 'action은 accept 또는 reject 여야 합니다.' },
      { status: 400 }
    );
  }

  // pendingApplications에서 제거
  await ClubRoom.findByIdAndUpdate(id, {
    $pull: { pendingApplications: { userId: applicantId } }
  });

  if (action === 'accept') {
    // 사용자의 clubRoomId를 이 클럽으로 설정 + role: pending → member
    await User.findByIdAndUpdate(applicantId, {
      clubRoomId: id,
      role: 'member'
    });
    await broadcastNotification({
      userIds: [applicantId],
      type: 'club.application.accepted',
      title: '가입 승인',
      message: `${club.name} 클럽 가입이 승인되었습니다.`,
      path: `/club-rooms/${id}`,
      clubRoomId: id
    });
  } else {
    await broadcastNotification({
      userIds: [applicantId],
      type: 'club.application.rejected',
      title: '가입 거절',
      message: `${club.name} 클럽 가입 신청이 거절되었습니다.`,
      path: '/club-rooms/search',
      clubRoomId: id
    });
  }

  return NextResponse.json({ success: true, data: { action } });
}

export const PATCH = withApiLogging(_PATCH, '/api/club-rooms/[id]/applications/[applicantId]');
