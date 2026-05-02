'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type MatchRow = {
  _id: string;
  clubRoomId: string;
  date: string;
  time: string;
  venue?: string;
  participants: string[];
  evaluationsSubmitted?: string[];
  status: 'evaluating' | 'completed' | 'cancelled';
};

type MeResponse = {
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

export default function AdminMatchesPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [clubRoomId, setClubRoomId] = useState('');

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
        setMessage(json.message || '목록 조회 실패');
        return;
      }
      setRows(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const json = (await res.json()) as { success: boolean; message?: string; data?: MeResponse };
    if (!res.ok || !json.success || !json.data) {
      setMessage(json.message || '권한 정보 조회 실패');
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
      setMessage(json.message || '상태 변경 실패');
      return;
    }
    await fetchRows();
  }

  useEffect(() => {
    fetchMe().catch(() => setMessage('권한 정보 조회 실패'));
  }, []);

  useEffect(() => {
    if (!me) return;
    if (!me.isServiceAdmin && !clubRoomId) return;
    fetchRows().catch(() => setMessage('목록 조회 실패'));
  }, [me, clubRoomId, queryString]);

  return (
    <section className="card">
      <h1>경기 관리</h1>
      <p>
        권한 모드: <strong>{me ? (me.isServiceAdmin ? '서비스 관리자' : '클럽 관리자') : '확인 중'}</strong>
      </p>

      {!me?.isServiceAdmin ? (
        <div style={{ marginTop: 8 }}>
          <label>클럽룸 선택: </label>
          <select value={clubRoomId} onChange={(e) => setClubRoomId(e.target.value)}>
            {me?.managedClubRooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <Link href="/admin/matches/new">경기 생성</Link>
        <button onClick={() => fetchRows()} disabled={loading}>
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      <ul className="check-list" style={{ marginTop: 10 }}>
        {rows.map((row) => (
          <li key={row._id}>
            <strong>{row.date?.slice(0, 10)}</strong> {row.time} / {row.status} / 참여 {row.participants.length}명 /
            제출 {(row.evaluationsSubmitted ?? []).length}명
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button onClick={() => changeStatus(row._id, 'evaluating')}>진행중</button>
              <button onClick={() => changeStatus(row._id, 'completed')}>완료</button>
              <button onClick={() => changeStatus(row._id, 'cancelled')}>취소</button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </section>
  );
}
