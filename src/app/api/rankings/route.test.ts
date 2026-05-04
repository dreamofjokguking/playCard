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

  it('computes previousRank from prior matches', async () => {
    findMatch.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            // 가장 최신 경기 — 제외 시 직전 순위 산출
            {
              date: new Date('2026-05-04'),
              results: {
                playerStats: [
                  { userId: 'u1', overall: 9, mvpCount: 0, metricStats: [{ metricKey: 'attack', avg: 9, count: 1 }] },
                  { userId: 'u2', overall: 6, mvpCount: 0, metricStats: [{ metricKey: 'attack', avg: 6, count: 1 }] }
                ]
              }
            },
            // 그 이전 경기 — 직전 순위는 u2가 1위, u1이 2위였음
            {
              date: new Date('2026-05-01'),
              results: {
                playerStats: [
                  { userId: 'u1', overall: 5, mvpCount: 0, metricStats: [{ metricKey: 'attack', avg: 5, count: 1 }] },
                  { userId: 'u2', overall: 8, mvpCount: 0, metricStats: [{ metricKey: 'attack', avg: 8, count: 1 }] }
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
          { _id: 'u1', displayName: 'A', currentTitle: '' },
          { _id: 'u2', displayName: 'B', currentTitle: '' }
        ])
      })
    });

    const res = await GET(new NextRequest('http://localhost/api/rankings?type=overall'));
    const body = (await res.json()) as { data: Array<{ userId: string; rank: number; previousRank: number | null }> };

    // 누적 평균: u1 = (9+5)/2 = 7, u2 = (6+8)/2 = 7. 동률이지만 displayName으로 정렬 → A(u1)이 1위
    expect(body.data[0].userId).toBe('u1');
    expect(body.data[0].rank).toBe(1);
    // 직전(05-01만 누적): u2(8)가 1위, u1(5)이 2위
    expect(body.data[0].previousRank).toBe(2); // u1의 직전 순위
    expect(body.data[1].userId).toBe('u2');
    expect(body.data[1].previousRank).toBe(1); // u2의 직전 순위
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

