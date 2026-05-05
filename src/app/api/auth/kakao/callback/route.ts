import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/authSession';
import {
  KAKAO_OAUTH_STATE_COOKIE,
  deriveDisplayName,
  exchangeCodeForToken,
  fetchKakaoUserInfo,
  getKakaoOAuthConfig
} from '@/lib/kakaoOAuth';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

function redirectToLogin(appUrl: string, error: string): NextResponse {
  const target = new URL('/login', appUrl);
  target.searchParams.set('kakao_error', error);
  const response = NextResponse.redirect(target);
  response.cookies.set(KAKAO_OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

async function _GET(request: NextRequest) {
  const config = getKakaoOAuthConfig(request);
  if (!config.ok) {
    return NextResponse.json({ success: false, message: config.message }, { status: 503 });
  }

  const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
  const state = request.nextUrl.searchParams.get('state')?.trim() ?? '';
  const stateCookie = request.cookies.get(KAKAO_OAUTH_STATE_COOKIE)?.value?.trim() ?? '';
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
    restApiKey: config.restApiKey,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri
  });
  if (!token.access_token) {
    return redirectToLogin(config.appUrl, token.error || 'token_failed');
  }

  let info;
  try {
    info = await fetchKakaoUserInfo(token.access_token);
  } catch {
    return redirectToLogin(config.appUrl, 'userinfo_failed');
  }
  if (!info || !info.id) {
    return redirectToLogin(config.appUrl, 'userinfo_invalid');
  }

  const kakaoId = String(info.id);
  const { nickname, displayName, profileImage } = deriveDisplayName(info);

  await dbConnect();
  const existing = await User.findOne({ kakaoId }).lean();
  let userId: string;
  let needsOnboarding = false;
  if (existing) {
    userId = String(existing._id);
    needsOnboarding = !existing.onboardedAt;
    await User.findByIdAndUpdate(existing._id, {
      $set: {
        ...(profileImage ? { profileImage } : {}),
        ...(existing.nickname ? {} : { nickname }),
        ...(existing.displayName ? {} : { displayName })
      }
    });
  } else {
    const created = await User.create({
      kakaoId,
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
  response.cookies.set(KAKAO_OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

export const GET = withApiLogging(_GET, '/api/auth/kakao/callback');
