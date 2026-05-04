'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type CurrentEvaluationResponse = {
  participants: Array<{ _id: string; displayName: string }>;
};

type ApiResponse = {
  success: boolean;
  data?: CurrentEvaluationResponse | null;
  message?: string;
};

export default function TeamBuilderPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Array<{ _id: string; displayName: string }>>([]);
  const [manualAssignments, setManualAssignments] = useState<Record<string, 'red' | 'blue'>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [isDraftSource, setIsDraftSource] = useState(false);

  async function parseJsonSafe<T>(res: Response): Promise<T | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  function makeInitialAssignments(participants: Array<{ _id: string }>) {
    return Object.fromEntries(participants.map((row, index) => [row._id, index % 2 === 0 ? 'red' : 'blue'])) as Record<
      string,
      'red' | 'blue'
    >;
  }

  async function loadFromEvaluation() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/evaluations/current', { cache: 'no-store' });
      const json = await parseJsonSafe<ApiResponse>(res);
      if (!res.ok || !json?.success) {
        setMessage(json?.message || '팀 구성 데이터를 불러오지 못했습니다.');
        return;
      }

      const nextRows = json.data?.participants ?? [];
      setRows(nextRows);
      setManualAssignments(makeInitialAssignments(nextRows));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function clearDraftAndReload() {
    localStorage.removeItem('teamBuilderDraft');
    setIsDraftSource(false);
    loadFromEvaluation().catch(() => setMessage('팀 구성 데이터를 불러오지 못했습니다.'));
  }

  function swapAssignment(memberId: string) {
    setManualAssignments((prev) => ({
      ...prev,
      [memberId]: prev[memberId] === 'red' ? 'blue' : 'red'
    }));
  }

  function resetManualAssignments() {
    setManualAssignments(makeInitialAssignments(rows));
  }

  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'admin-draft') {
      try {
        const raw = localStorage.getItem('teamBuilderDraft');
        if (!raw) {
          setMessage('관리자 화면에서 선택된 인원이 없습니다.');
          setRows([]);
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(raw) as Array<{ _id: string; displayName: string }>;
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setMessage('관리자 화면에서 선택된 인원이 없습니다.');
          setRows([]);
          setLoading(false);
          return;
        }

        setRows(parsed);
        setManualAssignments(makeInitialAssignments(parsed));
        setIsDraftSource(true);
        setMessage('관리자 선택 인원으로 미리보기를 표시합니다.');
        setLoading(false);
        return;
      } catch {
        setMessage('선택 인원 데이터를 읽지 못했습니다.');
        setRows([]);
        setLoading(false);
        return;
      }
    }

    setIsDraftSource(false);
    loadFromEvaluation().catch(() => setMessage('팀 구성 데이터를 불러오지 못했습니다.'));
  }, [searchParams]);

  const teams = useMemo(() => {
    const red: string[] = [];
    const blue: string[] = [];
    rows.forEach((row, index) => {
      const assigned = manualAssignments[row._id] ?? (index % 2 === 0 ? 'red' : 'blue');
      if (assigned === 'red') red.push(row.displayName);
      else blue.push(row.displayName);
    });
    return { red, blue };
  }, [rows, manualAssignments]);

  return (
    <>
      <section className="card">
        <h1>팀 구성</h1>
        <p>평가 참여자 기준으로 자동 배치/수동 배치를 미리 확인합니다.</p>
        {isDraftSource ? (
          <div className="pc-row" style={{ marginTop: 8 }}>
            <span className="pc-status-badge pending">관리자 드래프트</span>
            <button className="pc-button" type="button" onClick={() => clearDraftAndReload()}>
              평가 참여자 기준으로 복귀
            </button>
          </div>
        ) : null}
        <div className="pc-pill-row">
          <button type="button" className={`pc-pill${mode === 'auto' ? ' is-active' : ''}`} onClick={() => setMode('auto')}>
            밸런스 자동
          </button>
          <button type="button" className={`pc-pill${mode === 'manual' ? ' is-active' : ''}`} onClick={() => setMode('manual')}>
            수동 편성
          </button>
        </div>
      </section>

      <section className="card">
        <h2>팀 대진</h2>
        {loading ? <p style={{ marginTop: 10 }}>로딩 중...</p> : null}
        {!loading && message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
        {!loading && !message ? (
          <>
            {mode === 'manual' ? (
              <div className="pc-stack" style={{ marginBottom: 12 }}>
                <div className="pc-row">
                  <strong>수동 편성</strong>
                  <button className="pc-button" type="button" onClick={() => resetManualAssignments()}>
                    자동 배치로 초기화
                  </button>
                </div>
                {rows.map((row) => {
                  const side = manualAssignments[row._id] ?? 'red';
                  return (
                    <div key={row._id} className="quick-link pc-row" style={{ justifyContent: 'space-between' }}>
                      <span>{row.displayName}</span>
                      <button className="pc-button" type="button" onClick={() => swapAssignment(row._id)}>
                        {side === 'red' ? '레드팀 → 블루팀' : '블루팀 → 레드팀'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="pc-team-grid">
              <div className="pc-team-card red">
                <strong>레드팀</strong>
                <div className="pc-meta" style={{ marginTop: 6 }}>
                  {teams.red.join(', ') || '-'}
                </div>
              </div>
              <div className="pc-team-card blue">
                <strong>블루팀</strong>
                <div className="pc-meta" style={{ marginTop: 6 }}>
                  {teams.blue.join(', ') || '-'}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
