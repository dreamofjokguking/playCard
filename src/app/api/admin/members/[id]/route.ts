import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

type UpdateMemberBody = {
  role?: 'pending' | 'member' | 'admin';
  status?: 'active' | 'inactive';
  displayName?: string;
  favoriteGroup?: boolean;
};

async function _PATCH(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { id } = context.params;
  const target = await User.findById(id).lean();
  if (!target) {
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!access.isServiceAdmin) {
    const canManage = await canManageClubRoomById(target.clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const body = (await request.json()) as UpdateMemberBody;
  const update: UpdateMemberBody = {};
  if (body.role) update.role = body.role;
  if (body.status) update.status = body.status;
  if (typeof body.displayName === 'string') update.displayName = body.displayName.trim();
  if (typeof body.favoriteGroup === 'boolean') update.favoriteGroup = body.favoriteGroup;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: false, message: '수정할 필드가 없습니다.' }, { status: 400 });
  }

  const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
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
    .lean();

  if (!updated) {
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export const PATCH = withApiLogging(_PATCH, '/api/admin/members/[id]');

