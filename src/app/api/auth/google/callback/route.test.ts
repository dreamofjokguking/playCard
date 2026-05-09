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
const fetchGoogleUserInfo = vi.fn();
vi.mock('@/lib/googleOAuth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/googleOAuth')>('@/lib/googleOAuth');
  return {
    ...actual,
    exchangeCodeForToken,
    fetchGoogleUserInfo
  };
});

const { GET } = await import('./route');

function buildRequest(params: { code?: string; state?: string; cookieState?: string; error?: string }): NextRequest {
  const url = new URL('http://localhost:3000/api/auth/google/callback');
  if (params.code) url.searchParams.set('code', params.code);
  if (params.state) url.searchParams.set('state', params.state);
  if (params.error) url.searchParams.set('error', params.error);
  const headers = new Headers();
  if (params.cookieState) {
    headers.set('cookie', `playcard_google_oauth_state=${params.cookieState}`);
  }
  return new NextRequest(url, { headers });
}

describe('/api/auth/google/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'g-client';
    process.env.GOOGLE_CLIENT_SECRET = 'g-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    findByIdAndUpdate.mockResolvedValue({});
    create.mockResolvedValue({ _id: 'new-google-user' });
  });

  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('returns 503 when env not configured', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(503);
  });

  it('redirects with state_mismatch error', async () => {
    const res = await GET(buildRequest({ code: 'c', state: 'a', cookieState: 'b' }));
    expect(res.headers.get('location')).toContain('google_error=state_mismatch');
  });

  it('redirects with token_failed when token exchange fails', async () => {
    exchangeCodeForToken.mockResolvedValue({ error: 'invalid_grant' });
    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.headers.get('location')).toContain('google_error=invalid_grant');
  });

  it('creates new User on first google login with email + sets session cookie', async () => {
    exchangeCodeForToken.mockResolvedValue({ access_token: 'at-1' });
    fetchGoogleUserInfo.mockResolvedValue({
      sub: 'sub-9',
      name: '홍길동',
      email: 'g@example.com',
      picture: 'https://lh3.googleusercontent.com/x'
    });
    findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/onboarding');
    expect(create).toHaveBeenCalledTimes(1);

    const payload = create.mock.calls[0][0];
    expect(payload.googleId).toBe('sub-9');
    expect(payload.email).toBe('g@example.com');
    expect(payload.nickname).toBe('홍길동');
    expect(payload.profileImage).toBe('https://lh3.googleusercontent.com/x');

    const cookies = res.headers.get('set-cookie') ?? '';
    expect(cookies).toContain('playcard_session_user_id=new-google-user');
  });

  it('updates existing google user without overwriting nickname', async () => {
    exchangeCodeForToken.mockResolvedValue({ access_token: 'at-1' });
    fetchGoogleUserInfo.mockResolvedValue({
      sub: 'sub-9',
      name: '새이름',
      email: 'new@example.com',
      picture: 'https://lh3.googleusercontent.com/new'
    });
    findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'existing-id',
        nickname: '기존닉',
        displayName: '기존표시',
        email: 'old@example.com'
      })
    });

    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(307);
    expect(create).not.toHaveBeenCalled();
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const update = findByIdAndUpdate.mock.calls[0][1] as { $set: Record<string, string> };
    expect(update.$set.email).toBe('new@example.com');
    expect(update.$set.profileImage).toBe('https://lh3.googleusercontent.com/new');
    expect(update.$set.nickname).toBeUndefined();
  });

  it('passes through google access_denied', async () => {
    const res = await GET(buildRequest({ error: 'access_denied' }));
    expect(res.headers.get('location')).toContain('google_error=access_denied');
  });

  it('rejects user with email_verified === false', async () => {
    exchangeCodeForToken.mockResolvedValue({ access_token: 'at-1' });
    fetchGoogleUserInfo.mockResolvedValue({
      sub: 'sub-9',
      email: 'unverified@example.com',
      email_verified: false,
      name: '미인증유저'
    });

    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('google_error=email_not_verified');
    expect(create).not.toHaveBeenCalled();
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('accepts user with email_verified === true', async () => {
    exchangeCodeForToken.mockResolvedValue({ access_token: 'at-1' });
    fetchGoogleUserInfo.mockResolvedValue({
      sub: 'sub-9',
      email: 'verified@example.com',
      email_verified: true,
      name: '인증유저'
    });
    findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const res = await GET(buildRequest({ code: 'c', state: 's', cookieState: 's' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/onboarding');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
