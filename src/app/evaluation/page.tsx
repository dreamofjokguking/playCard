'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Metric = {
  key: string;
  label: string;
  order: number;
};

type Participant = {
  _id: string;
  displayName: string;
};

type PositionSubmission = {
  userId: string;
  selectedMetrics: string[];
  submittedAt: string;
};

type CurrentEvaluationResponse = {
  actorId: string;
  match: {
    _id: string;
    participants: string[];
    evaluationsSubmitted: string[];
  };
  metrics: Metric[];
  participants: Participant[];
  positionSubmissions: PositionSubmission[];
  allPositionSubmitted: boolean;
};

type RatingState = {
  targetUserId: string;
  metricScores: { metricKey: string; score: number }[];
  comment: string;
};

export default function EvaluationPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<CurrentEvaluationResponse | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [ratings, setRatings] = useState<RatingState[]>([]);
  const [mvpPick, setMvpPick] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const actorPositionSubmitted = useMemo(() => {
    if (!payload) return false;
    return payload.positionSubmissions.some((row) => row.userId === payload.actorId);
  }, [payload]);

  const isEvaluationReady = Boolean(payload?.allPositionSubmitted);

  const targetParticipants = useMemo(() => {
    if (!payload) return [];
    return payload.participants.filter((participant) => participant._id !== payload.actorId);
  }, [payload]);

  const positionMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!payload) return map;
    for (const row of payload.positionSubmissions) {
      map.set(row.userId, row.selectedMetrics);
    }
    return map;
  }, [payload]);

  const canSubmitEvaluation = useMemo(() => {
    if (!payload || !isEvaluationReady || !mvpPick || ratings.length === 0) return false;
    return ratings.every((rating) => rating.metricScores.length > 0);
  }, [payload, isEvaluationReady, mvpPick, ratings]);

  function initRatings(data: CurrentEvaluationResponse) {
    const nextRatings: RatingState[] = data.participants
      .filter((participant) => participant._id !== data.actorId)
      .map((participant) => {
        const submittedMetrics = data.positionSubmissions.find((row) => row.userId === participant._id)?.selectedMetrics ?? [];
        return {
          targetUserId: participant._id,
          metricScores: submittedMetrics.map((metricKey) => ({ metricKey, score: 5 })),
          comment: ''
        };
      });
    setRatings(nextRatings);
  }

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/evaluations/current', { cache: 'no-store' });
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
        data?: CurrentEvaluationResponse | null;
      };
      if (!res.ok || !json.success) {
        setMessage(json.message || '평가 정보를 불러오지 못했습니다.');
        return;
      }
      if (!json.data) {
        setPayload(null);
        return;
      }
      const currentData = json.data;
      setPayload(currentData);
      initRatings(currentData);
      const mine = currentData.positionSubmissions.find((row) => row.userId === currentData.actorId);
      setSelectedMetrics(mine?.selectedMetrics ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setLoading(false);
    }
  }

  function toggleMyMetric(metricKey: string) {
    setSelectedMetrics((prev) => (prev.includes(metricKey) ? prev.filter((value) => value !== metricKey) : [...prev, metricKey]));
  }

  async function submitMyPositions() {
    if (!payload || selectedMetrics.length === 0) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/evaluations/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: payload.match._id,
          selectedMetrics
        })
      });
      const json = (await res.json()) as { success: boolean; message?: string; data?: { allSubmitted: boolean } };
      if (!res.ok || !json.success) {
        setMessage(json.message || '포지션 제출 실패');
        return;
      }
      setMessage(json.data?.allSubmitted ? '포지션 제출 완료. 평가 시작 알림이 발송되었습니다.' : '포지션 제출 완료');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setSubmitting(false);
    }
  }

  function setScore(targetUserId: string, metricKey: string, score: number) {
    setRatings((prev) =>
      prev.map((row) =>
        row.targetUserId !== targetUserId
          ? row
          : {
              ...row,
              metricScores: row.metricScores.map((metric) => (metric.metricKey === metricKey ? { ...metric, score } : metric))
            }
      )
    );
  }

  function setComment(targetUserId: string, comment: string) {
    setRatings((prev) => prev.map((row) => (row.targetUserId === targetUserId ? { ...row, comment } : row)));
  }

  async function submitEvaluation() {
    if (!payload || !canSubmitEvaluation) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: payload.match._id,
          mvpPick,
          ratings: ratings.map((rating) => ({
            targetUserId: rating.targetUserId,
            metricScores: rating.metricScores.map((metric) => ({
              metricKey: metric.metricKey,
              score: metric.score
            })),
            absences: [],
            comment: rating.comment
          }))
        })
      });
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
        data?: { matchCompleted: boolean; resultPath?: string };
      };
      if (!res.ok || !json.success) {
        setMessage(json.message || '평가 제출 실패');
        return;
      }
      if (json.data?.matchCompleted && json.data.resultPath) {
        router.push(json.data.resultPath);
        return;
      }
      setMessage('평가 제출 완료');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('평가 정보를 불러오지 못했습니다.'));
  }, []);

  if (loading) {
    return (
      <section className="card">
        <h1>평가</h1>
        <p>로딩 중...</p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="card">
        <h1>평가</h1>
        <p>진행 중인 평가 경기가 없습니다.</p>
        {message ? <p>{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="card">
      <h1>평가 흐름</h1>
      <ol className="check-list">
        <li>참여 인원에게 포지션 선택 알림 발송</li>
        <li>참여 인원이 포지션 선택 후 제출</li>
        <li>전원 제출 완료 시 평가 시작 알림 발송</li>
        <li>제출된 포지션 기반 평가표로 점수 부여</li>
        <li>전원 평가 완료 시 평가 종료 알림 발송</li>
        <li>평가 결과 게시</li>
      </ol>

      {!actorPositionSubmitted ? (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <h2>1-2단계: 내 포지션 제출</h2>
          {payload.metrics.map((metric) => (
            <label key={metric.key} style={{ display: 'flex', gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.key)}
                onChange={() => toggleMyMetric(metric.key)}
              />
              {metric.label} ({metric.key})
            </label>
          ))}
          <button onClick={() => submitMyPositions()} disabled={selectedMetrics.length === 0 || submitting}>
            {submitting ? '제출 중...' : '포지션 제출'}
          </button>
        </div>
      ) : null}

      {actorPositionSubmitted && !isEvaluationReady ? (
        <div style={{ marginTop: 12 }}>
          <h2>3단계 대기</h2>
          <p>내 포지션 제출은 완료되었습니다. 다른 참여자 제출 완료 후 평가가 시작됩니다.</p>
        </div>
      ) : null}

      {isEvaluationReady ? (
        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          <h2>4단계: 포지션 기반 평가</h2>
          {targetParticipants.map((participant) => {
            const rating = ratings.find((row) => row.targetUserId === participant._id);
            if (!rating) return null;
            return (
              <article key={participant._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <h3>{participant.displayName}</h3>
                <p style={{ marginTop: 4 }}>
                  제출 포지션: {(positionMap.get(participant._id) ?? []).join(', ') || '(없음)'}
                </p>
                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  {rating.metricScores.map((metric) => (
                    <label key={metric.metricKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ minWidth: 100 }}>{metric.metricKey}</strong>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={metric.score}
                        onChange={(event) => setScore(participant._id, metric.metricKey, Number(event.target.value))}
                      />
                    </label>
                  ))}
                  <input
                    value={rating.comment}
                    onChange={(event) => setComment(participant._id, event.target.value)}
                    placeholder="한줄평 (선택)"
                  />
                </div>
              </article>
            );
          })}

          <label>
            MVP 선택:{' '}
            <select value={mvpPick} onChange={(event) => setMvpPick(event.target.value)}>
              <option value="">선택</option>
              {payload.participants
                .filter((participant) => participant._id !== payload.actorId)
                .map((participant) => (
                <option key={participant._id} value={participant._id}>
                  {participant.displayName}
                </option>
                ))}
            </select>
          </label>

          <button onClick={() => submitEvaluation()} disabled={!canSubmitEvaluation || submitting}>
            {submitting ? '평가 제출 중...' : '평가 제출'}
          </button>
        </div>
      ) : null}

      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </section>
  );
}
