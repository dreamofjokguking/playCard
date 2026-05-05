import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { KAKAO_AUTHORIZE_URL, KAKAO_OAUTH_STATE_COOKIE, getKakaoOAuthConfig } from '@/lib/kakaoOAuth';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const config = getKakaoOAuthConfig(request);
  if (!config.ok) {
    return NextResponse.json({ success: false, message: config.message }, { status: 503 });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state
  });

  const response = NextResponse.redirect(`${KAKAO_AUTHORIZE_URL}?${params.toString()}`);
  response.cookies.set(KAKAO_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600
  });
  return response;
}

export const GET = withApiLogging(_GET, '/api/auth/kakao/start');
