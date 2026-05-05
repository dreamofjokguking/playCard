import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiLogger', () => ({
  withApiLogging: <TArgs extends unknown[]>(
    handler: (request: NextRequest, ...args: TArgs) => Promise<Response>
  ) => handler
}));

vi.mock('@/lib/db', () => ({
  dbConnect: vi.fn().mockResolvedValue(undefined)
}));

const findOne = vi.fn();
const findByIdAndUpdate = vi.fn();
const create = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { findOne, findByIdAndUpdate, create }
}));

const exchangeCodeForToken = vi.fn();
const fetchKakaoUserInfo = vi.fn();
vi.mock('@/lib/kakaoOAuth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/kakaoOAuth')>('@/lib/kakaoOAuth');
  return {
    ...actual,
    exchangeCodeForToken,
    fetchKakaoUserInfo
  };
});

const { GET } = await import('./route');

function buildRequest(params: { code?: string; state?: string; cookieState?: string; error?: string }): NextRequest {
  const url = new URL('http://localhost:3000/api/auth/kakao/callback');
  if (params.code) url.searchParams.set('code', params.code);
  if (params.state) url.searchParams.set('state', params.state);
  if (params.error) url.searchParams.set('error', params.error);
  const headers = new Headers();
  if (params.cookieState) {
    headers.set('cookie', `playcard_kakao_oauth_state=${params.cookieState}`);
  }
  return new NextRequest(url, { headers });
}

describe('/api/auth/kakao/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KAKAO_REST_API_KEY = 'k1';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    findByIdAndUpdate.mockResolvedValue({});
    create.mockResolvedValue({ _id: 'new-user-id' });
  });

  afterEach(() => {
    delete process.env.KAKAO_REST_API_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('returns 503 when env not configured', async () => {
    delete process.env.KAKAO_REST_API_KEY;
    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(503);
  });

  it('redirects to /login with error when state mismatch', async () => {
    const res = await GET(buildRequest({ code: 'c', state: 'a', cookieState: 'b' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('kakao_error=state_mismatch');
  });

  it('redirects to /login when token exchange fails', async () => {
    exchangeCodeForToken.mockResolvedValue({ error: 'invalid_grant' });
    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.headers.get('location')).toContain('kakao_error=invalid_grant');
  });

  it('creates new User on first kakao login and sets session cookie', async () => {
    exchangeCodeForToken.mockResolvedValue({ access_token: 'at-1' });
    fetchKakaoUserInfo.mockResolvedValue({
      id: 999,
      kakao_account: { profile: { nickname: '홍길동', profile_image_url: 'https://img/x.jpg' } }
    });
    findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
    expect(create).toHaveBeenCalledTimes(1);

    const createPayload = create.mock.calls[0][0];
    expect(createPayload.kakaoId).toBe('999');
    expect(createPayload.nickname).toBe('홍길동');
    expect(createPayload.profileImage).toBe('https://img/x.jpg');
    expect(createPayload.role).toBe('pending');

    const cookies = res.headers.get('set-cookie') ?? '';
    expect(cookies).toContain('playcard_session_user_id=new-user-id');
  });

  it('updates existing User profile image without overwriting nickname/displayName', async () => {
    exchangeCodeForToken.mockResolvedValue({ access_token: 'at-1' });
    fetchKakaoUserInfo.mockResolvedValue({
      id: 999,
      kakao_account: { profile: { nickname: '새이름', profile_image_url: 'https://img/new.jpg' } }
    });
    findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'existing-id',
        nickname: '기존닉',
        displayName: '기존표시',
        profileImage: 'https://img/old.jpg'
      })
    });

    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(307);
    expect(create).not.toHaveBeenCalled();
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = findByIdAndUpdate.mock.calls[0][1] as { $set: Record<string, string> };
    expect(updatePayload.$set.profileImage).toBe('https://img/new.jpg');
    expect(updatePayload.$set.nickname).toBeUndefined();
    expect(updatePayload.$set.displayName).toBeUndefined();

    const cookies = res.headers.get('set-cookie') ?? '';
    expect(cookies).toContain('playcard_session_user_id=existing-id');
  });

  it('passes through Kakao error param in redirect', async () => {
    const res = await GET(buildRequest({ error: 'access_denied' }));
    expect(res.headers.get('location')).toContain('kakao_error=access_denied');
  });
});
