import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { SESSION_COOKIE_NAME } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

type SessionBody = {
  userId?: string;
};

async function _GET(request: NextRequest) {
  const userId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  return NextResponse.json({
    success: true,
    data: { userId }
  });
}

async function _POST(request: NextRequest) {
  const body = (await request.json()) as SessionBody;
  const userId = body.userId?.trim() ?? '';
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId는 필수입니다.' },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    data: { userId }
  });
  response.cookies.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });
  return response;
}

async function _DELETE() {
  const response = NextResponse.json({
    success: true,
    data: { signedOut: true }
  });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/'
  });
  return response;
}

export const GET = withApiLogging(_GET, '/api/auth/session');
export const POST = withApiLogging(_POST, '/api/auth/session');
export const DELETE = withApiLogging(_DELETE, '/api/auth/session');
