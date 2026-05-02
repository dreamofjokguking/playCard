import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_COOKIE_NAME } from '@/lib/authSession';

vi.mock('@/lib/apiLogger', () => ({
  withApiLogging: <TArgs extends unknown[]>(
    handler: (request: NextRequest, ...args: TArgs) => Promise<Response>
  ) => handler
}));

const { DELETE, GET, POST } = await import('./route');

describe('/api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null userId when no cookie exists', async () => {
    const request = new NextRequest('http://localhost/api/auth/session');
    const response = await GET(request);
    const body = (await response.json()) as { success: boolean; data: { userId: string | null } };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBeNull();
  });

  it('sets session cookie on sign in', async () => {
    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ userId: 'owner-1' })
    });
    const response = await POST(request);
    const body = (await response.json()) as { success: boolean; data: { userId: string } };
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('owner-1');
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=owner-1`);
  });

  it('clears session cookie on sign out', async () => {
    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'DELETE'
    });
    const response = await DELETE(request);
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(response.status).toBe(200);
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain('Max-Age=0');
  });
});
