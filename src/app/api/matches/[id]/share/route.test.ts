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

const findOneUser = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { findOne: findOneUser }
}));

const findByIdMatch = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { findById: findByIdMatch }
}));

const { GET } = await import('./route');

describe('/api/matches/[id]/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    getActorIdFromSession.mockReturnValue('');
    const res = await GET(new NextRequest('http://localhost/api/matches/m1/share'), { params: { id: 'm1' } });
    expect(res.status).toBe(401);
  });

  it('returns 403 for different club room', async () => {
    getActorIdFromSession.mockReturnValue('kimis0719');
    findOneUser.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'u1', clubRoomId: 'room-A' })
      })
    });
    findByIdMatch.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'm1', clubRoomId: 'room-B', participants: [] })
    });

    const res = await GET(new NextRequest('http://localhost/api/matches/m1/share'), { params: { id: 'm1' } });
    expect(res.status).toBe(403);
  });

  it('returns match payload for same club room', async () => {
    getActorIdFromSession.mockReturnValue('kimis0719');
    findOneUser.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'u1', clubRoomId: 'room-A' })
      })
    });
    findByIdMatch.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        clubRoomId: 'room-A',
        participants: ['u1', 'u2'],
        teamAssignments: [{ userId: 'u1', team: 'red' }]
      })
    });

    const res = await GET(new NextRequest('http://localhost/api/matches/m1/share'), { params: { id: 'm1' } });
    const body = (await res.json()) as {
      success: boolean;
      data: { _id: string; teamAssignments: Array<{ userId: string; team: string }> };
    };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('m1');
    expect(body.data.teamAssignments).toEqual([{ userId: 'u1', team: 'red' }]);
  });
});
