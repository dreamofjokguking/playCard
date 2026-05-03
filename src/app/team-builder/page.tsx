'use client';

import { useEffect, useMemo, useState } from 'react';

type CurrentEvaluationResponse = {
  participants: Array<{ _id: string; displayName: string }>;
};

export default function TeamBuilderPage() {
  const [rows, setRows] = useState<Array<{ _id: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/evaluations/current', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: CurrentEvaluationResponse | null; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '팀 구성 데이터를 불러오지 못했습니다.');
        return;
      }
      setRows(json.data?.participants ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('팀 구성 데이터를 불러오지 못했습니다.'));
  }, []);

  const teams = useMemo(() => {
    const red: string[] = [];
    const blue: string[] = [];
    rows.forEach((row, index) => {
      if (index % 2 === 0) red.push(row.displayName);
      else blue.push(row.displayName);
    });
    return { red, blue };
  }, [rows]);

  return (
    <>
      <section className="card">
        <h1>팀 구성</h1>
        <p>평가 참여자 기준으로 양 팀 밸런스 미리보기를 제공합니다.</p>
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
        <h2>팀 대결</h2>
        {loading ? <p style={{ marginTop: 10 }}>로딩 중...</p> : null}
        {!loading && message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
        {!loading && !message ? (
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
        ) : null}
      </section>
    </>
  );
}
