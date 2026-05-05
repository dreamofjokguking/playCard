import type { NextRequest } from 'next/server';

export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
export const GOOGLE_OAUTH_STATE_COOKIE = 'playcard_google_oauth_state';
export const GOOGLE_OAUTH_SCOPE = 'openid email profile';

type GoogleOAuthConfig =
  | { ok: true; clientId: string; clientSecret: string; redirectUri: string; appUrl: string }
  | { ok: false; message: string };

function resolveAppUrl(request: NextRequest | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
    if (host) return `${proto}://${host}`;
  }
  return '';
}

export function getGoogleOAuthConfig(request: NextRequest | null = null): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? '';
  if (!clientId || !clientSecret) {
    return { ok: false, message: 'GOOGLE_CLIENT_ID/SECRET 환경 변수가 설정되지 않았습니다.' };
  }
  const appUrl = resolveAppUrl(request);
  if (!appUrl) {
    return { ok: false, message: 'NEXT_PUBLIC_APP_URL 환경 변수 또는 요청 호스트를 확인할 수 없습니다.' };
  }
  return {
    ok: true,
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/google/callback`,
    appUrl
  };
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
};

export async function exchangeCodeForToken(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code: params.code
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body
  });
  return (await res.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return (await res.json()) as GoogleUserInfo;
}

export function deriveDisplayName(info: GoogleUserInfo): {
  nickname: string;
  displayName: string;
  profileImage: string;
  email: string;
} {
  const nickname = info.name || info.given_name || (info.email ? info.email.split('@')[0] : `google_${info.sub.slice(0, 6)}`);
  return {
    nickname,
    displayName: nickname,
    profileImage: info.picture || '',
    email: info.email || ''
  };
}
