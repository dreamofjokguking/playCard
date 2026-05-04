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

const findOne = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { findOne }
}));
const findById = vi.fn();
vi.mock('@/lib/models/ClubRoom', () => ({
  default: { findById }
}));
const find = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { find }
}));

const { GET } = await import('./route');

describe('/api/evaluations/current', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    getActorIdFromSession.mockReturnValue('');
    const res = await GET(new NextRequest('http://localhost/api/evaluations/current'));
    expect(res.status).toBe(401);
  });

  it('returns null data when no evaluating match', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findOne.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      })
    });
    const res = await GET(new NextRequest('http://localhost/api/evaluations/current'));
    const body = (await res.json()) as { success: boolean; data: null };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('returns evaluating match with participants and team assignments', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findOne.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'm1',
          clubRoomId: 'room-1',
          date: new Date('2026-05-04'),
          time: '19:00',
          participants: ['u1', 'u2'],
          teamAssignments: [{ userId: 'u1', team: 'red' }],
          positionSubmissions: [],
          evaluationsSubmitted: []
        })
      })
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        positionMetrics: []
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

    const res = await GET(new NextRequest('http://localhost/api/evaluations/current'));
    const body = (await res.json()) as {
      success: boolean;
      data: { match: { _id: string; teamAssignments: Array<{ userId: string; team: string }> } };
    };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.match._id).toBe('m1');
    expect(body.data.match.teamAssignments).toEqual([{ userId: 'u1', team: 'red' }]);
  });
});

