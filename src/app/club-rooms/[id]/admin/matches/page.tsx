'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MatchRow = {
  _id: string;
  clubRoomId: string;
  date: string;
  time: string;
  venue?: string;
  participants: string[];
  teamAssignments?: Array<{ userId: string; team: 'red' | 'blue' }>;
  evaluationsSubmitted?: string[];
  status: 'evaluating' | 'completed' | 'cancelled';
};

type MeResponse = {
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

export default function AdminMatchesPage() {
  const params = useParams<{ id: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [clubRoomId, setClubRoomId] = useState('');
  const [copiedMatchId, setCopiedMatchId] = useState('');

  const queryString = useMemo(() => {
    if (!clubRoomId.trim()) return '';
    return `?clubRoomId=${encodeURIComponent(clubRoomId.trim())}`;
  }, [clubRoomId]);

  async function fetchRows() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/matches${queryString}`, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; message?: string; data?: MatchRow[] };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '경기 목록 조회에 실패했습니다.');
        return;
      }
      setRows(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const json = (await res.json()) as { success: boolean; message?: string; data?: MeResponse };
    if (!res.ok || !json.success || !json.data) {
      setMessage(json.message || '권한 정보를 불러오지 못했습니다.');
      return;
    }
    setMe(json.data);
    if (!json.data.isServiceAdmin && json.data.managedClubRooms.length > 0) {
      setClubRoomId(json.data.managedClubRooms[0]._id);
    }
  }

  async function changeStatus(id: string, status: MatchRow['status']) {
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = (await res.json()) as { success: boolean; message?: string };
    if (!res.ok || !json.success) {
      setMessage(json.message || '상태 변경에 실패했습니다.');
      return;
    }
    await fetchRows();
  }

  async function copyShareLink(id: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/team-builder?matchId=${encodeURIComponent(id)}&view=share`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedMatchId(id);
      setTimeout(() => setCopiedMatchId((prev) => (prev === id ? '' : prev)), 1500);
      setMessage('공유 링크를 복사했습니다.');
    } catch {
      setMessage(`공유 링크: ${link}`);
    }
  }

  useEffect(() => {
    fetchMe().catch(() => setMessage('권한 정보를 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    if (!me) return;
    if (!me.isServiceAdmin && !clubRoomId) return;
    fetchRows().catch(() => setMessage('목록 조회에 실패했습니다.'));
  }, [me, clubRoomId, queryString]);

  return (
    <>
      <section className="card">
        <h1>경기 관리</h1>
        <p>
          권한: <strong>{me ? (me.isServiceAdmin ? '서비스 관리자' : '클럽 관리자') : '확인 중'}</strong>
        </p>
        <div className="pc-form-grid">
          {!me?.isServiceAdmin ? (
            <select className="pc-field" value={clubRoomId} onChange={(e) => setClubRoomId(e.target.value)}>
              {me?.managedClubRooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="pc-row">
            <Link href={`${clubBase}/admin/matches/new`} className="pc-button pc-button-primary">
              경기 생성
            </Link>
            <button className="pc-button" type="button" onClick={() => fetchRows()} disabled={loading}>
              {loading ? '불러오는 중...' : '새로고침'}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>경기 목록</h2>
        <div className="pc-stack">
          {rows.map((row) => {
            const redCount = (row.teamAssignments ?? []).filter((v) => v.team === 'red').length;
            const blueCount = (row.teamAssignments ?? []).filter((v) => v.team === 'blue').length;
            return (
              <div key={row._id} className="quick-link">
                <div className="pc-flex-between">
                  <strong>
                    {row.date?.slice(0, 10)} {row.time}
                  </strong>
                  <span className={`pc-status-badge ${row.status === 'completed' ? 'active' : row.status === 'evaluating' ? 'pending' : 'inactive'}`}>
                    {row.status}
                  </span>
                </div>
                <div className="pc-meta" style={{ marginTop: 6 }}>
                  참여 {row.participants.length}명 / 제출 {(row.evaluationsSubmitted ?? []).length}명
                  {row.teamAssignments?.length ? ` / 팀저장 ${row.teamAssignments.length}명 (R${redCount}:B${blueCount})` : ' / 팀저장 없음'}
                  {row.venue ? ` / ${row.venue}` : ''}
                </div>
                <div className="pc-row" style={{ marginTop: 8 }}>
                  <Link href={`${clubBase}/team-builder?matchId=${encodeURIComponent(row._id)}`} className="pc-button">
                    팀구성
                  </Link>
                  <button className="pc-button" type="button" onClick={() => copyShareLink(row._id)}>
                    {copiedMatchId === row._id ? '복사됨' : '공유'}
                  </button>
                  {row.status === 'completed' ? (
                    <Link href={`${clubBase}/evaluation/${encodeURIComponent(row._id)}/result`} className="pc-button">
                      결과
                    </Link>
                  ) : null}
                  <Link href={`${clubBase}/admin/matches/${encodeURIComponent(row._id)}`} className="pc-button">
                    평가 수정
                  </Link>
                  <button className="pc-button" type="button" onClick={() => changeStatus(row._id, 'evaluating')}>
                    진행중
                  </button>
                  <button className="pc-button" type="button" onClick={() => changeStatus(row._id, 'completed')}>
                    완료
                  </button>
                  <button className="pc-button" type="button" onClick={() => changeStatus(row._id, 'cancelled')}>
                    취소
                  </button>
                </div>
              </div>
            );
          })}
          {rows.length === 0 ? <p>표시할 경기가 없습니다.</p> : null}
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
