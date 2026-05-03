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

const findMatch = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { find: findMatch }
}));

const findUser = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { find: findUser }
}));

const { GET } = await import('./route');

describe('/api/rankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns overall rankings', async () => {
    findMatch.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              results: {
                playerStats: [
                  {
                    userId: 'u1',
                    overall: 8,
                    mvpCount: 1,
                    metricStats: [{ metricKey: 'attack', avg: 8, count: 1 }]
                  },
                  {
                    userId: 'u2',
                    overall: 7,
                    mvpCount: 0,
                    metricStats: [{ metricKey: 'attack', avg: 7, count: 1 }]
                  }
                ]
              }
            }
          ])
        })
      })
    });
    findUser.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'u1', displayName: '테스터1', currentTitle: '공격수' },
          { _id: 'u2', displayName: '테스터2', currentTitle: '' }
        ])
      })
    });

    const res = await GET(new NextRequest('http://localhost/api/rankings?type=overall'));
    const body = (await res.json()) as { success: boolean; data: Array<{ rank: number; userId: string }> };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].userId).toBe('u1');
    expect(body.data[0].rank).toBe(1);
  });

  it('returns metric rankings', async () => {
    findMatch.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              results: {
                playerStats: [
                  {
                    userId: 'u1',
                    overall: 8,
                    mvpCount: 1,
                    metricStats: [{ metricKey: 'defense', avg: 6, count: 2 }]
                  },
                  {
                    userId: 'u2',
                    overall: 7,
                    mvpCount: 0,
                    metricStats: [{ metricKey: 'defense', avg: 7, count: 2 }]
                  }
                ]
              }
            }
          ])
        })
      })
    });
    findUser.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'u1', displayName: '테스터1', currentTitle: '' },
          { _id: 'u2', displayName: '테스터2', currentTitle: '' }
        ])
      })
    });

    const res = await GET(new NextRequest('http://localhost/api/rankings?type=defense'));
    const body = (await res.json()) as { success: boolean; data: Array<{ userId: string }> };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].userId).toBe('u2');
  });
});

