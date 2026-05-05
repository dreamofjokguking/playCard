import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import {
  GOOGLE_AUTHORIZE_URL,
  GOOGLE_OAUTH_SCOPE,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleOAuthConfig
} from '@/lib/googleOAuth';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const config = getGoogleOAuthConfig(request);
  if (!config.ok) {
    return NextResponse.json({ success: false, message: config.message }, { status: 503 });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPE,
    access_type: 'online',
    prompt: 'select_account',
    state
  });

  const response = NextResponse.redirect(`${GOOGLE_AUTHORIZE_URL}?${params.toString()}`);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600
  });
  return response;
}

export const GET = withApiLogging(_GET, '/api/auth/google/start');
