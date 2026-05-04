import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: '운영 환경에서는 실행할 수 없습니다.' }, { status: 403 });
  }
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const isObjectId = /^[a-fA-F0-9]{24}$/.test(actorId);
  const user = await User.findOne(
    isObjectId ? { $or: [{ _id: actorId }, { kakaoId: actorId }] } : { kakaoId: actorId }
  );

  if (!user) {
    // 사용자가 DB에 없으면 service_admin으로 신규 생성 (kakaoId 기반)
    const created = await User.create({
      kakaoId: actorId,
      nickname: actorId,
      displayName: actorId,
      role: 'service_admin',
      status: 'active'
    });
    return NextResponse.json({
      success: true,
      data: {
        action: 'created',
        userId: String(created._id),
        kakaoId: created.kakaoId,
        role: created.role
      }
    });
  }

  user.role = 'service_admin';
  await user.save();
  return NextResponse.json({
    success: true,
    data: {
      action: 'updated',
      userId: String(user._id),
      kakaoId: user.kakaoId,
      role: user.role
    }
  });
}

export const POST = withApiLogging(_POST, '/api/dev/promote');
