'use client';

import { FormEvent, useEffect, useState } from 'react';

type PositionMetric = {
  key: string;
  label: string;
  order: number;
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
  if (status === 401) {
    return '인증 정보가 필요합니다. actorId를 확인해주세요.';
  }
  if (status === 403) {
    return '권한이 없습니다. owner 또는 manager 계정으로 시도해주세요.';
  }
  if (status === 404) {
    return '대상을 찾을 수 없습니다. 목록을 새로고침해주세요.';
  }
  if (status === 400) {
    return fallback || '입력값을 확인해주세요.';
  }
  if (status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  return fallback || '요청 처리에 실패했습니다.';
}

export default function ClubRoomsPage() {
  const [name, setName] = useState('토요 저녁 풋살');
  const [sportType, setSportType] = useState('soccer');
  const [ownerId, setOwnerId] = useState('kimis0719');
  const [actorId, setActorId] = useState('kimis0719');
  const [rooms, setRooms] = useState<ClubRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ClubRoom | null>(null);
  const [editName, setEditName] = useState('');
  const [editSportType, setEditSportType] = useState('');
  const [editMetrics, setEditMetrics] = useState<PositionMetric[]>([]);
  const [newMetricKey, setNewMetricKey] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchRooms() {
    try {
      const res = await fetch('/api/club-rooms', { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<ClubRoom[]>;
      if (!res.ok || !json.success || !json.data) {
        setMessage(toUserMessage(res.status, json.message || '목록 조회 실패'));
        return;
      }
      setRooms(json.data);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '네트워크 오류';
      setMessage(`목록 요청 실패: ${reason}`);
    }
  }

  async function fetchRoomById(id: string) {
    try {
      const roomId = encodeURIComponent(String(id));
      const res = await fetch(`/api/club-rooms/${roomId}`, { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<ClubRoom>;
      if (!res.ok || !json.success || !json.data) {
        setMessage(toUserMessage(res.status, json.message || '단건 조회 실패'));
        return;
      }
      setSelectedRoom(json.data);
      setEditName(json.data.name);
      setEditSportType(json.data.sportType);
      setEditMetrics(json.data.positionMetrics ?? []);
      setMessage(`단건 조회 성공: ${json.data._id}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '네트워크 오류';
      setMessage(`단건 조회 요청 실패: ${reason}`);
    }
  }

  async function updateSelectedRoom() {
    if (!selectedRoom?._id) {
      setMessage('먼저 단건 조회를 해주세요.');
      return;
    }

    setUpdating(true);
    try {
      const roomId = encodeURIComponent(String(selectedRoom._id));
      const res = await fetch(`/api/club-rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-id': actorId
        },
        body: JSON.stringify({
          name: editName,
          sportType: editSportType,
          positionMetrics: editMetrics
        })
      });
      const json = (await res.json()) as ApiResponse<ClubRoom>;
      if (!res.ok) {
        setMessage(`수정 실패(${res.status}): ${json.message || '요청 실패'}`);
        return;
      }
      if (!json.success || !json.data) {
        setMessage(json.message || '수정 실패');
        return;
      }

      setSelectedRoom(json.data);
      setEditMetrics(json.data.positionMetrics ?? []);
      setMessage(`수정 성공: ${json.data._id}`);
      await fetchRooms();
    } catch (error) {
      const reason = error instanceof Error ? error.message : '네트워크 오류';
      setMessage(`수정 요청 실패: ${reason}`);
    } finally {
      setUpdating(false);
    }
  }

  async function deleteSelectedRoom() {
    if (!selectedRoom?._id) {
      setMessage('먼저 단건 조회를 해주세요.');
      return;
    }

    const ok = window.confirm('선택한 클럽룸을 삭제할까요?');
    if (!ok) {
      setMessage('삭제를 취소했습니다.');
      return;
    }

    setDeleting(true);
    setMessage('삭제 요청 중...');
    try {
      const roomId = encodeURIComponent(String(selectedRoom._id));
      const res = await fetch(`/api/club-rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'x-actor-id': actorId
        }
      });
      const json = (await res.json()) as ApiResponse<{ _id: string }>;
      if (!res.ok) {
        const msg = `삭제 실패(${res.status}): ${json.message || '요청 실패'}`;
        setMessage(msg);
        window.alert(msg);
        return;
      }
      if (!json.success) {
        const msg = json.message || '삭제 실패';
        setMessage(msg);
        window.alert(msg);
        return;
      }

      const successMsg = `삭제 성공: ${selectedRoom._id}`;
      setMessage(successMsg);
      window.alert(successMsg);
      setSelectedRoom(null);
      setEditName('');
      setEditSportType('');
      setEditMetrics([]);
      await fetchRooms();
    } catch (error) {
      const reason = error instanceof Error ? error.message : '네트워크 오류';
      const msg = `삭제 요청 실패: ${reason}`;
      setMessage(msg);
      window.alert(msg);
    } finally {
      setDeleting(false);
    }
  }

  function addMetric() {
    const key = newMetricKey.trim();
    const label = newMetricLabel.trim();
    if (!key || !label) {
      setMessage('메트릭 key, label을 입력하세요.');
      return;
    }
    if (editMetrics.some((metric) => metric.key === key)) {
      setMessage('같은 key가 이미 있습니다.');
      return;
    }
    const metric: PositionMetric = {
      key,
      label,
      order: editMetrics.length + 1
    };
    setEditMetrics((prev) => [...prev, metric]);
    setNewMetricKey('');
    setNewMetricLabel('');
  }

  function removeMetric(key: string) {
    setEditMetrics((prev) =>
      prev
        .filter((metric) => metric.key !== key)
        .map((metric, index) => ({ ...metric, order: index + 1 }))
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

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
      if (!res.ok) {
        setMessage(toUserMessage(res.status, json.message || '생성 실패'));
        return;
      }
      if (!json.success) {
        setMessage(json.message || '생성 실패');
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
  }, []);

  return (
    <main>
      <h1>클럽룸 테스트 페이지</h1>
      <p>UI에서 생성/목록/단건 조회를 바로 확인할 수 있습니다.</p>

      <section className="card">
        <h2>클럽룸 생성</h2>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
          <input
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            placeholder="sportType"
          />
          <input
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="ownerId"
          />
          <button type="submit" disabled={loading}>
            {loading ? '생성 중...' : '생성'}
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>권한 테스트 설정</h2>
        <input
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
          placeholder="actorId (x-actor-id)"
        />
        <p style={{ marginTop: 8 }}>
          현재 actorId: <strong>{actorId || '(비어있음)'}</strong>
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>클럽룸 목록</h2>
        <button onClick={() => fetchRooms()}>목록 새로고침</button>
        <ul className="check-list">
          {rooms.map((room) => (
            <li key={room._id}>
              <strong>{room.name}</strong> ({room.sportType}) / owner: {room.ownerId}{' '}
              <button onClick={() => fetchRoomById(room._id)}>단건 조회</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>단건 조회 결과</h2>
        <pre>{selectedRoom ? JSON.stringify(selectedRoom, null, 2) : '조회 전'}</pre>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="수정할 name"
          />
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
                  <button onClick={() => removeMetric(metric.key)}>삭제</button>
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
              <button onClick={() => addMetric()}>메트릭 추가</button>
            </div>
          </div>
          <button onClick={() => updateSelectedRoom()} disabled={updating || deleting}>
            {updating ? '수정 중...' : '선택 클럽룸 수정'}
          </button>
          <button onClick={() => deleteSelectedRoom()} disabled={updating || deleting}>
            {deleting ? '삭제 중...' : '선택 클럽룸 삭제'}
          </button>
        </div>
      </section>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}
    </main>
  );
}
