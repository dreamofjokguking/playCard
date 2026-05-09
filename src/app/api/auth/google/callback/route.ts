import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/authSession';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  deriveDisplayName,
  exchangeCodeForToken,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig
} from '@/lib/googleOAuth';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

function redirectToLogin(appUrl: string, error: string): NextResponse {
  const target = new URL('/login', appUrl);
  target.searchParams.set('google_error', error);
  const response = NextResponse.redirect(target);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

async function _GET(request: NextRequest) {
  const config = getGoogleOAuthConfig(request);
  if (!config.ok) {
    return NextResponse.json({ success: false, message: config.message }, { status: 503 });
  }

  const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
  const state = request.nextUrl.searchParams.get('state')?.trim() ?? '';
  const stateCookie = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value?.trim() ?? '';
  const errorParam = request.nextUrl.searchParams.get('error')?.trim() ?? '';

  if (errorParam) {
    return redirectToLogin(config.appUrl, errorParam);
  }
  if (!code) {
    return redirectToLogin(config.appUrl, 'missing_code');
  }
  if (!state || !stateCookie || state !== stateCookie) {
    return redirectToLogin(config.appUrl, 'state_mismatch');
  }

  const token = await exchangeCodeForToken({
    code,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri
  });
  if (!token.access_token) {
    return redirectToLogin(config.appUrl, token.error || 'token_failed');
  }

  let info;
  try {
    info = await fetchGoogleUserInfo(token.access_token);
  } catch {
    return redirectToLogin(config.appUrl, 'userinfo_failed');
  }
  if (!info || !info.sub) {
    return redirectToLogin(config.appUrl, 'userinfo_invalid');
  }

  // 이메일 정보를 받았는데 미검증인 경우 가입 거부
  if (info.email && info.email_verified === false) {
    return redirectToLogin(config.appUrl, 'email_not_verified');
  }

  const googleId = String(info.sub);
  const { nickname, displayName, profileImage, email } = deriveDisplayName(info);

  await dbConnect();
  const existing = await User.findOne({ googleId }).lean();
  let userId: string;
  let needsOnboarding = false;
  if (existing) {
    userId = String(existing._id);
    needsOnboarding = !existing.onboardedAt;
    await User.findByIdAndUpdate(existing._id, {
      $set: {
        ...(profileImage ? { profileImage } : {}),
        ...(email ? { email } : {}),
        ...(existing.nickname ? {} : { nickname }),
        ...(existing.displayName ? {} : { displayName })
      }
    });
  } else {
    const created = await User.create({
      googleId,
      email,
      nickname,
      displayName,
      profileImage,
      role: 'pending',
      status: 'active'
    });
    userId = String(created._id);
    needsOnboarding = true;
  }

  const target = new URL(needsOnboarding ? '/onboarding' : '/', config.appUrl);
  const response = NextResponse.redirect(target);
  response.cookies.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

export const GET = withApiLogging(_GET, '/api/auth/google/callback');
