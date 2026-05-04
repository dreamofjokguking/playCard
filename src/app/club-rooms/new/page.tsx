'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SPORT_OPTIONS = [
  { value: 'jokgu', label: '족구' },
  { value: 'soccer', label: '축구' },
  { value: 'baseball', label: '야구' },
  { value: 'tennis', label: '테니스' },
  { value: 'badminton', label: '배드민턴' },
  { value: 'etc', label: '기타' }
];

export default function ClubRoomCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('jokgu');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    if (!name.trim()) {
      setMessage('클럽 이름을 입력하세요.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meJson = (await meRes.json()) as { success: boolean; data?: { actorId: string } };
      if (!meRes.ok || !meJson.success || !meJson.data?.actorId) {
        setMessage('로그인이 필요합니다.');
        return;
      }
      const ownerId = meJson.data.actorId;

      const res = await fetch('/api/club-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), sportType, ownerId })
      });
      const json = (await res.json()) as { success: boolean; data?: { _id: string }; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '클럽 생성에 실패했습니다.');
        return;
      }
      router.push(`/club-rooms/${json.data._id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">NEW CLUB</div>
        <h1 className="pc-hero-title">클럽 생성</h1>
      </section>

      <section className="card">
        <h2>기본 정보</h2>
        <div className="pc-form-grid">
          <label>
            <span className="pc-meta">클럽 이름</span>
            <input
              className="pc-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 수요 야간 풋살"
              style={{ marginTop: 6 }}
            />
          </label>
          <label>
            <span className="pc-meta">종목</span>
            <select
              className="pc-field"
              value={sportType}
              onChange={(event) => setSportType(event.target.value)}
              style={{ marginTop: 6 }}
            >
              {SPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="pc-meta" style={{ marginTop: 8 }}>
          생성한 사용자는 자동으로 owner가 됩니다. 평가 항목(공격/수비/토스/서브 등)은 생성 후 클럽 메인에서 관리합니다.
        </p>
        <div className="pc-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="pc-button pc-button-primary"
            onClick={() => submit()}
            disabled={submitting || !name.trim()}
          >
            {submitting ? '생성 중...' : '클럽 생성'}
          </button>
          <Link href="/" className="pc-button">
            취소
          </Link>
        </div>
        {message ? (
          <p className="pc-meta" style={{ marginTop: 8 }}>
            {message}
          </p>
        ) : null}
      </section>
    </>
  );
}
