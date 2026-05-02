import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getActorIdFromSession } from '@/lib/authSession';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';

export type ActorAccess = {
  actorId: string;
  role: string;
  isServiceAdmin: boolean;
};

export async function getActorAccess(request: NextRequest): Promise<
  | { ok: false; response: NextResponse }
  | { ok: true; access: ActorAccess }
> {
  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
    };
  }

  const actor = await User.findById(actorId).lean();
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' }, { status: 401 })
    };
  }

  const role = actor.role ?? '';
  const isServiceAdmin = role === 'service_admin' || role === 'admin';
  return {
    ok: true,
    access: { actorId, role, isServiceAdmin }
  };
}

export async function canManageClubRoomById(clubRoomId: string, actorId: string): Promise<boolean> {
  const room = await ClubRoom.findById(clubRoomId).lean();
  if (!room) {
    return false;
  }
  if (room.ownerId === actorId) {
    return true;
  }
  return Array.isArray(room.managers) && room.managers.includes(actorId);
}
