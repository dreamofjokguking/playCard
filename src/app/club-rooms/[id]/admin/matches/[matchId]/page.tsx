'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type RatingRow = {
  targetUserId: string;
  metricScores: { metricKey: string; score?: number | null }[];
  absences: string[];
  comment: string;
};

type EditLogEntry = {
  editorId: string;
  editorName: string;
  editedAt: string;
  reason: string;
  prevMvpPick: string;
};

type EvaluationRow = {
  _id: string;
  evaluatorId: string;
  evaluatorName: string;
  ratings: RatingRow[];
  mvpPick: string;
  submittedAt: string;
  editLog: EditLogEntry[];
};

type AdminEvaluationPayload = {
  match: {
    _id: string;
    clubRoomId: string;
    status: string;
    participants: string[];
    positionSubmissions: Array<{ userId: string; selectedMetrics: string[] }>;
  };
  evaluations: EvaluationRow[];
  nameMap: Record<string, string>;
};

type ClubRoomDetail = {
  positionMetrics: Array<{ key: string; label: string; isActive: boolean }>;
};

const KOREAN_METRIC_LABELS: Record<string, string> = {
  attack: '공격',
  defense: '수비',
  toss: '토스',
  serve: '서브',
  pass: '패스',
  set: '세터'
};

function metricLabel(metric: { key: string; label?: string }): string {
  return metric.label || KOREAN_METRIC_LABELS[metric.key] || metric.key;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function AdminMatchEditPage() {
  const params = useParams<{ id: string; matchId: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [data, setData] = useState<AdminEvaluationPayload | null>(null);
  const [club, setClub] = useState<ClubRoomDetail | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EvaluationRow | null>(null);
  const [editRatings, setEditRatings] = useState<RatingRow[]>([]);
  const [editMvpPick, setEditMvpPick] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [evalRes, clubRes] = await Promise.all([
        fetch(`/api/admin/evaluations?matchId=${encodeURIComponent(params.matchId)}`, { cache: 'no-store' }),
        fetch(`/api/club-rooms/${params.id}`, { cache: 'no-store' })
      ]);
      const evalJson = (await evalRes.json()) as { success: boolean; data?: AdminEvaluationPayload; message?: string };
      const clubJson = (await clubRes.json()) as { success: boolean; data?: ClubRoomDetail };
      if (!evalRes.ok || !evalJson.success || !evalJson.data) {
        setMessage(evalJson.message || '평가 목록 조회에 실패했습니다.');
        return;
      }
      setData(evalJson.data);
      if (clubRes.ok && clubJson.success && clubJson.data) {
        setClub(clubJson.data);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('조회에 실패했습니다.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.matchId, params.id]);

  function startEdit(evaluation: EvaluationRow) {
    setEditing(evaluation);
    setEditRatings(
      evaluation.ratings.map((rating) => ({
        targetUserId: rating.targetUserId,
        metricScores: rating.metricScores.map((score) => ({ metricKey: score.metricKey, score: score.score ?? null })),
        absences: [...rating.absences],
        comment: rating.comment ?? ''
      }))
    );
    setEditMvpPick(evaluation.mvpPick);
    setReason('');
  }

  function cancelEdit() {
    setEditing(null);
    setEditRatings([]);
    setEditMvpPick('');
    setReason('');
  }

  function changeScore(targetUserId: string, metricKey: string, value: string) {
    setEditRatings((prev) =>
      prev.map((rating) => {
        if (rating.targetUserId !== targetUserId) return rating;
        const numeric = value === '' ? null : Number(value);
        const exists = rating.metricScores.some((score) => score.metricKey === metricKey);
        if (exists) {
          return {
            ...rating,
            metricScores: rating.metricScores.map((score) =>
              score.metricKey === metricKey ? { ...score, score: Number.isFinite(numeric ?? NaN) ? numeric : null } : score
            )
          };
        }
        return {
          ...rating,
          metricScores: [
            ...rating.metricScores,
            { metricKey, score: Number.isFinite(numeric ?? NaN) ? numeric : null }
          ]
        };
      })
    );
  }

  async function submitEdit() {
    if (!editing) return;
    if (!reason.trim()) {
      setMessage('수정 사유를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ratings: editRatings.map((rating) => ({
          targetUserId: rating.targetUserId,
          metricScores: rating.metricScores
            .filter((score) => typeof score.score === 'number')
            .map((score) => ({ metricKey: score.metricKey, score: score.score as number })),
          absences: rating.absences,
          comment: rating.comment
        })),
        mvpPick: editMvpPick,
        reason: reason.trim()
      };
      const res = await fetch(`/api/admin/evaluations/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '수정에 실패했습니다.');
        return;
      }
      setMessage('수정 완료. 결과를 재계산했습니다.');
      cancelEdit();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  const activeMetrics = useMemo(
    () => (club?.positionMetrics ?? []).filter((metric) => metric.isActive !== false),
    [club]
  );

  if (loading) {
    return (
      <section className="card">
        <h1>평가 수정</h1>
        <p>불러오는 중...</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <h1>평가 수정</h1>
        <p>{message || '데이터가 없습니다.'}</p>
        <Link href={`${clubBase}/admin/matches`} className="pc-pill">
          ← 경기 관리로
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <div className="pc-flex-between is-top">
          <div>
            <h1 style={{ marginBottom: 4 }}>평가 수정</h1>
            <p className="pc-meta" style={{ marginTop: 0 }}>
              상태: {data.match.status} / 평가 제출 {data.evaluations.length}/{data.match.participants.length}건
            </p>
          </div>
          <Link href={`${clubBase}/admin/matches`} className="pc-pill">
            ← 경기 목록
          </Link>
        </div>
        {message ? <p className="pc-meta" style={{ marginTop: 8 }}>{message}</p> : null}
      </section>

      {data.evaluations.length === 0 ? (
        <section className="card">
          <p>아직 제출된 평가가 없습니다.</p>
        </section>
      ) : null}

      {data.evaluations.map((evaluation) => {
        const isEditing = editing?._id === evaluation._id;
        const ratingsForRender = isEditing ? editRatings : evaluation.ratings;
        return (
          <section key={evaluation._id} className="card">
            <div className="pc-flex-between">
              <strong>평가자: {evaluation.evaluatorName}</strong>
              <span className="pc-meta">제출 {formatDate(evaluation.submittedAt)}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="pc-meta">MVP: </span>
              {isEditing ? (
                <select
                  className="pc-field"
                  value={editMvpPick}
                  onChange={(event) => setEditMvpPick(event.target.value)}
                  style={{ display: 'inline-block', width: 'auto', marginLeft: 4 }}
                >
                  {data.match.participants
                    .filter((userId) => userId !== evaluation.evaluatorId)
                    .map((userId) => (
                      <option key={userId} value={userId}>
                        {data.nameMap[userId] ?? userId}
                      </option>
                    ))}
                </select>
              ) : (
                <strong>{data.nameMap[evaluation.mvpPick] ?? evaluation.mvpPick}</strong>
              )}
            </div>

            <div style={{ overflowX: 'auto', marginTop: 12, border: '1px solid var(--pc-line)', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1c2030', color: 'var(--pc-muted)' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>대상</th>
                    {activeMetrics.map((metric) => (
                      <th key={metric.key} style={{ padding: '6px 10px', textAlign: 'right', width: 70 }}>
                        {metricLabel(metric)}
                      </th>
                    ))}
                    <th style={{ padding: '6px 10px', textAlign: 'left', minWidth: 140 }}>한줄평</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingsForRender.map((rating) => {
                    const absenceSet = new Set(rating.absences);
                    return (
                      <tr key={rating.targetUserId} style={{ borderTop: '1px solid var(--pc-line)' }}>
                        <td style={{ padding: '6px 10px' }}>{data.nameMap[rating.targetUserId] ?? rating.targetUserId}</td>
                        {activeMetrics.map((metric) => {
                          const scoreEntry = rating.metricScores.find((score) => score.metricKey === metric.key);
                          const isAbsent = absenceSet.has(metric.key);
                          if (isAbsent) {
                            return (
                              <td key={metric.key} style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--pc-ink-tertiary)' }}>
                                결장
                              </td>
                            );
                          }
                          if (isEditing) {
                            return (
                              <td key={metric.key} style={{ padding: '4px 6px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  className="pc-field"
                                  value={scoreEntry?.score ?? ''}
                                  onChange={(event) => changeScore(rating.targetUserId, metric.key, event.target.value)}
                                  style={{ width: 60, textAlign: 'right', padding: '4px 6px' }}
                                />
                              </td>
                            );
                          }
                          return (
                            <td key={metric.key} style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
                              {typeof scoreEntry?.score === 'number' ? scoreEntry.score.toFixed(1) : '-'}
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 10px', color: 'var(--pc-muted)' }}>{rating.comment || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isEditing ? (
              <div style={{ marginTop: 12 }}>
                <label className="pc-meta" htmlFor={`reason-${evaluation._id}`}>
                  수정 사유 (필수)
                </label>
                <input
                  id={`reason-${evaluation._id}`}
                  type="text"
                  className="pc-field"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="예: 평가자가 점수를 잘못 입력해 본인 요청으로 수정"
                  style={{ marginTop: 4 }}
                />
                <div className="pc-row" style={{ marginTop: 12, gap: 8 }}>
                  <button type="button" className="pc-button pc-button-primary" onClick={() => submitEdit()} disabled={submitting}>
                    {submitting ? '저장 중...' : '저장 + 결과 재계산'}
                  </button>
                  <button type="button" className="pc-button" onClick={() => cancelEdit()} disabled={submitting}>
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="pc-row" style={{ marginTop: 12 }}>
                <button type="button" className="pc-button" onClick={() => startEdit(evaluation)}>
                  ✎ 점수 수정
                </button>
              </div>
            )}

            {evaluation.editLog.length > 0 ? (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--pc-line)' }}>
                <div className="pc-meta" style={{ marginBottom: 6 }}>수정 이력 {evaluation.editLog.length}건</div>
                <ul className="pc-list-reset" style={{ display: 'grid', gap: 6 }}>
                  {evaluation.editLog.map((entry, index) => (
                    <li key={index} className="pc-meta" style={{ borderLeft: '2px solid var(--pc-primary)', paddingLeft: 8 }}>
                      <strong style={{ color: 'var(--pc-ink)' }}>{entry.editorName}</strong> · {formatDate(entry.editedAt)}
                      <div style={{ marginTop: 2 }}>{entry.reason}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
