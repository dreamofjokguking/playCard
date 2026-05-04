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
    teamAssignments?: Array<{ userId: string; team: 'red' | 'blue' }>;
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

type TeamFilter = 'all' | 'opponent' | 'mine' | 'unknown';

export default function EvaluationPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<CurrentEvaluationResponse | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [ratings, setRatings] = useState<RatingState[]>([]);
  const [mvpPick, setMvpPick] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');

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
    for (const row of payload.positionSubmissions) map.set(row.userId, row.selectedMetrics);
    return map;
  }, [payload]);

  const teamMap = useMemo(() => {
    const map = new Map<string, 'red' | 'blue'>();
    if (!payload) return map;
    for (const row of payload.match.teamAssignments ?? []) map.set(row.userId, row.team);
    return map;
  }, [payload]);

  const actorTeam = useMemo(() => {
    if (!payload) return null;
    return teamMap.get(payload.actorId) ?? null;
  }, [payload, teamMap]);

  const groupedTargets = useMemo(() => {
    const mine: Participant[] = [];
    const opponent: Participant[] = [];
    const unknown: Participant[] = [];
    for (const participant of targetParticipants) {
      const team = teamMap.get(participant._id);
      if (!actorTeam || !team) unknown.push(participant);
      else if (team === actorTeam) mine.push(participant);
      else opponent.push(participant);
    }
    return { mine, opponent, unknown };
  }, [targetParticipants, teamMap, actorTeam]);

  const visibleTargets = useMemo(() => {
    if (teamFilter === 'opponent') return groupedTargets.opponent;
    if (teamFilter === 'mine') return groupedTargets.mine;
    if (teamFilter === 'unknown') return groupedTargets.unknown;
    return [...groupedTargets.opponent, ...groupedTargets.mine, ...groupedTargets.unknown];
  }, [groupedTargets, teamFilter]);

  const mvpCandidates = useMemo(
    () => [...groupedTargets.opponent, ...groupedTargets.mine, ...groupedTargets.unknown],
    [groupedTargets]
  );

  const submittedCount = payload?.match.evaluationsSubmitted.length ?? 0;
  const totalCount = payload?.match.participants.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

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
      const json = (await res.json()) as { success: boolean; message?: string; data?: CurrentEvaluationResponse | null };
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
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
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
        body: JSON.stringify({ matchId: payload.match._id, selectedMetrics })
      });
      const json = (await res.json()) as { success: boolean; message?: string; data?: { allSubmitted: boolean } };
      if (!res.ok || !json.success) {
        setMessage(json.message || '포지션 제출에 실패했습니다.');
        return;
      }
      setMessage(json.data?.allSubmitted ? '포지션 제출 완료. 모든 제출이 끝나 평가가 시작됩니다.' : '포지션 제출 완료');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
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
            metricScores: rating.metricScores.map((metric) => ({ metricKey: metric.metricKey, score: metric.score })),
            absences: [],
            comment: rating.comment
          }))
        })
      });
      const json = (await res.json()) as { success: boolean; message?: string; data?: { matchCompleted: boolean; resultPath?: string } };
      if (!res.ok || !json.success) {
        setMessage(json.message || '평가 제출에 실패했습니다.');
        return;
      }
      if (json.data?.matchCompleted && json.data.resultPath) {
        router.push(json.data.resultPath);
        return;
      }
      setMessage('평가 제출 완료');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
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
        <h1>경기 평가</h1>
        <p>로딩 중...</p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="card">
        <h1>경기 평가</h1>
        <p>진행 중인 평가 경기가 없습니다.</p>
        {message ? <p style={{ marginTop: 8 }}>{message}</p> : null}
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <h1>경기 평가</h1>
        <div className="pc-progress-head">
          <span>
            제출 {submittedCount}/{totalCount}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="pc-progress-track">
          <div className="pc-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      {!actorPositionSubmitted ? (
        <section className="card">
          <h2>1단계 · 내 포지션 선택</h2>
          <div className="pc-stack">
            {payload.metrics.map((metric) => (
              <label key={metric.key} className="quick-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={selectedMetrics.includes(metric.key)} onChange={() => toggleMyMetric(metric.key)} />
                <span>
                  {metric.label} ({metric.key})
                </span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="pc-button pc-button-primary" onClick={() => submitMyPositions()} disabled={selectedMetrics.length === 0 || submitting}>
              {submitting ? '제출 중...' : '포지션 제출'}
            </button>
          </div>
        </section>
      ) : null}

      {actorPositionSubmitted && !isEvaluationReady ? (
        <section className="card">
          <h2>2단계 · 평가 대기</h2>
          <p>다른 참여자의 포지션 제출이 완료되면 평가가 시작됩니다.</p>
        </section>
      ) : null}

      {isEvaluationReady ? (
        <section className="card">
          <h2>3단계 · 참여자 평가</h2>
          {actorTeam ? (
            <p className="pc-meta" style={{ marginBottom: 8 }}>
              내 팀: {actorTeam === 'red' ? 'Red' : 'Blue'}
            </p>
          ) : null}
          <div className="pc-pill-row" style={{ marginBottom: 10 }}>
            <button className={`pc-pill${teamFilter === 'all' ? ' is-active' : ''}`} onClick={() => setTeamFilter('all')}>
              전체
            </button>
            <button className={`pc-pill${teamFilter === 'opponent' ? ' is-active' : ''}`} onClick={() => setTeamFilter('opponent')}>
              상대팀
            </button>
            <button className={`pc-pill${teamFilter === 'mine' ? ' is-active' : ''}`} onClick={() => setTeamFilter('mine')}>
              내팀
            </button>
            <button className={`pc-pill${teamFilter === 'unknown' ? ' is-active' : ''}`} onClick={() => setTeamFilter('unknown')}>
              미분류
            </button>
          </div>

          <div className="pc-stack">
            {visibleTargets.map((participant) => {
              const rating = ratings.find((row) => row.targetUserId === participant._id);
              if (!rating) return null;
              const participantTeam = teamMap.get(participant._id);
              const relation =
                actorTeam && participantTeam
                  ? participantTeam === actorTeam
                    ? '내 팀'
                    : '상대 팀'
                  : '팀 미분류';

              return (
                <article key={participant._id} className="pc-result-item">
                  <strong>
                    {participant.displayName}
                    {participantTeam ? ` (${participantTeam === 'red' ? 'Red' : 'Blue'})` : ''}
                  </strong>
                  <div className="pc-meta">{relation}</div>
                  <div className="pc-meta">제출 포지션: {(positionMap.get(participant._id) ?? []).join(', ') || '-'}</div>
                  <div className="pc-stack">
                    {rating.metricScores.map((metric) => (
                      <label key={metric.metricKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span>{metric.metricKey}</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={metric.score}
                          onChange={(event) => setScore(participant._id, metric.metricKey, Number(event.target.value))}
                          className="pc-button"
                          style={{ width: 88, padding: '6px 10px' }}
                        />
                      </label>
                    ))}
                    <input
                      value={rating.comment}
                      onChange={(event) => setComment(participant._id, event.target.value)}
                      placeholder="코멘트 (선택)"
                      className="pc-button"
                      style={{ width: '100%', textAlign: 'left' }}
                    />
                  </div>
                </article>
              );
            })}
            {visibleTargets.length === 0 ? <p className="pc-meta">현재 필터에 해당하는 평가 대상이 없습니다.</p> : null}
          </div>

          <div style={{ marginTop: 12 }}>
            <label>
              MVP 선택
              <select value={mvpPick} onChange={(event) => setMvpPick(event.target.value)} className="pc-button" style={{ width: '100%', marginTop: 6 }}>
                <option value="">선택</option>
                {mvpCandidates.map((participant) => {
                  const participantTeam = teamMap.get(participant._id);
                  const relation =
                    actorTeam && participantTeam
                      ? participantTeam === actorTeam
                        ? '내팀'
                        : '상대팀'
                      : '미분류';
                  const teamLabel = participantTeam ? (participantTeam === 'red' ? 'Red' : 'Blue') : '-';
                  return (
                    <option key={participant._id} value={participant._id}>
                      {participant.displayName} ({relation}/{teamLabel})
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="pc-button pc-button-primary" onClick={() => submitEvaluation()} disabled={!canSubmitEvaluation || submitting}>
              {submitting ? '평가 제출 중...' : '평가 제출'}
            </button>
          </div>
        </section>
      ) : null}

      {message ? <p style={{ marginTop: 2, color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
