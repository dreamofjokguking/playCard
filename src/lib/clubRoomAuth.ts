import type { NextRequest } from 'next/server';
import type { ClubRoomDocument } from '@/lib/models/ClubRoom';

export function getActorIdFromRequest(request: NextRequest): string {
  return request.headers.get('x-actor-id')?.trim() ?? '';
}

export function canManageClubRoom(actorId: string, room: ClubRoomDocument | null): boolean {
  if (!actorId || !room) {
    return false;
  }
  if (room.ownerId === actorId) {
    return true;
  }
  return Array.isArray(room.managers) && room.managers.includes(actorId);
}
