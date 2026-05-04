'use client';

import { useMemo, useState } from 'react';
import ScoreSlider from '@/components/ui/ScoreSlider';

type Metric = { key: string; label: string };
type Participant = { _id: string; displayName: string; team: 'red' | 'blue' };

type PositionSubmission = { userId: string; selectedMetrics: string[] };

type RatingState = {
  targetUserId: string;
  metricScores: { metricKey: string; score: number }[];
  comment: string;
};

const MOCK_METRICS: Metric[] = [
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '수비' },
  { key: 'toss', label: '토스' },
  { key: 'serve', label: '서브' }
];

const MOCK_ACTOR: Participant = { _id: 'me', displayName: '나(평가자)', team: 'red' };

const MOCK_TARGETS: Participant[] = [
  { _id: 'p1', displayName: '김공격', team: 'blue' },
  { _id: 'p2', displayName: '박수비', team: 'blue' },
  { _id: 'p3', displayName: '이올라운더', team: 'blue' },
  { _id: 'p4', displayName: '최서브', team: 'red' }
];

const ALL_PARTICIPANTS: Participant[] = [MOCK_ACTOR, ...MOCK_TARGETS];

// 다른 참여자들이 미리 선언해둔 포지션 (목업) — 본인 외 4명
const OTHERS_POSITIONS: PositionSubmission[] = [
  { userId: 'p1', selectedMetrics: ['attack', 'serve'] },
  { userId: 'p2', selectedMetrics: ['defense'] },
  { userId: 'p3', selectedMetrics: ['attack', 'defense', 'toss', 'serve'] },
  { userId: 'p4', selectedMetrics: ['serve', 'toss'] }
];

type Phase = 'phase1-self-position' | 'phase2-waiting' | 'phase3-evaluate';

export default function EvaluationPreviewPage() {
  const [phase, setPhase] = useState<Phase>('phase1-self-position');
  const [mySelectedMetrics, setMySelectedMetrics] = useState<string[]>([]);
  const [allOthersSubmitted, setAllOthersSubmitted] = useState(false);
  const [ratings, setRatings] = useState<RatingState[]>([]);
  const [mvpPick, setMvpPick] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const metricLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const metric of MOCK_METRICS) map.set(metric.key, metric.label);
    return map;
  }, []);

  const positionMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of OTHERS_POSITIONS) map.set(row.userId, row.selectedMetrics);
    map.set(MOCK_ACTOR._id, mySelectedMetrics);
    return map;
  }, [mySelectedMetrics]);

  const totalParticipants = ALL_PARTICIPANTS.length;
  const submittedCount = (allOthersSubmitted ? OTHERS_POSITIONS.length : 0) + (phase !== 'phase1-self-position' ? 1 : 0);
  const progressPercent = Math.round((submittedCount / totalParticipants) * 100);

  function toggleMyMetric(metricKey: string) {
    setMySelectedMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((value) => value !== metricKey) : [...prev, metricKey]
    );
  }

  function submitMyPosition() {
    if (mySelectedMetrics.length === 0) return;
    setSubmitMessage('');
    if (allOthersSubmitted) {
      // 모두 제출 완료 → 평가 시작
      const initial: RatingState[] = MOCK_TARGETS.map((participant) => {
        const submittedMetrics = positionMap.get(participant._id) ?? [];
        return {
          targetUserId: participant._id,
          metricScores: submittedMetrics.map((metricKey) => ({ metricKey, score: 5 })),
          comment: ''
        };
      });
      setRatings(initial);
      setPhase('phase3-evaluate');
    } else {
      setPhase('phase2-waiting');
    }
  }

  function simulateOthersSubmit() {
    setAllOthersSubmitted(true);
    // 모두 제출되었으니 평가 시작
    const initial: RatingState[] = MOCK_TARGETS.map((participant) => {
      const submittedMetrics = positionMap.get(participant._id) ?? [];
      return {
        targetUserId: participant._id,
        metricScores: submittedMetrics.map((metricKey) => ({ metricKey, score: 5 })),
        comment: ''
      };
    });
    setRatings(initial);
    setPhase('phase3-evaluate');
  }

  function setScore(targetUserId: string, metricKey: string, score: number) {
    setRatings((prev) =>
      prev.map((row) =>
        row.targetUserId !== targetUserId
          ? row
          : {
              ...row,
              metricScores: row.metricScores.map((metric) =>
                metric.metricKey === metricKey ? { ...metric, score } : metric
              )
            }
      )
    );
  }

  function setComment(targetUserId: string, comment: string) {
    setRatings((prev) => prev.map((row) => (row.targetUserId === targetUserId ? { ...row, comment } : row)));
  }

  const canSubmitEvaluation = useMemo(() => {
    if (!mvpPick || ratings.length === 0) return false;
    return ratings.every((rating) => rating.metricScores.length > 0);
  }, [mvpPick, ratings]);

  function submitEvaluation() {
    if (!canSubmitEvaluation) return;
    const summary = ratings.map((rating) => {
      const target = MOCK_TARGETS.find((p) => p._id === rating.targetUserId);
      const declared = positionMap.get(rating.targetUserId) ?? [];
      const allMetricKeys = MOCK_METRICS.map((m) => m.key);
      const absences = allMetricKeys.filter((key) => !declared.includes(key));
      const avg =
        rating.metricScores.length > 0
          ? rating.metricScores.reduce((sum, metric) => sum + metric.score, 0) / rating.metricScores.length
          : 0;
      return `${target?.displayName ?? rating.targetUserId} 평균 ${avg.toFixed(1)} (결장 자동 산출: ${
        absences.length > 0 ? absences.join(', ') : '없음'
      })`;
    });
    const mvpName = MOCK_TARGETS.find((p) => p._id === mvpPick)?.displayName ?? mvpPick;
    setSubmitMessage(`프리뷰 제출 (서버 호출 안 함)\nMVP: ${mvpName}\n${summary.join('\n')}`);
  }

  function resetAll() {
    setPhase('phase1-self-position');
    setMySelectedMetrics([]);
    setAllOthersSubmitted(false);
    setRatings([]);
    setMvpPick('');
    setSubmitMessage('');
  }

  return (
    <>
      <section className="pc-banner-card">
        <div>
          <div className="pc-banner-meta">PREVIEW · MOCK 데이터</div>
          <div className="pc-banner-title">평가 흐름 미리보기 (1단계 → 2단계 → 3단계)</div>
        </div>
        <button type="button" className="pc-button" onClick={() => resetAll()}>
          초기화
        </button>
      </section>

      <section className="card">
        <h1>경기 평가</h1>
        <div className="pc-progress-head">
          <span>
            포지션 제출 {submittedCount}/{totalParticipants}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="pc-progress-track">
          <div className="pc-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="pc-meta" style={{ marginTop: 8 }}>
          현재 단계: <strong>{phase === 'phase1-self-position' ? '1단계 · 본인 포지션 선택' : phase === 'phase2-waiting' ? '2단계 · 평가 대기' : '3단계 · 참여자 평가'}</strong>
        </div>
      </section>

      {phase === 'phase1-self-position' ? (
        <section className="card">
          <h2>1단계 · 본인 포지션 선택</h2>
          <p>오늘 경기에서 내가 출전한 포지션을 모두 선택하세요. (선택하지 않은 포지션은 자동으로 결장 처리됩니다)</p>
          <div className="pc-stack">
            {MOCK_METRICS.map((metric) => (
              <label
                key={metric.key}
                className="quick-link"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={mySelectedMetrics.includes(metric.key)}
                  onChange={() => toggleMyMetric(metric.key)}
                />
                <span>
                  {metric.label} <span className="pc-meta">({metric.key})</span>
                </span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              className="pc-button pc-button-primary"
              onClick={() => submitMyPosition()}
              disabled={mySelectedMetrics.length === 0}
            >
              포지션 제출
            </button>
          </div>
        </section>
      ) : null}

      {phase === 'phase2-waiting' ? (
        <section className="card">
          <h2>2단계 · 평가 대기</h2>
          <p>다른 참여자의 포지션 제출이 완료되면 평가가 시작됩니다.</p>
          <div className="pc-meta" style={{ marginTop: 8 }}>
            내가 제출한 포지션:{' '}
            <strong>{mySelectedMetrics.map((key) => metricLabelMap.get(key) ?? key).join(', ')}</strong>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="pc-button" onClick={() => simulateOthersSubmit()}>
              [프리뷰] 나머지 모두 제출 완료 시뮬레이션 → 평가 시작
            </button>
          </div>
        </section>
      ) : null}

      {phase === 'phase3-evaluate' ? (
        <section className="card">
          <h2>3단계 · 참여자 평가</h2>
          <p className="pc-meta" style={{ marginBottom: 8 }}>
            각 선수의 평가 카드에는 그 선수가 선언한 출전 포지션만 슬라이더로 노출됩니다.
            (선언하지 않은 포지션은 결장으로 자동 산출되어 결과 화면에 반영)
          </p>

          <div className="pc-stack">
            {MOCK_TARGETS.map((participant) => {
              const rating = ratings.find((row) => row.targetUserId === participant._id);
              if (!rating) return null;
              const teamLabel = participant.team === 'red' ? 'Red' : 'Blue';
              const relation = participant.team === MOCK_ACTOR.team ? '내 팀' : '상대 팀';
              const declared = positionMap.get(participant._id) ?? [];
              const allMetricKeys = MOCK_METRICS.map((m) => m.key);
              const absences = allMetricKeys.filter((key) => !declared.includes(key));

              return (
                <article key={participant._id} className="pc-result-item">
                  <strong>
                    {participant.displayName} ({teamLabel})
                  </strong>
                  <div className="pc-meta">{relation}</div>
                  <div className="pc-meta">
                    제출 포지션:{' '}
                    {declared.length > 0
                      ? declared.map((key) => metricLabelMap.get(key) ?? key).join(', ')
                      : '없음'}
                    {absences.length > 0
                      ? ` · 결장: ${absences.map((key) => metricLabelMap.get(key) ?? key).join(', ')}`
                      : ''}
                  </div>
                  <div className="pc-stack">
                    {rating.metricScores.length > 0 ? (
                      rating.metricScores.map((metric) => (
                        <ScoreSlider
                          key={metric.metricKey}
                          metricKey={`${participant._id}-${metric.metricKey}`}
                          metricLabel={metricLabelMap.get(metric.metricKey) ?? metric.metricKey}
                          score={metric.score}
                          onScoreChange={(score) => setScore(participant._id, metric.metricKey, score)}
                        />
                      ))
                    ) : (
                      <p className="pc-meta">이 선수가 선언한 출전 포지션이 없어 평가할 항목이 없습니다.</p>
                    )}
                    <input
                      value={rating.comment}
                      onChange={(event) => setComment(participant._id, event.target.value)}
                      placeholder="오늘 이 선수에 대해 한마디!"
                      className="pc-field"
                    />
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <label>
              MVP 선택
              <select
                value={mvpPick}
                onChange={(event) => setMvpPick(event.target.value)}
                className="pc-field"
                style={{ marginTop: 6 }}
              >
                <option value="">선택</option>
                {MOCK_TARGETS.map((participant) => {
                  const teamLabel = participant.team === 'red' ? 'Red' : 'Blue';
                  const relation = participant.team === MOCK_ACTOR.team ? '내팀' : '상대팀';
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
            <button
              className="pc-button pc-button-primary"
              onClick={() => submitEvaluation()}
              disabled={!canSubmitEvaluation}
            >
              평가 제출 (프리뷰)
            </button>
          </div>

          {submitMessage ? (
            <pre
              className="pc-meta"
              style={{
                marginTop: 12,
                whiteSpace: 'pre-wrap',
                background: '#161a26',
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--pc-line)'
              }}
            >
              {submitMessage}
            </pre>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
