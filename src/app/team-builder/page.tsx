'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type CurrentEvaluationResponse = {
  match: {
    _id: string;
    teamAssignments?: Array<{ userId: string; team: 'red' | 'blue' }>;
  };
  participants: Array<{ _id: string; displayName: string }>;
};

type ApiResponse = {
  success: boolean;
  data?: CurrentEvaluationResponse | null;
  message?: string;
};

type MeResponse = {
  managedClubRooms: { _id: string; name: string }[];
};

type MemberRow = {
  _id: string;
  displayName?: string;
  nickname?: string;
  role: 'service_admin' | 'admin' | 'member' | 'pending';
  status: 'active' | 'inactive';
};

type MatchByIdResponse = {
  _id: string;
  clubRoomId: string;
  participants: string[];
  teamAssignments?: Array<{ userId: string; team: 'red' | 'blue' }>;
};

export default function TeamBuilderPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Array<{ _id: string; displayName: string }>>([]);
  const [manualAssignments, setManualAssignments] = useState<Record<string, 'red' | 'blue'>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [matchId, setMatchId] = useState('');
  const [saving, setSaving] = useState(false);

  const isShareView = searchParams.get('view') === 'share';

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

  async function loadByMatchId(targetMatchId: string) {
    setLoading(true);
    setErrorMessage('');
    setNoticeMessage('');
    const endpoint = isShareView
      ? `/api/matches/${encodeURIComponent(targetMatchId)}/share`
      : `/api/admin/matches/${encodeURIComponent(targetMatchId)}`;
    const matchRes = await fetch(endpoint, { cache: 'no-store' });
    const matchJson = await parseJsonSafe<{ success: boolean; data?: MatchByIdResponse; message?: string }>(matchRes);
    if (!matchRes.ok || !matchJson?.success || !matchJson.data) {
      setErrorMessage(matchJson?.message || '경기 정보를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }

    const participantIds = matchJson.data.participants ?? [];
    const memberRes = await fetch(
      `/api/admin/members?clubRoomId=${encodeURIComponent(matchJson.data.clubRoomId)}&status=active`,
      { cache: 'no-store' }
    );
    const memberJson = await parseJsonSafe<{ success: boolean; data?: MemberRow[]; message?: string }>(memberRes);
    if (!memberRes.ok || !memberJson?.success || !memberJson.data) {
      setErrorMessage(memberJson?.message || '멤버 정보를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }

    const nameMap = new Map(memberJson.data.map((m) => [m._id, m.displayName || m.nickname || m._id]));
    const participants = participantIds.map((id) => ({ _id: id, displayName: nameMap.get(id) || id }));
    const saved = Object.fromEntries((matchJson.data.teamAssignments ?? []).map((v) => [v.userId, v.team])) as Record<
      string,
      'red' | 'blue'
    >;
    setRows(participants);
    setManualAssignments(Object.keys(saved).length > 0 ? saved : makeInitialAssignments(participants));
    setMatchId(matchJson.data._id);
    setNoticeMessage(isShareView ? '공유 보기 모드입니다.' : '경기 팀구성 편집 모드입니다.');
    setLoading(false);
  }

  async function loadFallback() {
    setLoading(true);
    setErrorMessage('');
    setNoticeMessage('');
    const res = await fetch('/api/evaluations/current', { cache: 'no-store' });
    const json = await parseJsonSafe<ApiResponse>(res);
    if (res.ok && json?.success && json.data?.participants?.length) {
      const participants = json.data.participants;
      const saved = Object.fromEntries((json.data.match.teamAssignments ?? []).map((v) => [v.userId, v.team])) as Record<
        string,
        'red' | 'blue'
      >;
      setRows(participants);
      setManualAssignments(Object.keys(saved).length > 0 ? saved : makeInitialAssignments(participants));
      setMatchId(json.data.match._id);
      setNoticeMessage('평가 경기 기준 팀구성입니다.');
      setLoading(false);
      return;
    }

    const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
    const meJson = await parseJsonSafe<{ success: boolean; data?: MeResponse }>(meRes);
    const roomId = meJson?.data?.managedClubRooms?.[0]?._id;
    if (!roomId) {
      setRows([]);
      setManualAssignments({});
      setMatchId('');
      setNoticeMessage('표시할 팀구성 대상이 없습니다.');
      setLoading(false);
      return;
    }
    const memberRes = await fetch(`/api/admin/members?clubRoomId=${encodeURIComponent(roomId)}&status=active`, { cache: 'no-store' });
    const memberJson = await parseJsonSafe<{ success: boolean; data?: MemberRow[] }>(memberRes);
    const participants = (memberJson?.data ?? [])
      .filter((m) => m.role !== 'pending' && m.status === 'active')
      .map((m) => ({ _id: m._id, displayName: m.displayName || m.nickname || m._id }));
    setRows(participants);
    setManualAssignments(makeInitialAssignments(participants));
    setMatchId('');
    setNoticeMessage('클럽 활성 멤버 기준 팀구성입니다.');
    setLoading(false);
  }

  async function saveTeamAssignments() {
    if (isShareView) return;
    if (!matchId) {
      setErrorMessage('저장할 경기 ID가 없습니다.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    const payload = rows.map((row, index) => ({
      userId: row._id,
      team: (manualAssignments[row._id] ?? (index % 2 === 0 ? 'red' : 'blue')) as 'red' | 'blue'
    }));
    const res = await fetch(`/api/admin/matches/${encodeURIComponent(matchId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamAssignments: payload })
    });
    const json = await parseJsonSafe<{ success: boolean; message?: string }>(res);
    if (!res.ok || !json?.success) {
      setErrorMessage(json?.message || '팀구성 저장에 실패했습니다.');
      setSaving(false);
      return;
    }
    setNoticeMessage('팀구성 저장 완료');
    setSaving(false);
  }

  function swapAssignment(memberId: string) {
    if (isShareView) return;
    setManualAssignments((prev) => ({
      ...prev,
      [memberId]: prev[memberId] === 'red' ? 'blue' : 'red'
    }));
  }

  useEffect(() => {
    const targetMatchId = searchParams.get('matchId');
    if (targetMatchId) {
      loadByMatchId(targetMatchId).catch(() => setErrorMessage('경기 정보를 불러오지 못했습니다.'));
      return;
    }
    loadFallback().catch(() => setErrorMessage('팀구성 정보를 불러오지 못했습니다.'));
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
        <p>{isShareView ? '공유용 읽기 전용 화면입니다.' : '자동/수동 편성 후 저장할 수 있습니다.'}</p>
        {isShareView ? (
          <div className="pc-row" style={{ marginTop: 8 }}>
            <span className="pc-status-badge active">공유 보기</span>
            <span className="pc-status-badge inactive">편집 잠금</span>
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
        {!isShareView ? (
          <div className="pc-row" style={{ marginTop: 10 }}>
            <button className="pc-button pc-button-primary" type="button" onClick={() => saveTeamAssignments()} disabled={!matchId || saving}>
              {saving ? '저장 중...' : '팀 구성 저장'}
            </button>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>팀 대진</h2>
        {loading ? <p>로딩 중...</p> : null}
        {!loading && noticeMessage ? <p>{noticeMessage}</p> : null}
        {!loading && errorMessage ? <p>{errorMessage}</p> : null}
        {!loading && !errorMessage ? (
          <>
            {mode === 'manual' ? (
              <div className="pc-stack" style={{ marginBottom: 12 }}>
                {rows.map((row) => {
                  const side = manualAssignments[row._id] ?? 'red';
                  return (
                    <div key={row._id} className="quick-link pc-row" style={{ justifyContent: 'space-between' }}>
                      <span>{row.displayName}</span>
                      {!isShareView ? (
                        <button className="pc-button" type="button" onClick={() => swapAssignment(row._id)}>
                          {side === 'red' ? '레드 → 블루' : '블루 → 레드'}
                        </button>
                      ) : (
                        <span className="pc-meta">{side === 'red' ? '레드팀' : '블루팀'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="pc-team-grid">
              <div className="pc-team-card red">
                <strong>레드팀</strong>
                <div className="pc-meta" style={{ marginTop: 6 }}>{teams.red.join(', ') || '-'}</div>
              </div>
              <div className="pc-team-card blue">
                <strong>블루팀</strong>
                <div className="pc-meta" style={{ marginTop: 6 }}>{teams.blue.join(', ') || '-'}</div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
