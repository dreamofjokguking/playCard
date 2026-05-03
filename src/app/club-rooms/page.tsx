'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

type PositionMetric = {
  key: string;
  label: string;
  order: number;
  isActive?: boolean;
};

type ClubRoom = {
  _id: string;
  name: string;
  sportType: string;
  ownerId: string;
  managers: string[];
  positionMetrics: PositionMetric[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

function toUserMessage(status: number, fallback?: string) {
  if (status === 401) return '로그인이 필요합니다.';
  if (status === 403) return '권한이 없습니다. owner 또는 manager 계정으로 로그인하세요.';
  if (status === 404) return '대상을 찾을 수 없습니다.';
  if (status === 400) return fallback || '입력값을 확인하세요.';
  if (status >= 500) return '서버 오류가 발생했습니다.';
  return fallback || '요청 처리에 실패했습니다.';
}

export default function ClubRoomsPage() {
  const [name, setName] = useState('주요 스포츠 모임');
  const [sportType, setSportType] = useState('soccer');
  const [ownerId, setOwnerId] = useState('kimis0719');
  const [sessionUserId, setSessionUserId] = useState('kimis0719');
  const [sessionStateUserId, setSessionStateUserId] = useState<string | null>(null);

  const [rooms, setRooms] = useState<ClubRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ClubRoom | null>(null);
  const [editName, setEditName] = useState('');
  const [editSportType, setEditSportType] = useState('');
  const [editMetrics, setEditMetrics] = useState<PositionMetric[]>([]);
  const [newMetricKey, setNewMetricKey] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const canManageSelectedRoom = useMemo(() => {
    if (!selectedRoom || !sessionStateUserId) return false;
    return selectedRoom.ownerId === sessionStateUserId || selectedRoom.managers.includes(sessionStateUserId);
  }, [selectedRoom, sessionStateUserId]);

  async function fetchRooms() {
    const res = await fetch('/api/club-rooms', { cache: 'no-store' });
    const json = (await res.json()) as ApiResponse<ClubRoom[]>;
    if (!res.ok || !json.success || !json.data) {
      setMessage(toUserMessage(res.status, json.message || '목록 조회에 실패했습니다.'));
      return;
    }
    setRooms(json.data);
  }

  async function fetchRoomById(id: string) {
    const roomId = encodeURIComponent(id);
    const res = await fetch(`/api/club-rooms/${roomId}`, { cache: 'no-store' });
    const json = (await res.json()) as ApiResponse<ClubRoom>;
    if (!res.ok || !json.success || !json.data) {
      setMessage(toUserMessage(res.status, json.message || '상세 조회에 실패했습니다.'));
      return;
    }
    setSelectedRoom(json.data);
    setEditName(json.data.name);
    setEditSportType(json.data.sportType);
    setEditMetrics(json.data.positionMetrics ?? []);
  }

  async function fetchSession() {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const json = (await res.json()) as ApiResponse<{ userId: string | null }>;
    if (json.success && json.data) setSessionStateUserId(json.data.userId);
  }

  async function signInSession() {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: sessionUserId })
    });
    const json = (await res.json()) as ApiResponse<{ userId: string }>;
    if (!res.ok || !json.success) {
      setMessage(json.message || '세션 로그인에 실패했습니다.');
      return;
    }
    setMessage(`세션 로그인 완료: ${json.data?.userId}`);
    await fetchSession();
  }

  async function signOutSession() {
    const res = await fetch('/api/auth/session', { method: 'DELETE' });
    const json = (await res.json()) as ApiResponse<{ signedOut: boolean }>;
    if (!res.ok || !json.success) {
      setMessage(json.message || '세션 로그아웃에 실패했습니다.');
      return;
    }
    setMessage('세션 로그아웃 완료');
    await fetchSession();
  }

  async function updateSelectedRoom() {
    if (!selectedRoom?._id) {
      setMessage('상세 조회 후 수정할 수 있습니다.');
      return;
    }
    if (!canManageSelectedRoom) {
      setMessage('수정 권한이 없습니다.');
      return;
    }
    setUpdating(true);
    try {
      const roomId = encodeURIComponent(selectedRoom._id);
      const res = await fetch(`/api/club-rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, sportType: editSportType, positionMetrics: editMetrics })
      });
      const json = (await res.json()) as ApiResponse<ClubRoom>;
      if (!res.ok || !json.success || !json.data) {
        setMessage(toUserMessage(res.status, json.message || '수정에 실패했습니다.'));
        return;
      }
      setSelectedRoom(json.data);
      setEditMetrics(json.data.positionMetrics ?? []);
      setMessage(`수정 완료: ${json.data._id}`);
      await fetchRooms();
    } finally {
      setUpdating(false);
    }
  }

  async function deleteSelectedRoom() {
    if (!selectedRoom?._id) {
      setMessage('상세 조회 후 삭제할 수 있습니다.');
      return;
    }
    if (!canManageSelectedRoom) {
      setMessage('삭제 권한이 없습니다.');
      return;
    }
    if (!window.confirm('선택한 클럽룸을 삭제할까요?')) return;
    setDeleting(true);
    try {
      const roomId = encodeURIComponent(selectedRoom._id);
      const res = await fetch(`/api/club-rooms/${roomId}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ _id: string }>;
      if (!res.ok || !json.success) {
        setMessage(toUserMessage(res.status, json.message || '삭제에 실패했습니다.'));
        return;
      }
      setSelectedRoom(null);
      setEditName('');
      setEditSportType('');
      setEditMetrics([]);
      setMessage('삭제 완료');
      await fetchRooms();
    } finally {
      setDeleting(false);
    }
  }

  function addMetric() {
    if (!canManageSelectedRoom) {
      setMessage('메트릭 편집 권한이 없습니다.');
      return;
    }
    const key = newMetricKey.trim();
    const label = newMetricLabel.trim();
    if (!key || !label) {
      setMessage('metric key와 label을 입력하세요.');
      return;
    }
    if (editMetrics.some((m) => m.key === key)) {
      setMessage('이미 존재하는 metric key입니다.');
      return;
    }
    setEditMetrics((prev) => [...prev, { key, label, order: prev.length + 1, isActive: true }]);
    setNewMetricKey('');
    setNewMetricLabel('');
  }

  function removeMetric(key: string) {
    if (!canManageSelectedRoom) {
      setMessage('메트릭 편집 권한이 없습니다.');
      return;
    }
    setEditMetrics((prev) => prev.filter((m) => m.key !== key).map((m, i) => ({ ...m, order: i + 1 })));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/club-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sportType,
          ownerId,
          managers: [ownerId],
          positionMetrics: [
            { key: 'attack', label: '공격', order: 1 },
            { key: 'defense', label: '수비', order: 2 }
          ]
        })
      });
      const json = (await res.json()) as ApiResponse<{ _id: string }>;
      if (!res.ok || !json.success) {
        setMessage(toUserMessage(res.status, json.message || '생성에 실패했습니다.'));
        return;
      }
      setMessage('클럽룸 생성 완료');
      await fetchRooms();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms().catch(() => setMessage('목록 조회에 실패했습니다.'));
    fetchSession().catch(() => setMessage('세션 조회에 실패했습니다.'));
  }, []);

  return (
    <>
      <section className="card">
        <h1>클럽룸 관리</h1>
        <p>CRUD + 세션 기반 권한 검증을 동일 화면에서 테스트합니다.</p>
      </section>

      <section className="card">
        <h2>세션</h2>
        <div className="pc-form-grid">
          <input className="pc-field" value={sessionUserId} onChange={(e) => setSessionUserId(e.target.value)} placeholder="session user id" />
          <div className="pc-row">
            <button className="pc-button pc-button-primary" type="button" onClick={() => signInSession()}>
              로그인
            </button>
            <button className="pc-button" type="button" onClick={() => signOutSession()}>
              로그아웃
            </button>
          </div>
          <div className="quick-link">현재 세션: {sessionStateUserId ?? '(없음)'}</div>
        </div>
      </section>

      <section className="card">
        <h2>클럽룸 생성</h2>
        <form className="pc-form-grid" onSubmit={onSubmit}>
          <input className="pc-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
          <input className="pc-field" value={sportType} onChange={(e) => setSportType(e.target.value)} placeholder="sportType" />
          <input className="pc-field" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="ownerId" />
          <button className="pc-button pc-button-primary" type="submit" disabled={loading}>
            {loading ? '생성 중...' : '생성'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>클럽룸 목록</h2>
        <div className="pc-row" style={{ marginTop: 10 }}>
          <button className="pc-button" type="button" onClick={() => fetchRooms()}>
            새로고침
          </button>
        </div>
        <div className="pc-stack">
          {rooms.map((room) => (
            <div key={room._id} className="quick-link">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{room.name}</strong>
                <span className="pc-meta">{room.sportType}</span>
              </div>
              <div className="pc-meta">owner: {room.ownerId}</div>
              <div className="pc-row" style={{ marginTop: 8 }}>
                <button className="pc-button" type="button" onClick={() => fetchRoomById(room._id)}>
                  상세 조회
                </button>
              </div>
            </div>
          ))}
          {rooms.length === 0 ? <p>표시할 클럽룸이 없습니다.</p> : null}
        </div>
      </section>

      <section className="card">
        <h2>상세 편집</h2>
        <p>편집 권한: {canManageSelectedRoom ? '있음' : '없음'}</p>
        <div className="pc-form-grid">
          <input className="pc-field" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="name" />
          <input className="pc-field" value={editSportType} onChange={(e) => setEditSportType(e.target.value)} placeholder="sportType" />

          <div className="pc-row">
            <input className="pc-field" value={newMetricKey} onChange={(e) => setNewMetricKey(e.target.value)} placeholder="metric key" />
            <input className="pc-field" value={newMetricLabel} onChange={(e) => setNewMetricLabel(e.target.value)} placeholder="metric label" />
            <button className="pc-button" type="button" onClick={() => addMetric()}>
              메트릭 추가
            </button>
          </div>

          <div className="pc-stack">
            {editMetrics.map((metric) => (
              <div key={metric.key} className="quick-link" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <strong>{metric.label}</strong> ({metric.key})
                </div>
                <button className="pc-button" type="button" onClick={() => removeMetric(metric.key)}>
                  삭제
                </button>
              </div>
            ))}
          </div>

          <div className="pc-row">
            <button className="pc-button pc-button-primary" type="button" onClick={() => updateSelectedRoom()} disabled={updating}>
              {updating ? '수정 중...' : '수정 저장'}
            </button>
            <button className="pc-button" type="button" onClick={() => deleteSelectedRoom()} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
