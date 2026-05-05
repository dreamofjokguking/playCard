import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { canManageClubRoomById, getActorAccess } from '@/lib/accessControl';
import Evaluation from '@/lib/models/Evaluation';
import Match from '@/lib/models/Match';
import ClubRoom from '@/lib/models/ClubRoom';
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

type EditEvaluationBody = {
  ratings?: RatingInput[];
  mvpPick?: string;
  reason?: string;
};

async function _PATCH(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const { id } = context.params;
  const evaluation = await Evaluation.findById(id).lean();
  if (!evaluation) {
    return NextResponse.json({ success: false, message: '평가를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!access.isServiceAdmin) {
    const canManage = await canManageClubRoomById(evaluation.clubRoomId, access.actorId);
    if (!canManage) {
      return NextResponse.json({ success: false, message: '클럽 관리 권한이 없습니다.' }, { status: 403 });
    }
  }

  const body = (await request.json()) as EditEvaluationBody;
  const reason = body.reason?.trim() ?? '';
  if (!reason) {
    return NextResponse.json({ success: false, message: '수정 사유는 필수입니다.' }, { status: 400 });
  }

  const match = await Match.findById(evaluation.matchId).lean();
  if (!match) {
    return NextResponse.json({ success: false, message: '경기를 찾을 수 없습니다.' }, { status: 404 });
  }

  const newRatings = Array.isArray(body.ratings) ? body.ratings : null;
  const newMvpPick = typeof body.mvpPick === 'string' ? body.mvpPick.trim() : '';

  if (!newRatings && !newMvpPick) {
    return NextResponse.json({ success: false, message: '수정할 필드가 없습니다.' }, { status: 400 });
  }

  if (newMvpPick) {
    if (!match.participants.includes(newMvpPick)) {
      return NextResponse.json({ success: false, message: 'MVP는 참가자 중에서 선택해야 합니다.' }, { status: 400 });
    }
    if (newMvpPick === evaluation.evaluatorId) {
      return NextResponse.json({ success: false, message: '본인은 MVP로 선택할 수 없습니다.' }, { status: 400 });
    }
  }

  let normalizedRatings: RatingInput[] | null = null;
  if (newRatings) {
    const positionMap = new Map(
      (match.positionSubmissions ?? []).map((row) => [row.userId, new Set(row.selectedMetrics ?? [])])
    );

    normalizedRatings = newRatings
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
      .filter((rating) => rating.targetUserId && rating.targetUserId !== evaluation.evaluatorId);

    const hasInvalidTarget = normalizedRatings.some(
      (rating) => !match.participants.includes(rating.targetUserId)
    );
    if (hasInvalidTarget) {
      return NextResponse.json({ success: false, message: '평가 대상은 참가자여야 합니다.' }, { status: 400 });
    }

    const hasInvalidMetric = normalizedRatings.some((rating) => {
      const allowed = positionMap.get(rating.targetUserId);
      if (!allowed || allowed.size === 0) return true;
      if (rating.metricScores.some((metricScore) => !allowed.has(metricScore.metricKey))) return true;
      if ((rating.absences ?? []).some((metricKey) => !allowed.has(metricKey))) return true;
      return false;
    });
    if (hasInvalidMetric) {
      return NextResponse.json(
        { success: false, message: '평가표는 각 선수의 제출 포지션 범위 내에서만 작성할 수 있습니다.' },
        { status: 400 }
      );
    }
  }

  const editLogEntry = {
    editorId: access.actorId,
    editedAt: new Date(),
    reason,
    prevRatings: evaluation.ratings ?? [],
    prevMvpPick: evaluation.mvpPick ?? ''
  };

  const update: {
    ratings?: RatingInput[];
    mvpPick?: string;
    $push: { editLog: typeof editLogEntry };
  } = { $push: { editLog: editLogEntry } };
  if (normalizedRatings) update.ratings = normalizedRatings;
  if (newMvpPick) update.mvpPick = newMvpPick;

  const updated = await Evaluation.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  if (!updated) {
    return NextResponse.json({ success: false, message: '평가를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (newMvpPick) {
    await Match.findByIdAndUpdate(evaluation.matchId, {
      $pull: { mvpVotes: { voterId: evaluation.evaluatorId } }
    });
    await Match.findByIdAndUpdate(evaluation.matchId, {
      $push: { mvpVotes: { voterId: evaluation.evaluatorId, selectedUserId: newMvpPick } }
    });
  }

  if (match.status === 'completed') {
    const evaluations = await Evaluation.find({ matchId: evaluation.matchId })
      .select({ ratings: 1, mvpPick: 1 })
      .lean();
    const clubRoom = (await ClubRoom.findById(evaluation.clubRoomId)
      .select({ positionMetrics: 1 })
      .lean()) as { positionMetrics?: Array<{ key: string; isActive?: boolean }> } | null;
    const activeMetricKeys = (clubRoom?.positionMetrics ?? [])
      .filter((metric) => metric.isActive !== false)
      .map((metric) => metric.key);
    const declaredMetricsByUser = new Map<string, string[]>(
      (match.positionSubmissions ?? []).map((row) => [row.userId, row.selectedMetrics ?? []])
    );
    const recomputed = aggregateResults(match.participants, evaluations, {
      activeMetricKeys,
      declaredMetricsByUser
    });

    const prevByUser = new Map(
      (match.results?.playerStats ?? []).map((stat) => [stat.userId, stat])
    );
    const merged = recomputed.playerStats.map((stat) => {
      const prev = prevByUser.get(stat.userId);
      return prev?.title ? { ...stat, title: prev.title, rarity: prev.rarity } : stat;
    });

    await Match.findByIdAndUpdate(evaluation.matchId, {
      results: { playerStats: merged }
    });
  }

  return NextResponse.json({ success: true, data: updated });
}

export const PATCH = withApiLogging(_PATCH, '/api/admin/evaluations/[id]');
