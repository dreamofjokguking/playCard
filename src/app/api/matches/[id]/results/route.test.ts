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
});

