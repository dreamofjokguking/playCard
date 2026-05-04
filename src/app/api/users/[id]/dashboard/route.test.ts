import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiLogger', () => ({
  withApiLogging: <TArgs extends unknown[]>(
    handler: (request: NextRequest, ...args: TArgs) => Promise<Response>
  ) => handler
}));

vi.mock('@/lib/db', () => ({
  dbConnect: vi.fn().mockResolvedValue(undefined)
}));

const getActorIdFromSession = vi.fn();
vi.mock('@/lib/authSession', () => ({
  getActorIdFromSession
}));

const findMatch = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { find: findMatch }
}));

const findOneUser = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { findOne: findOneUser }
}));

const { GET } = await import('./route');

describe('/api/users/[id]/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-self access', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    const req = new NextRequest('http://localhost/api/users/u2/dashboard');
    const res = await GET(req, { params: { id: 'u2' } });
    expect(res.status).toBe(403);
  });

  it('returns dashboard data for self', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findOneUser.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'u1', displayName: '테스터1', currentTitle: '수비왕' })
      })
    });
    findMatch.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: 'm1',
              date: new Date('2026-05-01'),
              results: {
                playerStats: [
                  {
                    userId: 'u1',
                    overall: 8,
                    metricStats: [{ metricKey: 'defense', avg: 8, count: 1 }]
                  }
                ]
              }
            }
          ])
        })
      })
    });

    const req = new NextRequest('http://localhost/api/users/u1/dashboard');
    const res = await GET(req, { params: { id: 'u1' } });
    const body = (await res.json()) as { success: boolean; data?: { timeline?: Array<{ overall: number }> } };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.timeline?.[0]?.overall).toBe(8);
  });
});

