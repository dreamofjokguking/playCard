'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type PositionMetric = {
  key: string;
  label: string;
  isActive: boolean;
  order: number;
};

type ClubDetail = {
  _id: string;
  name: string;
  ownerId: string;
  managers?: string[];
  positionMetrics?: PositionMetric[];
};

const PRESET_METRICS: { key: string; label: string }[] = [
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '수비' },
  { key: 'toss', label: '토스' },
  { key: 'serve', label: '서브' },
  { key: 'pass', label: '패스' },
  { key: 'set', label: '세터' },
  { key: 'reception', label: '리시브' },
  { key: 'spike', label: '스파이크' },
  { key: 'block', label: '블로킹' },
  { key: 'dribble', label: '드리블' },
  { key: 'shoot', label: '슛' },
  { key: 'pitching', label: '투구' },
  { key: 'batting', label: '타격' },
  { key: 'fielding', label: '수비(야수)' },
  { key: 'stamina', label: '체력' },
  { key: 'teamwork', label: '팀워크' }
];

export default function AdminPositionsPage() {
  const params = useParams<{ id: string }>();
  const clubBase = `/club-rooms/${params.id}`;
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [metrics, setMetrics] = useState<PositionMetric[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/club-rooms/${params.id}`, { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: ClubDetail; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '클럽 정보를 불러오지 못했습니다.');
        return;
      }
      setClub(json.data);
      setMetrics(
        (json.data.positionMetrics ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((m, i) => ({ ...m, order: i + 1 }))
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('조회 실패'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function addPreset(preset: { key: string; label: string }) {
    if (metrics.some((m) => m.key === preset.key)) {
      setMessage(`${preset.label}은(는) 이미 추가되어 있습니다.`);
      return;
    }
    setMetrics((prev) => [
      ...prev,
      { key: preset.key, label: preset.label, isActive: true, order: prev.length + 1 }
    ]);
  }

  function addCustom() {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    const label = newLabel.trim();
    if (!key || !label) {
      setMessage('key와 label을 모두 입력하세요.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(key)) {
      setMessage('key는 영문 소문자/숫자/언더스코어만 사용할 수 있습니다.');
      return;
    }
    if (metrics.some((m) => m.key === key)) {
      setMessage('이미 존재하는 key입니다.');
      return;
    }
    setMetrics((prev) => [...prev, { key, label, isActive: true, order: prev.length + 1 }]);
    setNewKey('');
    setNewLabel('');
    setMessage('');
  }

  function removeMetric(key: string) {
    setMetrics((prev) => prev.filter((m) => m.key !== key).map((m, i) => ({ ...m, order: i + 1 })));
  }

  function moveMetric(key: string, direction: -1 | 1) {
    setMetrics((prev) => {
      const index = prev.findIndex((m) => m.key === key);
      if (index < 0) return prev;
      const next = [...prev];
      const swap = index + direction;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next.map((m, i) => ({ ...m, order: i + 1 }));
    });
  }

  function toggleActive(key: string) {
    setMetrics((prev) => prev.map((m) => (m.key === key ? { ...m, isActive: !m.isActive } : m)));
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/club-rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionMetrics: metrics })
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !json.success) {
        setMessage(json.message || '저장에 실패했습니다.');
        return;
      }
      setMessage('평가 항목이 저장되었습니다.');
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>평가 포지션 관리</h1>
            <p className="pc-meta" style={{ marginTop: 0 }}>
              경기 평가에서 사용할 항목(공격/수비/토스 등)을 등록하고 순서를 정합니다.
            </p>
          </div>
          <Link href={`${clubBase}/admin`} className="pc-pill">
            ← 관리로
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>현재 평가 항목</h2>
        {loading ? <p>불러오는 중...</p> : null}
        {!loading && metrics.length === 0 ? (
          <p className="pc-meta">아직 등록된 항목이 없습니다. 아래 프리셋에서 빠르게 추가할 수 있습니다.</p>
        ) : null}
        <div className="pc-stack">
          {metrics.map((metric, index) => (
            <div key={metric.key} className="quick-link">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <strong>{metric.label}</strong>{' '}
                  <span className="pc-meta">({metric.key})</span>
                </div>
                <span className={`pc-status-badge ${metric.isActive ? 'active' : 'inactive'}`}>
                  {metric.isActive ? '활성' : '비활성'}
                </span>
              </div>
              <div className="pc-row" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="pc-button"
                  onClick={() => moveMetric(metric.key, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="pc-button"
                  onClick={() => moveMetric(metric.key, 1)}
                  disabled={index === metrics.length - 1}
                >
                  ↓
                </button>
                <button type="button" className="pc-button" onClick={() => toggleActive(metric.key)}>
                  {metric.isActive ? '비활성화' : '활성화'}
                </button>
                <button type="button" className="pc-button" onClick={() => removeMetric(metric.key)}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>프리셋으로 추가</h2>
        <p className="pc-meta">자주 쓰는 항목입니다. 클릭으로 바로 추가됩니다.</p>
        <div className="pc-pill-row" style={{ marginTop: 8 }}>
          {PRESET_METRICS.map((preset) => {
            const added = metrics.some((m) => m.key === preset.key);
            return (
              <button
                key={preset.key}
                type="button"
                className={`pc-pill${added ? ' is-active' : ''}`}
                onClick={() => addPreset(preset)}
                disabled={added}
              >
                {preset.label}
                {added ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>직접 추가</h2>
        <div className="pc-form-grid">
          <input
            className="pc-field"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="표시 이름 (예: 패스 정확도)"
          />
          <input
            className="pc-field"
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            placeholder="key (영문 소문자/숫자/언더스코어, 예: pass_accuracy)"
          />
          <button type="button" className="pc-button" onClick={addCustom}>
            추가
          </button>
        </div>
      </section>

      <section className="card" style={{ position: 'sticky', bottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="pc-meta">
            변경한 내용은 저장 버튼을 눌러야 반영됩니다. 활성 항목 {metrics.filter((m) => m.isActive).length}개.
          </span>
          <button type="button" className="pc-button pc-button-primary" onClick={save} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
        {message ? <p className="pc-meta" style={{ marginTop: 8 }}>{message}</p> : null}
      </section>
    </>
  );
}
