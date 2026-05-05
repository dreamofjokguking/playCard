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

const getActorAccess = vi.fn();
const canManageClubRoomById = vi.fn();
vi.mock('@/lib/accessControl', () => ({
  getActorAccess,
  canManageClubRoomById
}));

const findEvaluationById = vi.fn();
const findEvaluationByIdAndUpdate = vi.fn();
const findEvaluations = vi.fn();
vi.mock('@/lib/models/Evaluation', () => ({
  default: {
    findById: findEvaluationById,
    findByIdAndUpdate: findEvaluationByIdAndUpdate,
    find: findEvaluations
  }
}));

const findMatchById = vi.fn();
const findMatchByIdAndUpdate = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: { findById: findMatchById, findByIdAndUpdate: findMatchByIdAndUpdate }
}));

const findClubRoomById = vi.fn();
vi.mock('@/lib/models/ClubRoom', () => ({
  default: { findById: findClubRoomById }
}));

const { PATCH } = await import('./route');

const baseEvaluation = {
  _id: 'e1',
  clubRoomId: 'room-1',
  matchId: 'm1',
  evaluatorId: 'u1',
  ratings: [
    {
      targetUserId: 'u2',
      metricScores: [{ metricKey: 'attack', score: 7 }],
      absences: [],
      comment: '이전 한줄평'
    }
  ],
  mvpPick: 'u2',
  submittedAt: new Date('2026-05-01T00:00:00Z'),
  editLog: []
};

const baseMatch = {
  _id: 'm1',
  clubRoomId: 'room-1',
  status: 'completed',
  participants: ['u1', 'u2'],
  positionSubmissions: [
    { userId: 'u1', selectedMetrics: ['attack'] },
    { userId: 'u2', selectedMetrics: ['attack'] }
  ],
  results: { playerStats: [] }
};

describe('/api/admin/evaluations/[id] PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findClubRoomById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ positionMetrics: [{ key: 'attack', isActive: true }] })
      })
    });
    findEvaluations.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })
    });
    findMatchByIdAndUpdate.mockResolvedValue({});
  });

  it('rejects unauthenticated request', async () => {
    getActorAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ success: false }, { status: 401 })
    });
    const req = new NextRequest('http://localhost/api/admin/evaluations/e1', {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'test' })
    });
    const res = await PATCH(req, { params: { id: 'e1' } });
    expect(res.status).toBe(401);
  });

  it('rejects club non-manager', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'someone', role: 'member', isServiceAdmin: false }
    });
    findEvaluationById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseEvaluation) });
    canManageClubRoomById.mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/admin/evaluations/e1', {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'test', mvpPick: 'u2' })
    });
    const res = await PATCH(req, { params: { id: 'e1' } });
    expect(res.status).toBe(403);
  });

  it('returns 400 when reason is missing', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    findEvaluationById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseEvaluation) });

    const req = new NextRequest('http://localhost/api/admin/evaluations/e1', {
      method: 'PATCH',
      body: JSON.stringify({ mvpPick: 'u2' })
    });
    const res = await PATCH(req, { params: { id: 'e1' } });
    expect(res.status).toBe(400);
  });

  it('updates ratings and pushes editLog with prev values', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    findEvaluationById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseEvaluation) });
    findMatchById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseMatch) });
    findEvaluationByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ ...baseEvaluation, ratings: [] })
    });

    const req = new NextRequest('http://localhost/api/admin/evaluations/e1', {
      method: 'PATCH',
      body: JSON.stringify({
        ratings: [
          {
            targetUserId: 'u2',
            metricScores: [{ metricKey: 'attack', score: 9 }],
            absences: [],
            comment: '수정됨'
          }
        ],
        reason: '오타 수정'
      })
    });
    const res = await PATCH(req, { params: { id: 'e1' } });
    expect(res.status).toBe(200);

    const updateCall = findEvaluationByIdAndUpdate.mock.calls[0];
    expect(updateCall[0]).toBe('e1');
    const updatePayload = updateCall[1] as {
      ratings: Array<{ metricScores: Array<{ score: number }> }>;
      $push: { editLog: { editorId: string; reason: string; prevRatings: unknown; prevMvpPick: string } };
    };
    expect(updatePayload.ratings[0].metricScores[0].score).toBe(9);
    expect(updatePayload.$push.editLog.editorId).toBe('admin-1');
    expect(updatePayload.$push.editLog.reason).toBe('오타 수정');
    expect(updatePayload.$push.editLog.prevMvpPick).toBe('u2');
    // prevRatings는 이전 점수(7) 그대로 스냅샷
    expect(updatePayload.$push.editLog.prevRatings).toEqual(baseEvaluation.ratings);
  });

  it('rejects mvpPick equal to evaluator self', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    findEvaluationById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseEvaluation) });
    findMatchById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseMatch) });

    const req = new NextRequest('http://localhost/api/admin/evaluations/e1', {
      method: 'PATCH',
      body: JSON.stringify({ mvpPick: 'u1', reason: 'test' })
    });
    const res = await PATCH(req, { params: { id: 'e1' } });
    expect(res.status).toBe(400);
  });

  it('triggers Match.results recalculation when match is completed', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    findEvaluationById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseEvaluation) });
    findMatchById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseMatch) });
    findEvaluationByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ ...baseEvaluation, ratings: [] })
    });
    findEvaluations.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            mvpPick: 'u2',
            ratings: [{ targetUserId: 'u2', metricScores: [{ metricKey: 'attack', score: 9 }], absences: [] }]
          }
        ])
      })
    });

    const req = new NextRequest('http://localhost/api/admin/evaluations/e1', {
      method: 'PATCH',
      body: JSON.stringify({
        ratings: [
          { targetUserId: 'u2', metricScores: [{ metricKey: 'attack', score: 9 }], absences: [], comment: '' }
        ],
        reason: '재계산 검증'
      })
    });
    const res = await PATCH(req, { params: { id: 'e1' } });
    expect(res.status).toBe(200);

    // match.results 재계산이 트리거되어야 함 — Match.findByIdAndUpdate가 results 필드와 함께 호출됨
    const resultsCall = findMatchByIdAndUpdate.mock.calls.find((call) => {
      const update = call[1] as { results?: unknown };
      return Boolean(update.results);
    });
    expect(resultsCall).toBeTruthy();
    const resultsPayload = (resultsCall![1] as { results: { playerStats: Array<{ userId: string; metricStats: Array<{ avg: number }> }> } }).results;
    const u2Stat = resultsPayload.playerStats.find((row) => row.userId === 'u2');
    expect(u2Stat?.metricStats[0].avg).toBe(9);
  });
});
