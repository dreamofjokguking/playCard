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
vi.mock('@/lib/notifications', () => ({
  broadcastNotification: vi.fn().mockResolvedValue(undefined)
}));

const getActorIdFromSession = vi.fn();
vi.mock('@/lib/authSession', () => ({
  getActorIdFromSession
}));

const findById = vi.fn();
const findByIdAndUpdate = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { findById, findByIdAndUpdate }
}));

const findByIdClub = vi.fn();
vi.mock('@/lib/models/ClubRoom', () => ({
  default: { findById: findByIdClub }
}));

const { POST } = await import('./route');

describe('/api/evaluations/positions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    getActorIdFromSession.mockReturnValue('');
    const req = new NextRequest('http://localhost/api/evaluations/positions', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('accepts valid metric submission', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({
          _id: 'm1',
          clubRoomId: 'room-1',
          status: 'evaluating',
          participants: ['u1', 'u2'],
          positionSubmissions: []
        })
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({
          _id: 'm1',
          participants: ['u1', 'u2'],
          positionSubmissions: [{ userId: 'u1', selectedMetrics: ['attack'] }]
        })
      });
    findByIdClub.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        positionMetrics: [{ key: 'attack', isActive: true }]
      })
    });

    const req = new NextRequest('http://localhost/api/evaluations/positions', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'm1', selectedMetrics: ['attack'] })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(2);
  });
});
