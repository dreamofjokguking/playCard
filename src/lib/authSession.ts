import type { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'playcard_session_user_id';

export function getActorIdFromSession(request: NextRequest): string {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim() ?? '';
}
