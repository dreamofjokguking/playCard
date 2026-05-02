'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

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
    if (!selectedRoom || !sessionStateUserId) {
      return false;
    }
    return (
      selectedRoom.ownerId === sessionStateUserId ||
      selectedRoom.managers.includes(sessionStateUserId)
    );
  }, [selectedRoom, sessionStateUserId]);

  async function fetchRooms() {
    const res = await fetch('/api/club-rooms', { cache: 'no-store' });
    const json = (await res.json()) as ApiResponse<ClubRoom[]>;
    if (!res.ok || !json.success || !json.data) {
      setMessage(toUserMessage(res.status, json.message || '목록 조회 실패'));
      return;
    }
    setRooms(json.data);
  }

  async function fetchRoomById(id: string) {
    const roomId = encodeURIComponent(String(id));
    const res = await fetch(`/api/club-rooms/${roomId}`, { cache: 'no-store' });
    const json = (await res.json()) as ApiResponse<ClubRoom>;
    if (!res.ok || !json.success || !json.data) {
      setMessage(toUserMessage(res.status, json.message || '상세 조회 실패'));
      return;
    }
    setSelectedRoom(json.data);
    setEditName(json.data.name);
    setEditSportType(json.data.sportType);
    setEditMetrics(json.data.positionMetrics ?? []);
    setMessage(`상세 조회 성공: ${json.data._id}`);
  }

  async function fetchSession() {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const json = (await res.json()) as ApiResponse<{ userId: string | null }>;
    if (json.success && json.data) {
      setSessionStateUserId(json.data.userId);
    }
  }

  async function signInSession() {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: sessionUserId })
    });
    const json = (await res.json()) as ApiResponse<{ userId: string }>;
    if (!res.ok || !json.success) {
      setMessage(json.message || '세션 로그인 실패');
      return;
    }
    setMessage(`세션 로그인: ${json.data?.userId}`);
    await fetchSession();
  }

  async function signOutSession() {
    const res = await fetch('/api/auth/session', { method: 'DELETE' });
    const json = (await res.json()) as ApiResponse<{ signedOut: boolean }>;
    if (!res.ok || !json.success) {
      setMessage(json.message || '세션 로그아웃 실패');
      return;
    }
    setMessage('세션 로그아웃');
    await fetchSession();
  }

  async function updateSelectedRoom() {
    if (!selectedRoom?._id) {
      setMessage('먼저 상세 조회를 해주세요.');
      return;
    }
    if (!canManageSelectedRoom) {
      setMessage('수정 권한이 없습니다.');
      return;
    }
    setUpdating(true);
    try {
      const roomId = encodeURIComponent(String(selectedRoom._id));
      const res = await fetch(`/api/club-rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          sportType: editSportType,
          positionMetrics: editMetrics
        })
      });
      const json = (await res.json()) as ApiResponse<ClubRoom>;
      if (!res.ok || !json.success || !json.data) {
        setMessage(toUserMessage(res.status, json.message || '수정 실패'));
        return;
      }
      setSelectedRoom(json.data);
      setEditMetrics(json.data.positionMetrics ?? []);
      setMessage(`수정 성공: ${json.data._id}`);
      await fetchRooms();
    } finally {
      setUpdating(false);
    }
  }

  async function deleteSelectedRoom() {
    if (!selectedRoom?._id) {
      setMessage('먼저 상세 조회를 해주세요.');
      return;
    }
    if (!canManageSelectedRoom) {
      setMessage('삭제 권한이 없습니다.');
      return;
    }
    if (!window.confirm('선택한 클럽룸을 삭제할까요?')) {
      return;
    }
    setDeleting(true);
    try {
      const roomId = encodeURIComponent(String(selectedRoom._id));
      const res = await fetch(`/api/club-rooms/${roomId}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ _id: string }>;
      if (!res.ok || !json.success) {
        setMessage(toUserMessage(res.status, json.message || '삭제 실패'));
        return;
      }
      setMessage(`삭제 성공: ${selectedRoom._id}`);
      setSelectedRoom(null);
      setEditName('');
      setEditSportType('');
      setEditMetrics([]);
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
      setMessage('metric key, label을 입력하세요.');
      return;
    }
    if (editMetrics.some((metric) => metric.key === key)) {
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
    setEditMetrics((prev) =>
      prev
        .filter((metric) => metric.key !== key)
        .map((metric, index) => ({ ...metric, order: index + 1 }))
    );
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
        setMessage(toUserMessage(res.status, json.message || '생성 실패'));
        return;
      }
      setMessage('클럽룸 생성 성공');
      await fetchRooms();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms().catch(() => setMessage('목록 조회 실패'));
    fetchSession().catch(() => setMessage('세션 조회 실패'));
  }, []);

  return (
    <main>
      <h1>클럽룸 테스트 페이지</h1>
      <p>CRUD + 세션 기반 권한 검증을 한 화면에서 테스트합니다.</p>

      <section className="card">
        <h2>세션 설정</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            value={sessionUserId}
            onChange={(e) => setSessionUserId(e.target.value)}
            placeholder="session user id"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={signInSession}>로그인(세션 설정)</button>
            <button onClick={signOutSession}>로그아웃(세션 해제)</button>
          </div>
          <p>
            현재 세션 사용자: <strong>{sessionStateUserId ?? '(없음)'}</strong>
          </p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>클럽룸 생성</h2>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
          <input value={sportType} onChange={(e) => setSportType(e.target.value)} placeholder="sportType" />
          <input value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="ownerId" />
          <button type="submit" disabled={loading}>
            {loading ? '생성 중...' : '생성'}
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>클럽룸 목록</h2>
        <button onClick={() => fetchRooms()}>목록 새로고침</button>
        <ul className="check-list">
          {rooms.map((room) => (
            <li key={room._id}>
              <strong>{room.name}</strong> ({room.sportType}) / owner: {room.ownerId}{' '}
              <button onClick={() => fetchRoomById(room._id)}>상세 조회</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>상세 조회 결과</h2>
        <pre>{selectedRoom ? JSON.stringify(selectedRoom, null, 2) : '조회 전'}</pre>
        <p>
          편집 권한: <strong>{canManageSelectedRoom ? '허용' : '없음'}</strong>
        </p>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="수정할 name" />
          <input
            value={editSportType}
            onChange={(e) => setEditSportType(e.target.value)}
            placeholder="수정할 sportType"
          />

          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
            <strong>positionMetrics</strong>
            <ul className="check-list">
              {editMetrics.map((metric) => (
                <li key={metric.key}>
                  {metric.key} / {metric.label} / order {metric.order}{' '}
                  <button onClick={() => removeMetric(metric.key)} disabled={!canManageSelectedRoom}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              <input
                value={newMetricKey}
                onChange={(e) => setNewMetricKey(e.target.value)}
                placeholder="new metric key (e.g. pass)"
              />
              <input
                value={newMetricLabel}
                onChange={(e) => setNewMetricLabel(e.target.value)}
                placeholder="new metric label (e.g. 패스)"
              />
              <button onClick={() => addMetric()} disabled={!canManageSelectedRoom}>
                메트릭 추가
              </button>
            </div>
          </div>

          <button onClick={() => updateSelectedRoom()} disabled={updating || deleting || !canManageSelectedRoom}>
            {updating ? '수정 중...' : '선택 클럽룸 수정'}
          </button>
          <button onClick={() => deleteSelectedRoom()} disabled={updating || deleting || !canManageSelectedRoom}>
            {deleting ? '삭제 중...' : '선택 클럽룸 삭제'}
          </button>
        </div>
      </section>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}
    </main>
  );
}
