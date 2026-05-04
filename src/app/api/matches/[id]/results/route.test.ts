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

const findById = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { findById }
}));

const find = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { find }
}));

const { GET } = await import('./route');

describe('/api/matches/[id]/results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    getActorIdFromSession.mockReturnValue('');
    const res = await GET(new NextRequest('http://localhost/api/matches/m1/results'), { params: { id: 'm1' } });
    expect(res.status).toBe(401);
  });

  it('returns 400 when match is not completed', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        status: 'evaluating',
        participants: ['u1'],
        results: null
      })
    });
    const res = await GET(new NextRequest('http://localhost/api/matches/m1/results'), { params: { id: 'm1' } });
    expect(res.status).toBe(400);
  });

  it('returns result payload including team assignments', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        date: new Date('2026-05-04'),
        time: '19:00',
        venue: 'A구장',
        status: 'completed',
        participants: ['u1', 'u2'],
        teamAssignments: [{ userId: 'u1', team: 'red' }],
        results: {
          playerStats: [
            { userId: 'u1', metricStats: [], overall: 8.2, absences: [], mvpCount: 1, comments: [] },
            { userId: 'u2', metricStats: [], overall: 7.8, absences: [], mvpCount: 0, comments: [] }
          ]
        }
      })
    });
    find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'u1', displayName: 'Tester1', nickname: 'Tester1' },
          { _id: 'u2', displayName: 'Tester2', nickname: 'Tester2' }
        ])
      })
    });

    const res = await GET(new NextRequest('http://localhost/api/matches/m1/results'), { params: { id: 'm1' } });
    const body = (await res.json()) as {
      success: boolean;
      data: { match: { teamAssignments: Array<{ userId: string; team: string }> } };
    };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.match.teamAssignments).toEqual([{ userId: 'u1', team: 'red' }]);
  });
});

