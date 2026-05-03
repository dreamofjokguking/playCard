'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const SAMPLE_PARTICIPANTS = ['player-a', 'player-b', 'player-c', 'player-d', 'player-e', 'player-f'];

type MeResponse = {
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

export default function NewMatchPage() {
  const [clubRoomId, setClubRoomId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [venue, setVenue] = useState('');
  const [selected, setSelected] = useState<string[]>(['player-a', 'player-b']);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const canSubmit = useMemo(() => clubRoomId.trim() && date.trim() && time.trim() && selected.length > 0, [clubRoomId, date, time, selected]);

  function toggleParticipant(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubRoomId, date, time, venue, participants: selected })
      });
      const json = (await res.json()) as { success: boolean; message?: string; data?: { _id?: string } };
      if (!res.ok || !json.success) {
        setMessage(json.message || '경기 생성에 실패했습니다.');
        return;
      }
      setMessage(`경기 생성 완료: ${json.data?._id ?? '(id 없음)'}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json()) as { success: boolean; data?: MeResponse; message?: string };
        if (!res.ok || !json.success || !json.data) {
          setMessage(json.message || '권한 정보를 불러오지 못했습니다.');
          return;
        }
        setMe(json.data);
        if (json.data.managedClubRooms.length > 0) setClubRoomId(json.data.managedClubRooms[0]._id);
      })
      .catch(() => setMessage('권한 정보를 불러오지 못했습니다.'));
  }, []);

  return (
    <>
      <section className="card">
        <h1>경기 생성</h1>
        <p>
          권한: <strong>{me ? (me.isServiceAdmin ? '서비스 관리자' : '클럽 관리자') : '확인 중'}</strong>
        </p>
      </section>

      <section className="card">
        <h2>기본 정보</h2>
        <form onSubmit={onSubmit} className="pc-form-grid">
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
          <input className="pc-field" value={date} onChange={(e) => setDate(e.target.value)} placeholder="date (YYYY-MM-DD)" />
          <input className="pc-field" value={time} onChange={(e) => setTime(e.target.value)} placeholder="time (HH:mm)" />
          <input className="pc-field" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="venue" />

          <div className="pc-stack">
            <strong>참여자 선택</strong>
            {SAMPLE_PARTICIPANTS.map((id) => (
              <label key={id} className="quick-link" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleParticipant(id)} />
                {id}
              </label>
            ))}
          </div>

          <button className="pc-button pc-button-primary" type="submit" disabled={!canSubmit || loading}>
            {loading ? '생성 중...' : '경기 생성'}
          </button>
        </form>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
