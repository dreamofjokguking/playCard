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

const findUserList = vi.fn();
const findByIdAndUpdateUser = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { find: findUserList, findByIdAndUpdate: findByIdAndUpdateUser }
}));

const isGeminiEnabledMock = vi.fn();
const generateTitleMock = vi.fn();
const loadAiSettingsMock = vi.fn();
vi.mock('@/lib/gemini', () => ({
  isGeminiEnabled: isGeminiEnabledMock,
  generateTitle: generateTitleMock,
  loadAiSettings: loadAiSettingsMock
}));

const { POST } = await import('./route');

describe('/api/evaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본은 Gemini 비활성화 — 칭호 생성 분기를 건너뜀
    isGeminiEnabledMock.mockReturnValue(false);
    generateTitleMock.mockResolvedValue(null);
    loadAiSettingsMock.mockResolvedValue({ titlePrompt: '{displayName}', modelName: 'gemini-2.5-flash' });
    findUserList.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })
    });
    findByIdAndUpdateUser.mockResolvedValue({});
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

  it('generates AI titles when Gemini is enabled and updates User docs', async () => {
    isGeminiEnabledMock.mockReturnValue(true);
    generateTitleMock.mockImplementation(async ({ displayName }: { displayName: string }) =>
      displayName === '테스터1'
        ? { title: '나의 칭호', rarity: 'rare' }
        : { title: '상대의 칭호', rarity: 'epic' }
    );
    findUserList.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'u1', displayName: '테스터1' },
          { _id: 'u2', displayName: '테스터2' }
        ])
      })
    });

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
          },
          {
            mvpPick: 'u1',
            ratings: [
              {
                targetUserId: 'u1',
                metricScores: [{ metricKey: 'attack', score: 7.0 }],
                absences: [],
                comment: '안정적'
              }
            ]
          }
        ])
      })
    });
    findClubRoom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ positionMetrics: [{ key: 'attack', isActive: true }] })
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
    expect(res.status).toBe(201);

    // 양쪽 모두 1명에게 평가받음 → threshold(ceil(2*0.5)=1) 통과 → 둘 다 칭호 생성
    expect(generateTitleMock).toHaveBeenCalledTimes(2);

    // playerStats에 title/rarity가 보강되어 저장됨
    const persisted = (findByIdAndUpdate.mock.calls[1][1] as {
      results: { playerStats: Array<{ userId: string; title?: string; rarity?: string }> };
    }).results;
    const u2Stat = persisted.playerStats.find((row) => row.userId === 'u2');
    expect(u2Stat?.title).toBe('상대의 칭호');
    expect(u2Stat?.rarity).toBe('epic');

    // User doc 갱신: currentTitle/currentRarity + titleHistory push
    expect(findByIdAndUpdateUser).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ currentTitle: '나의 칭호', currentRarity: 'rare' })
    );
    expect(findByIdAndUpdateUser).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ currentTitle: '상대의 칭호', currentRarity: 'epic' })
    );
  });

  it('skips title generation for players whose ratedBy < majority threshold', async () => {
    // 4명 매치 시나리오 — evaluator 4명, threshold = ceil(4 * 0.5) = 2
    // u2는 1명에게만 평가받음(ratedBy=1) → 임계 미달, 칭호 스킵
    // u3는 2명에게 평가받음(ratedBy=2) → 임계 통과, 칭호 생성
    // u4는 3명에게 평가받음(ratedBy=3) → 임계 통과, 칭호 생성
    isGeminiEnabledMock.mockReturnValue(true);
    generateTitleMock.mockResolvedValue({ title: '테스트', rarity: 'rare' });
    findUserList.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'u1', displayName: 'A' },
          { _id: 'u2', displayName: 'B' },
          { _id: 'u3', displayName: 'C' },
          { _id: 'u4', displayName: 'D' }
        ])
      })
    });

    getActorIdFromSession.mockReturnValue('u1');
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'm1',
        clubRoomId: 'room-1',
        status: 'evaluating',
        participants: ['u1', 'u2', 'u3', 'u4'],
        positionSubmissions: [
          { userId: 'u1', selectedMetrics: ['attack'] },
          { userId: 'u2', selectedMetrics: ['attack'] },
          { userId: 'u3', selectedMetrics: ['attack'] },
          { userId: 'u4', selectedMetrics: ['attack'] }
        ]
      })
    });
    create.mockResolvedValue({ _id: 'e1' });
    findByIdAndUpdate
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({
          _id: 'm1',
          clubRoomId: 'room-1',
          participants: ['u1', 'u2', 'u3', 'u4'],
          evaluationsSubmitted: ['u1', 'u2', 'u3', 'u4'],
          positionSubmissions: [
            { userId: 'u1', selectedMetrics: ['attack'] },
            { userId: 'u2', selectedMetrics: ['attack'] },
            { userId: 'u3', selectedMetrics: ['attack'] },
            { userId: 'u4', selectedMetrics: ['attack'] }
          ]
        })
      })
      .mockResolvedValueOnce({});
    // 평가 분포:
    //  u1 → u3, u4 (2명 평가)
    //  u2 → u4 (1명 평가)
    //  u3 → u1, u4 (2명 평가)
    //  u4 → u3 (1명 평가)
    // 결과: u1 ratedBy=1, u2 ratedBy=0, u3 ratedBy=3, u4 ratedBy=3
    find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            mvpPick: 'u4',
            ratings: [
              { targetUserId: 'u3', metricScores: [{ metricKey: 'attack', score: 7 }], absences: [] },
              { targetUserId: 'u4', metricScores: [{ metricKey: 'attack', score: 8 }], absences: [] }
            ]
          },
          {
            mvpPick: 'u4',
            ratings: [{ targetUserId: 'u4', metricScores: [{ metricKey: 'attack', score: 7 }], absences: [] }]
          },
          {
            mvpPick: 'u1',
            ratings: [
              { targetUserId: 'u1', metricScores: [{ metricKey: 'attack', score: 7 }], absences: [] },
              { targetUserId: 'u4', metricScores: [{ metricKey: 'attack', score: 7 }], absences: [] }
            ]
          },
          {
            mvpPick: 'u3',
            ratings: [{ targetUserId: 'u3', metricScores: [{ metricKey: 'attack', score: 8 }], absences: [] }]
          }
        ])
      })
    });
    findClubRoom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ positionMetrics: [{ key: 'attack', isActive: true }] })
      })
    });

    const req = new NextRequest('http://localhost/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'm1',
        mvpPick: 'u3',
        ratings: [{ targetUserId: 'u3', metricScores: [{ metricKey: 'attack', score: 8 }] }]
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // u3, u4만 임계 통과 → 칭호 2건만 생성
    expect(generateTitleMock).toHaveBeenCalledTimes(2);

    const persisted = (findByIdAndUpdate.mock.calls[1][1] as {
      results: { playerStats: Array<{ userId: string; title?: string }> };
    }).results;
    const u1Stat = persisted.playerStats.find((row) => row.userId === 'u1');
    const u2Stat = persisted.playerStats.find((row) => row.userId === 'u2');
    const u3Stat = persisted.playerStats.find((row) => row.userId === 'u3');
    const u4Stat = persisted.playerStats.find((row) => row.userId === 'u4');
    expect(u1Stat?.title).toBeFalsy(); // ratedBy=1, threshold=2
    expect(u2Stat?.title).toBeFalsy(); // ratedBy=0
    expect(u3Stat?.title).toBe('테스트'); // ratedBy=3
    expect(u4Stat?.title).toBe('테스트'); // ratedBy=3

    // User doc 갱신은 칭호 생성된 사람만 (u3, u4)
    const updatedUserIds = findByIdAndUpdateUser.mock.calls.map((call) => call[0]);
    expect(updatedUserIds).toEqual(expect.arrayContaining(['u3', 'u4']));
    expect(updatedUserIds).not.toContain('u1');
    expect(updatedUserIds).not.toContain('u2');
  });
});
