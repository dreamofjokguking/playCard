import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Notification from '@/lib/models/Notification';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  await dbConnect();
  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const query: { userId: string; read?: boolean } = { userId: actorId };
  if (unreadOnly) query.read = false;

  const rows = await Notification.find(query).sort({ sentAt: -1 }).limit(100).lean();
  return NextResponse.json({ success: true, data: rows });
}

export const GET = withApiLogging(_GET, '/api/notifications');

