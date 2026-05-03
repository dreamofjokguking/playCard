import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Notification from '@/lib/models/Notification';

export const dynamic = 'force-dynamic';

type ReadBody = {
  notificationId?: string;
  all?: boolean;
};

async function _PATCH(request: NextRequest) {
  await dbConnect();
  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json()) as ReadBody;
  if (body.all) {
    await Notification.updateMany({ userId: actorId, read: false }, { read: true });
    return NextResponse.json({ success: true, data: { all: true } });
  }

  const notificationId = body.notificationId?.trim() ?? '';
  if (!notificationId) {
    return NextResponse.json({ success: false, message: 'notificationId 또는 all=true가 필요합니다.' }, { status: 400 });
  }

  await Notification.updateOne({ _id: notificationId, userId: actorId }, { read: true });
  return NextResponse.json({ success: true, data: { notificationId } });
}

export const PATCH = withApiLogging(_PATCH, '/api/notifications/read');

