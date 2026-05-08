'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type MemberRow = {
  _id: string;
  clubRoomId: string;
  nickname: string;
  displayName: string;
  role: 'service_admin' | 'admin' | 'member' | 'pending';
  status: 'active' | 'inactive';
  favoriteGroup?: boolean;
};

type MeResponse = {
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

type ApplicationRow = {
  userId: string;
  displayName: string;
  profileImage: string;
  message: string;
  requestedAt: string;
};

export default function AdminMembersPage() {
  const params = useParams<{ id: string }>();
  const routeClubId = params?.id ?? '';
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [clubRoomId, setClubRoomId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (clubRoomId.trim()) params.set('clubRoomId', clubRoomId.trim());
    if (statusFilter.trim()) params.set('status', statusFilter.trim());
    const text = params.toString();
    return text ? `?${text}` : '';
  }, [clubRoomId, statusFilter]);

  async function fetchMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const json = (await res.json()) as { success: boolean; message?: string; data?: MeResponse };
    if (!res.ok || !json.success || !json.data) {
      setMessage(json.message || '권한 정보를 불러오지 못했습니다.');
      return;
    }
    setMe(json.data);
    if (routeClubId) {
      setClubRoomId(routeClubId);
    } else if (!json.data.isServiceAdmin && json.data.managedClubRooms.length > 0) {
      setClubRoomId(json.data.managedClubRooms[0]._id);
    }
  }

  async function fetchApplications(targetClubId: string) {
    if (!targetClubId) return;
    const res = await fetch(`/api/club-rooms/${targetClubId}/applications`, { cache: 'no-store' });
    const json = (await res.json()) as { success: boolean; data?: ApplicationRow[]; message?: string };
    if (!res.ok || !json.success || !json.data) {
      setApplications([]);
      return;
    }
    setApplications(json.data);
  }

  async function handleApplication(userId: string, action: 'accept' | 'reject') {
    if (!clubRoomId) return;
    const res = await fetch(`/api/club-rooms/${clubRoomId}/applications/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const json = (await res.json()) as { success: boolean; message?: string };
    if (!res.ok || !json.success) {
      setMessage(json.message || '신청 처리에 실패했습니다.');
      return;
    }
    await Promise.all([fetchApplications(clubRoomId), fetchRows()]);
  }

  async function fetchRows() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/members${queryString}`, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; message?: string; data?: MemberRow[] };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '멤버 목록 조회에 실패했습니다.');
        return;
      }
      setRows(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function patchMember(id: string, payload: Partial<MemberRow>) {
    const res = await fetch(`/api/admin/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = (await res.json()) as { success: boolean; message?: string };
    if (!res.ok || !json.success) {
      setMessage(json.message || '멤버 수정에 실패했습니다.');
      return;
    }
    await fetchRows();
  }

  useEffect(() => {
    fetchMe().catch(() => setMessage('권한 정보를 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    if (!me) return;
    if (!me.isServiceAdmin && !clubRoomId) return;
    fetchRows().catch(() => setMessage('멤버 목록 조회에 실패했습니다.'));
    if (clubRoomId) {
      fetchApplications(clubRoomId).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, clubRoomId, queryString]);

  return (
    <>
      <section className="card">
        <h1>멤버 관리</h1>
        <p>
          권한: <strong>{me ? (me.isServiceAdmin ? '서비스 관리자' : '클럽 관리자') : '확인 중'}</strong>
        </p>
        <div className="pc-row" style={{ marginTop: 10 }}>
          {!me?.isServiceAdmin ? (
            <select className="pc-field" value={clubRoomId} onChange={(e) => setClubRoomId(e.target.value)}>
              {me?.managedClubRooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          ) : (
            <input className="pc-field" value={clubRoomId} onChange={(e) => setClubRoomId(e.target.value)} placeholder="clubRoomId" />
          )}
          <select className="pc-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">상태 전체</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button className="pc-button" type="button" onClick={() => fetchRows()} disabled={loading}>
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>
      </section>

      {applications.length > 0 ? (
        <section className="card">
          <h2>가입 신청 {applications.length}건</h2>
          <div className="pc-stack">
            {applications.map((app) => (
              <div key={app.userId} className="quick-link">
                <div className="pc-flex-between">
                  <strong>{app.displayName}</strong>
                  <span className="pc-meta">{new Date(app.requestedAt).toLocaleDateString('ko-KR')}</span>
                </div>
                {app.message ? (
                  <div className="pc-meta" style={{ marginTop: 4, whiteSpace: 'pre-line' }}>"{app.message}"</div>
                ) : null}
                <div className="pc-row" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="pc-button pc-button-primary"
                    onClick={() => handleApplication(app.userId, 'accept')}
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    className="pc-button"
                    onClick={() => handleApplication(app.userId, 'reject')}
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>멤버 목록</h2>
        <div className="pc-stack">
          {rows.map((row) => (
            <div key={row._id} className="quick-link">
              <div className="pc-flex-between">
                <strong>
                  {row.displayName} ({row.nickname})
                </strong>
                <span className={`pc-status-badge ${row.role === 'pending' ? 'pending' : row.status === 'active' ? 'active' : 'inactive'}`}>
                  {row.role}
                </span>
              </div>
              <div className="pc-meta">status: {row.status} / 즐겨찾기: {row.favoriteGroup ? 'Y' : 'N'}</div>
              <div className="pc-row" style={{ marginTop: 8 }}>
                {row.role === 'pending' ? (
                  <>
                    <button className="pc-button" type="button" onClick={() => patchMember(row._id, { role: 'member', status: 'active' })}>
                      승인
                    </button>
                    <button className="pc-button" type="button" onClick={() => patchMember(row._id, { status: 'inactive' })}>
                      거절
                    </button>
                  </>
                ) : null}
                <button className="pc-button" type="button" onClick={() => patchMember(row._id, { role: row.role === 'admin' ? 'member' : 'admin' })}>
                  {row.role === 'admin' ? '관리자 해제' : '관리자 지정'}
                </button>
                <button className="pc-button" type="button" onClick={() => patchMember(row._id, { favoriteGroup: !row.favoriteGroup })}>
                  즐겨찾기 {row.favoriteGroup ? '해제' : '지정'}
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <p>표시할 멤버가 없습니다.</p> : null}
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
