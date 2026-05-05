import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorAccess } from '@/lib/accessControl';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

type PatchBody = {
  nickname?: string;
  displayName?: string;
  completeOnboarding?: boolean;
};

async function _PATCH(request: NextRequest) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const body = (await request.json()) as PatchBody;
  const update: { nickname?: string; displayName?: string; onboardedAt?: Date } = {};

  if (typeof body.nickname === 'string') {
    const value = body.nickname.trim();
    if (!value) {
      return NextResponse.json({ success: false, message: '닉네임은 비울 수 없습니다.' }, { status: 400 });
    }
    if (value.length > 20) {
      return NextResponse.json({ success: false, message: '닉네임은 20자 이하여야 합니다.' }, { status: 400 });
    }
    update.nickname = value;
    update.displayName = value;
  }
  if (typeof body.displayName === 'string' && !update.displayName) {
    const value = body.displayName.trim();
    if (value) update.displayName = value;
  }
  if (body.completeOnboarding) {
    update.onboardedAt = new Date();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: false, message: '수정할 필드가 없습니다.' }, { status: 400 });
  }

  const user = await User.findById(access.actorId).lean();
  if (!user) {
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const updated = await User.findByIdAndUpdate(access.actorId, update, { new: true })
    .select({ _id: 1, nickname: 1, displayName: 1, onboardedAt: 1, role: 1 })
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      _id: String(updated?._id),
      nickname: updated?.nickname,
      displayName: updated?.displayName,
      onboardedAt: updated?.onboardedAt ?? null,
      role: updated?.role
    }
  });
}

export const PATCH = withApiLogging(_PATCH, '/api/users/me');
