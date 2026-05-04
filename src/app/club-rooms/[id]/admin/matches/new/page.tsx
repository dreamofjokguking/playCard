'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type MeResponse = {
  role: string;
  isServiceAdmin: boolean;
  managedClubRooms: { _id: string; name: string }[];
};

type MemberRow = {
  _id: string;
  displayName?: string;
  nickname?: string;
  role: 'service_admin' | 'admin' | 'member' | 'pending';
  status: 'active' | 'inactive';
};

type ParticipantPreset = {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const MIN_PARTICIPANTS = 4;

export default function NewMatchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [clubRoomId, setClubRoomId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [venue, setVenue] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [presets, setPresets] = useState<ParticipantPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const canSubmit = useMemo(
    () => clubRoomId.trim() && date.trim() && time.trim() && selected.length >= MIN_PARTICIPANTS,
    [clubRoomId, date, time, selected]
  );

  const selectableMembers = useMemo(
    () => members.filter((member) => member.status === 'active' && member.role !== 'pending'),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return selectableMembers;
    return selectableMembers.filter((member) => {
      const label = `${member.displayName || ''} ${member.nickname || ''} ${member._id}`.toLowerCase();
      return label.includes(q);
    });
  }, [memberQuery, selectableMembers]);

  const selectedLabels = useMemo(() => {
    const labelMap = new Map(
      selectableMembers.map((member) => [member._id, member.displayName || member.nickname || member._id])
    );
    return selected.map((id) => labelMap.get(id) || id);
  }, [selected, selectableMembers]);

  const presetStorageKey = useMemo(() => `matchParticipantPresets:${clubRoomId || 'global'}`, [clubRoomId]);

  async function parseJsonSafe<T>(res: Response): Promise<T | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  function toggleParticipant(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function selectAllFiltered() {
    const ids = filteredMembers.map((member) => member._id);
    setSelected((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function clearAllSelected() {
    setSelected([]);
  }

  function loadPresets() {
    try {
      const raw = localStorage.getItem(presetStorageKey);
      if (!raw) {
        setPresets([]);
        return;
      }
      const parsed = JSON.parse(raw) as ParticipantPreset[];
      if (!Array.isArray(parsed)) {
        setPresets([]);
        return;
      }
      setPresets(parsed);
    } catch {
      setPresets([]);
    }
  }

  function savePresets(next: ParticipantPreset[]) {
    localStorage.setItem(presetStorageKey, JSON.stringify(next));
    setPresets(next);
  }

  function saveCurrentAsPreset() {
    const trimmed = presetName.trim();
    if (!trimmed) {
      setMessage('프리셋 이름을 입력해주세요.');
      return;
    }
    if (selected.length === 0) {
      setMessage('선택된 멤버가 없습니다.');
      return;
    }
    const newPreset: ParticipantPreset = {
      id: `${Date.now()}`,
      name: trimmed,
      memberIds: selected,
      createdAt: new Date().toISOString()
    };
    const next = [newPreset, ...presets].slice(0, 20);
    savePresets(next);
    setPresetName('');
    setMessage(`프리셋 저장 완료: ${trimmed}`);
  }

  function applyPreset(preset: ParticipantPreset) {
    const allowed = new Set(selectableMembers.map((member) => member._id));
    const nextSelected = preset.memberIds.filter((id) => allowed.has(id));
    setSelected(nextSelected);
    setMessage(`프리셋 적용: ${preset.name}`);
  }

  function removePreset(presetId: string) {
    const next = presets.filter((preset) => preset.id !== presetId);
    savePresets(next);
  }

  function openTeamBuilderPreview(memberIds = selected) {
    const picked = selectableMembers
      .filter((member) => memberIds.includes(member._id))
      .map((member) => ({
        _id: member._id,
        displayName: member.displayName || member.nickname || member._id
      }));
    localStorage.setItem('teamBuilderDraft', JSON.stringify(picked));
    router.push(`${clubBase}/team-builder?source=admin-draft`);
  }

  function applyPresetAndPreview(preset: ParticipantPreset) {
    const allowed = new Set(selectableMembers.map((member) => member._id));
    const nextSelected = preset.memberIds.filter((id) => allowed.has(id));
    if (nextSelected.length === 0) {
      setMessage('프리셋 멤버를 찾을 수 없습니다.');
      return;
    }
    setSelected(nextSelected);
    openTeamBuilderPreview(nextSelected);
  }

  async function fetchMembers(nextClubRoomId: string) {
    if (!nextClubRoomId.trim()) {
      setMembers([]);
      setSelected([]);
      return;
    }
    setMemberLoading(true);
    try {
      const res = await fetch(`/api/admin/members?clubRoomId=${encodeURIComponent(nextClubRoomId)}&status=active`, {
        cache: 'no-store'
      });
      const json = await parseJsonSafe<ApiResponse<MemberRow[]>>(res);
      if (!res.ok || !json?.success || !json.data) {
        setMessage(json?.message || '참여자 목록을 불러오지 못했습니다.');
        setMembers([]);
        setSelected([]);
        return;
      }
      setMembers(json.data);
      const allowedIds = new Set(json.data.map((member) => member._id));
      setSelected((prev) => prev.filter((id) => allowedIds.has(id)));
    } finally {
      setMemberLoading(false);
    }
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
      const json = await parseJsonSafe<ApiResponse<{ _id?: string }>>(res);
      if (!res.ok || !json?.success) {
        setMessage(json?.message || '경기 생성에 실패했습니다.');
        return;
      }
      setMessage(`경기 생성 완료: ${json.data?._id ?? '(id 없음)'}`);
      setVenue('');
      setSelected([]);
      setMemberQuery('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        const json = await parseJsonSafe<ApiResponse<MeResponse>>(res);
        if (!res.ok || !json?.success || !json.data) {
          setMessage(json?.message || '권한 정보를 불러오지 못했습니다.');
          return;
        }
        setMe(json.data);
        if (json.data.managedClubRooms.length > 0) {
          const firstClubRoomId = json.data.managedClubRooms[0]._id;
          setClubRoomId(firstClubRoomId);
          await fetchMembers(firstClubRoomId);
        }
      })
      .catch(() => setMessage('권한 정보를 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    if (!me) return;
    fetchMembers(clubRoomId).catch(() => setMessage('참여자 목록을 불러오지 못했습니다.'));
  }, [clubRoomId, me]);

  useEffect(() => {
    loadPresets();
  }, [presetStorageKey]);

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
            <input
              className="pc-field"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="멤버 검색 (이름/닉네임/id)"
            />
            <div className="pc-row">
              <button className="pc-button" type="button" onClick={() => selectAllFiltered()} disabled={filteredMembers.length === 0}>
                검색결과 전체 선택
              </button>
              <button className="pc-button" type="button" onClick={() => clearAllSelected()} disabled={selected.length === 0}>
                전체 해제
              </button>
              <span className="pc-meta" style={{ alignSelf: 'center' }}>
                선택 {selected.length}명 / 최소 {MIN_PARTICIPANTS}명
              </span>
            </div>
            {memberLoading ? <p>멤버를 불러오는 중...</p> : null}
            {!memberLoading &&
              filteredMembers.map((member) => {
                const label = member.displayName || member.nickname || member._id;
                return (
                  <label key={member._id} className="quick-link" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={selected.includes(member._id)} onChange={() => toggleParticipant(member._id)} />
                    {label}
                  </label>
                );
              })}
            {!memberLoading && selectableMembers.length === 0 ? <p>선택 가능한 멤버가 없습니다.</p> : null}
            {!memberLoading && selectableMembers.length > 0 && filteredMembers.length === 0 ? <p>검색 결과가 없습니다.</p> : null}
          </div>

          <div className="quick-link">
            <strong>선택 인원 요약</strong>
            <div className="pc-meta" style={{ marginTop: 6 }}>
              {selected.length >= MIN_PARTICIPANTS
                ? `생성 가능: ${selected.length}명 선택`
                : `최소 ${MIN_PARTICIPANTS}명 필요: 현재 ${selected.length}명`}
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedLabels.map((label) => (
                <span key={label} className="pc-status-badge active">
                  {label}
                </span>
              ))}
              {selectedLabels.length === 0 ? <span className="pc-meta">선택된 멤버가 없습니다.</span> : null}
            </div>
          </div>

          <div className="quick-link">
            <strong>멤버 조합 프리셋</strong>
            <div className="pc-row" style={{ marginTop: 8 }}>
              <input className="pc-field" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="프리셋 이름" />
              <button className="pc-button" type="button" onClick={() => saveCurrentAsPreset()}>
                현재 선택 저장
              </button>
            </div>
            <div className="pc-stack" style={{ marginTop: 8 }}>
              {presets.map((preset) => (
                <div key={preset.id} className="pc-row">
                  <button className="pc-button" type="button" onClick={() => applyPreset(preset)}>
                    {preset.name} ({preset.memberIds.length}명)
                  </button>
                  <button className="pc-button" type="button" onClick={() => applyPresetAndPreview(preset)}>
                    팀구성 미리보기
                  </button>
                  <button className="pc-button" type="button" onClick={() => removePreset(preset.id)}>
                    삭제
                  </button>
                </div>
              ))}
              {presets.length === 0 ? <span className="pc-meta">저장된 프리셋이 없습니다.</span> : null}
            </div>
          </div>

          <button className="pc-button pc-button-primary" type="submit" disabled={!canSubmit || loading}>
            {loading ? '생성 중...' : '경기 생성'}
          </button>
          <button className="pc-button" type="button" onClick={() => openTeamBuilderPreview()} disabled={selected.length === 0}>
            선택 인원으로 팀구성 미리보기
          </button>
        </form>
      </section>

      {message ? <p style={{ color: 'var(--pc-muted)' }}>{message}</p> : null}
    </>
  );
}
