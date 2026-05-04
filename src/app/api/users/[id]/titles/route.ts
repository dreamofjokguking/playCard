import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = context.params;
  if (id !== actorId) {
    return NextResponse.json({ success: false, message: '본인 칭호 도감만 조회할 수 있습니다.' }, { status: 403 });
  }

  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  const user = await User.findOne(
    isObjectId ? { $or: [{ _id: id }, { kakaoId: id }] } : { kakaoId: id }
  )
    .select({ _id: 1, displayName: 1, nickname: 1, currentTitle: 1, currentRarity: 1, titleHistory: 1 })
    .lean();
  if (!user) {
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const titleHistory = (user.titleHistory ?? []).slice().sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as unknown as string).getTime();
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as unknown as string).getTime();
    return bTime - aTime;
  });

  return NextResponse.json({
    success: true,
    data: {
      user: {
        _id: String(user._id),
        displayName: user.displayName || user.nickname || String(user._id),
        currentTitle: user.currentTitle || '',
        currentRarity: user.currentRarity || 'common'
      },
      titleHistory: titleHistory.map((entry) => ({
        title: entry.title,
        matchId: entry.matchId,
        rarity: entry.rarity || 'common',
        createdAt: entry.createdAt
      }))
    }
  });
}

export const GET = withApiLogging(_GET, '/api/users/[id]/titles');
