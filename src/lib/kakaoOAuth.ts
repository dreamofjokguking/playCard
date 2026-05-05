import type { NextRequest } from 'next/server';

export const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
export const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
export const KAKAO_USERINFO_URL = 'https://kapi.kakao.com/v2/user/me';
export const KAKAO_OAUTH_STATE_COOKIE = 'playcard_kakao_oauth_state';

type KakaoOAuthConfig =
  | { ok: true; restApiKey: string; clientSecret: string; redirectUri: string; appUrl: string }
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

export function getKakaoOAuthConfig(request: NextRequest | null = null): KakaoOAuthConfig {
  const restApiKey = process.env.KAKAO_REST_API_KEY?.trim() ?? '';
  if (!restApiKey) {
    return { ok: false, message: 'KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다.' };
  }
  const appUrl = resolveAppUrl(request);
  if (!appUrl) {
    return { ok: false, message: 'NEXT_PUBLIC_APP_URL 환경 변수 또는 요청 호스트를 확인할 수 없습니다.' };
  }
  return {
    ok: true,
    restApiKey,
    clientSecret: process.env.KAKAO_CLIENT_SECRET?.trim() ?? '',
    redirectUri: `${appUrl}/api/auth/kakao/callback`,
    appUrl
  };
}

export function isKakaoOAuthConfigured(): boolean {
  return Boolean(process.env.KAKAO_REST_API_KEY?.trim());
}

export type KakaoTokenResponse = {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export type KakaoUserInfo = {
  id: number | string;
  properties?: { nickname?: string; profile_image?: string };
  kakao_account?: {
    profile?: { nickname?: string; profile_image_url?: string };
    email?: string;
  };
};

export async function exchangeCodeForToken(params: {
  code: string;
  restApiKey: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<KakaoTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.restApiKey,
    redirect_uri: params.redirectUri,
    code: params.code
  });
  if (params.clientSecret) body.set('client_secret', params.clientSecret);

  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body
  });
  return (await res.json()) as KakaoTokenResponse;
}

export async function fetchKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const res = await fetch(KAKAO_USERINFO_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return (await res.json()) as KakaoUserInfo;
}

export function deriveDisplayName(info: KakaoUserInfo): { nickname: string; displayName: string; profileImage: string } {
  const nickname =
    info.kakao_account?.profile?.nickname ||
    info.properties?.nickname ||
    `kakao_${String(info.id).slice(0, 6)}`;
  const profileImage =
    info.kakao_account?.profile?.profile_image_url || info.properties?.profile_image || '';
  return { nickname, displayName: nickname, profileImage };
}
