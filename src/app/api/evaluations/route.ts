import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { getActorIdFromSession } from '@/lib/authSession';
import Match from '@/lib/models/Match';
import Evaluation from '@/lib/models/Evaluation';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';
import { broadcastNotification } from '@/lib/notifications';
import { generateTitle, isGeminiEnabled, loadAiSettings, type TitleRarity } from '@/lib/gemini';
import { aggregateResults } from '@/lib/matchAggregation';

export const dynamic = 'force-dynamic';

type ScoreInput = {
  metricKey: string;
  score?: number;
};

type RatingInput = {
  targetUserId: string;
  metricScores: ScoreInput[];
  absences?: string[];
  comment?: string;
};

type SubmitBody = {
  matchId?: string;
  ratings?: RatingInput[];
  mvpPick?: string;
};

type SubmitEvaluationResponse = {
  createdEvaluationId: string;
  matchCompleted: boolean;
  resultPath?: string;
};

async function _POST(request: NextRequest) {
  await dbConnect();

  const actorId = getActorIdFromSession(request);
  if (!actorId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json()) as SubmitBody;
  const matchId = body.matchId?.trim() ?? '';
  const mvpPick = body.mvpPick?.trim() ?? '';
  const ratings = body.ratings ?? [];

  if (!matchId || !mvpPick || ratings.length === 0) {
    return NextResponse.json({ success: false, message: 'matchId, ratings, mvpPick은 필수입니다.' }, { status: 400 });
  }

  const match = await Match.findById(matchId).lean();
  if (!match) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (match.status !== 'evaluating') {
    return NextResponse.json({ success: false, message: '평가 가능한 경기 상태가 아닙니다.' }, { status: 400 });
  }

  if (!match.participants.includes(actorId)) {
    return NextResponse.json({ success: false, message: '해당 경기 참가자만 제출할 수 있습니다.' }, { status: 403 });
  }

  if (!match.participants.includes(mvpPick)) {
    return NextResponse.json({ success: false, message: 'MVP는 참가자 중에서 선택해야 합니다.' }, { status: 400 });
  }
  if (mvpPick === actorId) {
    return NextResponse.json({ success: false, message: '본인은 MVP로 선택할 수 없습니다.' }, { status: 400 });
  }
  if ((match.positionSubmissions ?? []).length < match.participants.length) {
    return NextResponse.json({ success: false, message: '참가자 포지션 제출이 완료된 뒤 평가를 시작할 수 있습니다.' }, { status: 400 });
  }

  const normalizedRatings: RatingInput[] = ratings
    .map((rating) => {
      const absences = Array.from(
        new Set((rating.absences ?? []).map((value) => value.trim()).filter(Boolean))
      );
      const absenceSet = new Set(absences);
      return {
        targetUserId: rating.targetUserId.trim(),
        metricScores: (rating.metricScores ?? [])
          .map((score) => ({
            metricKey: score.metricKey.trim(),
            score: typeof score.score === 'number' ? score.score : undefined
          }))
          .filter((score) => score.metricKey && !absenceSet.has(score.metricKey)),
        absences,
        comment: (rating.comment ?? '').trim()
      };
    })
    .filter((rating) => rating.targetUserId && rating.targetUserId !== actorId);

  if (normalizedRatings.length === 0) {
    return NextResponse.json({ success: false, message: '본인을 제외한 평가 대상이 필요합니다.' }, { status: 400 });
  }

  const hasInvalidTarget = normalizedRatings.some((rating) => !match.participants.includes(rating.targetUserId));
  if (hasInvalidTarget) {
    return NextResponse.json({ success: false, message: '평가 대상은 참가자여야 합니다.' }, { status: 400 });
  }

  const positionMap = new Map(
    (match.positionSubmissions ?? []).map((row) => [row.userId, new Set(row.selectedMetrics ?? [])])
  );
  const hasInvalidMetricByTarget = normalizedRatings.some((rating) => {
    const allowed = positionMap.get(rating.targetUserId);
    if (!allowed || allowed.size === 0) return true;
    if (rating.metricScores.some((metricScore) => !allowed.has(metricScore.metricKey))) return true;
    if ((rating.absences ?? []).some((metricKey) => !allowed.has(metricKey))) return true;
    return false;
  });
  if (hasInvalidMetricByTarget) {
    return NextResponse.json(
      { success: false, message: '평가표는 각 선수의 제출 포지션 범위 내에서만 작성할 수 있습니다.' },
      { status: 400 }
    );
  }

  const hasNoScorable = normalizedRatings.some(
    (rating) => rating.metricScores.length === 0 && (rating.absences ?? []).length === 0
  );
  if (hasNoScorable) {
    return NextResponse.json(
      { success: false, message: '각 선수에 대해 최소 한 개 이상의 점수 또는 결장 처리가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const created = await Evaluation.create({
      clubRoomId: match.clubRoomId,
      matchId,
      evaluatorId: actorId,
      ratings: normalizedRatings,
      mvpPick,
      submittedAt: new Date()
    });

    let matchCompleted = false;
    let resultPath = '';

    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      {
        $addToSet: {
          evaluationsSubmitted: actorId,
          mvpVotes: { voterId: actorId, selectedUserId: mvpPick }
        }
      },
      { new: true }
    ).lean();

    if (updatedMatch && updatedMatch.evaluationsSubmitted.length >= updatedMatch.participants.length) {
      matchCompleted = true;
      resultPath = `/club-rooms/${String(updatedMatch.clubRoomId)}/evaluation/${String(updatedMatch._id)}/result`;
      const evaluations = await Evaluation.find({ matchId })
        .select({ ratings: 1, mvpPick: 1 })
        .lean();
      const clubRoom = (await ClubRoom.findById(updatedMatch.clubRoomId)
        .select({ positionMetrics: 1 })
        .lean()) as { positionMetrics?: Array<{ key: string; isActive?: boolean }> } | null;
      const activeMetricKeys = (clubRoom?.positionMetrics ?? [])
        .filter((metric) => metric.isActive !== false)
        .map((metric) => metric.key);
      const declaredMetricsByUser = new Map<string, string[]>(
        (updatedMatch.positionSubmissions ?? []).map((row) => [row.userId, row.selectedMetrics ?? []])
      );
      const results = aggregateResults(updatedMatch.participants, evaluations, {
        activeMetricKeys,
        declaredMetricsByUser
      });

      // AI 칭호 생성 (Gemini 활성화 시) — 평가자 과반(50%) 이상이 그 선수에게 점수를 매긴 경우만
      if (isGeminiEnabled() && results.playerStats.length > 0) {
        const userIds = results.playerStats.map((stat) => stat.userId);
        const users = await User.find({ _id: { $in: userIds } })
          .select({ _id: 1, displayName: 1, nickname: 1 })
          .lean();
        const nameMap = new Map(
          users.map((user) => [String(user._id), user.displayName || user.nickname || String(user._id)])
        );
        const settings = await loadAiSettings();
        const evaluatorCount = updatedMatch.evaluationsSubmitted.length;
        const titleThreshold = Math.ceil(evaluatorCount * 0.5);
        // 만장일치 MVP: 모든 평가자가 같은 사람을 MVP로 뽑은 경우만 legendary 자격
        const unanimousMvpUserId =
          results.playerStats.find((stat) => stat.mvpCount === evaluatorCount && evaluatorCount > 0)?.userId ?? null;

        const titled = await Promise.all(
          results.playerStats.map(async (stat) => {
            // 그 선수에게 실제로 점수를 매긴 평가자 수 추정 = metricStats 중 max(count)
            const ratedBy = stat.metricStats.reduce((max, metric) => Math.max(max, metric.count), 0);
            if (ratedBy < titleThreshold) return stat;

            const displayName = nameMap.get(stat.userId) ?? stat.userId;
            const generated = await generateTitle(
              {
                displayName,
                comments: stat.comments,
                metricStats: stat.metricStats.map((metric) => ({ metricKey: metric.metricKey, avg: metric.avg }))
              },
              settings
            );
            if (!generated) return stat;
            // legendary는 만장일치 MVP에게만. 그 외는 AI가 legendary 응답해도 epic으로 강등.
            let finalRarity: TitleRarity = generated.rarity;
            if (stat.userId === unanimousMvpUserId) {
              finalRarity = 'legendary';
            } else if (generated.rarity === 'legendary') {
              finalRarity = 'epic';
            }
            return { ...stat, title: generated.title, rarity: finalRarity };
          })
        );
        results.playerStats = titled;

        // User 갱신 — currentTitle, currentRarity, titleHistory push
        await Promise.all(
          titled
            .filter((stat) => stat.title)
            .map((stat) =>
              User.findByIdAndUpdate(stat.userId, {
                currentTitle: stat.title,
                currentRarity: stat.rarity ?? 'common',
                $push: {
                  titleHistory: {
                    title: stat.title,
                    matchId: String(updatedMatch._id),
                    rarity: stat.rarity ?? 'common',
                    createdAt: new Date()
                  }
                }
              })
            )
        );
      }

      await Match.findByIdAndUpdate(matchId, {
        status: 'completed',
        results
      });
      await broadcastNotification({
        userIds: updatedMatch.participants,
        type: 'evaluation.completed',
        title: '평가 종료',
        message: '모든 참여자의 평가가 완료되어 결과가 게시되었습니다.',
        path: resultPath,
        clubRoomId: updatedMatch.clubRoomId,
        matchId: String(updatedMatch._id)
      });
    }

    const responseData: SubmitEvaluationResponse = {
      createdEvaluationId: String(created._id),
      matchCompleted,
      resultPath: resultPath || undefined
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: '이미 평가를 제출했습니다.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: '평가 제출에 실패했습니다.' }, { status: 500 });
  }
}

export const POST = withApiLogging(_POST, '/api/evaluations');
