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

const create = vi.fn();
const find = vi.fn();
vi.mock('@/lib/models/Evaluation', () => ({
  default: { create, find }
}));

const findClubRoom = vi.fn();
vi.mock('@/lib/models/ClubRoom', () => ({
  default: { findById: findClubRoom }
}));

const { POST } = await import('./route');

describe('/api/evaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    getActorIdFromSession.mockReturnValue('');
    const req = new NextRequest('http://localhost/api/evaluations', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when match not found', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const req = new NextRequest('http://localhost/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'm1', mvpPick: 'u2', ratings: [{ targetUserId: 'u2', metricScores: [] }] })
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 when mvpPick is self', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        clubRoomId: 'room-1',
        status: 'evaluating',
        participants: ['u1', 'u2'],
        positionSubmissions: [
          { userId: 'u1', selectedMetrics: ['attack'] },
          { userId: 'u2', selectedMetrics: ['attack'] }
        ]
      })
    });

    const req = new NextRequest('http://localhost/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'm1',
        mvpPick: 'u1',
        ratings: [{ targetUserId: 'u2', metricScores: [{ metricKey: 'attack', score: 8.1 }] }]
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects absences outside the target position range', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        clubRoomId: 'room-1',
        status: 'evaluating',
        participants: ['u1', 'u2'],
        positionSubmissions: [
          { userId: 'u1', selectedMetrics: ['attack'] },
          { userId: 'u2', selectedMetrics: ['attack'] }
        ]
      })
    });

    const req = new NextRequest('http://localhost/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'm1',
        mvpPick: 'u2',
        ratings: [
          {
            targetUserId: 'u2',
            metricScores: [{ metricKey: 'attack', score: 7 }],
            absences: ['defense']
          }
        ]
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('drops absent metric scores from the persisted rating', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        clubRoomId: 'room-1',
        status: 'evaluating',
        participants: ['u1', 'u2'],
        positionSubmissions: [
          { userId: 'u1', selectedMetrics: ['attack', 'defense'] },
          { userId: 'u2', selectedMetrics: ['attack', 'defense'] }
        ]
      })
    });
    create.mockResolvedValue({ _id: 'e1' });
    findByIdAndUpdate.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        participants: ['u1', 'u2'],
        evaluationsSubmitted: ['u1']
      })
    });

    const req = new NextRequest('http://localhost/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'm1',
        mvpPick: 'u2',
        ratings: [
          {
            targetUserId: 'u2',
            metricScores: [
              { metricKey: 'attack', score: 8.4 },
              { metricKey: 'defense', score: 5 }
            ],
            absences: ['defense'],
            comment: '공격 좋음'
          }
        ]
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const persisted = create.mock.calls[0][0];
    const rating = persisted.ratings[0];
    expect(rating.absences).toEqual(['defense']);
    expect(rating.metricScores).toEqual([{ metricKey: 'attack', score: 8.4 }]);
  });

  it('completes match and stores aggregated results on last submission', async () => {
    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        clubRoomId: 'room-1',
        status: 'evaluating',
        participants: ['u1', 'u2'],
        positionSubmissions: [
          { userId: 'u1', selectedMetrics: ['attack'] },
          { userId: 'u2', selectedMetrics: ['attack'] }
        ]
      })
    });
    create.mockResolvedValue({ _id: 'e1' });
    findByIdAndUpdate
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({
          _id: 'm1',
          clubRoomId: 'room-1',
          participants: ['u1', 'u2'],
          evaluationsSubmitted: ['u1', 'u2'],
          positionSubmissions: [
            { userId: 'u1', selectedMetrics: ['attack'] },
            { userId: 'u2', selectedMetrics: ['attack'] }
          ]
        })
      })
      .mockResolvedValueOnce({});
    find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            mvpPick: 'u2',
            ratings: [
              {
                targetUserId: 'u2',
                metricScores: [{ metricKey: 'attack', score: 8.3 }],
                absences: [],
                comment: '좋음'
              }
            ]
          }
        ])
      })
    });
    findClubRoom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          positionMetrics: [
            { key: 'attack', isActive: true },
            { key: 'defense', isActive: true }
          ]
        })
      })
    });

    const req = new NextRequest('http://localhost/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'm1',
        mvpPick: 'u2',
        ratings: [{ targetUserId: 'u2', metricScores: [{ metricKey: 'attack', score: 8.3 }] }]
      })
    });
    const res = await POST(req);
    const body = (await res.json()) as {
      success: boolean;
      data?: { matchCompleted?: boolean; resultPath?: string };
    };

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data?.matchCompleted).toBe(true);
    expect(body.data?.resultPath).toBe('/club-rooms/room-1/evaluation/m1/result');
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(2);
    expect(findByIdAndUpdate).toHaveBeenNthCalledWith(
      2,
      'm1',
      expect.objectContaining({
        status: 'completed',
        results: expect.objectContaining({
          playerStats: expect.any(Array)
        })
      })
    );

    // u2는 attack만 선언했으므로 defense는 자동 결장
    const persistedResults = (findByIdAndUpdate.mock.calls[1][1] as { results: { playerStats: Array<{ userId: string; absences: string[] }> } }).results;
    const u2Stats = persistedResults.playerStats.find((row) => row.userId === 'u2');
    expect(u2Stats?.absences).toEqual(['defense']);
  });
});
