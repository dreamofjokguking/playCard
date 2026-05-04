'use client';

import { useMemo, useState } from 'react';
import RadarChart from '@/components/ui/RadarChart';
import LineChart from '@/components/ui/LineChart';
import type { RadarPoint } from '@/components/ui/chartUtils';

type Mode = 'rich' | 'sparse' | 'empty';

const RICH_TIMELINE = [
  { label: '04-22', value: 6.4 },
  { label: '04-26', value: 7.1 },
  { label: '04-29', value: 6.8 },
  { label: '05-01', value: 7.6 },
  { label: '05-03', value: 8.2 }
];

const RICH_RADAR: RadarPoint[] = [
  { metricKey: 'attack', label: '공격', value: 8.4 },
  { metricKey: 'defense', label: '수비', value: 6.7 },
  { metricKey: 'toss', label: '토스', value: 7.9 },
  { metricKey: 'serve', label: '서브', value: 5.3 }
];

const SPARSE_TIMELINE = [{ label: '05-03', value: 7.2 }];
const SPARSE_RADAR: RadarPoint[] = [
  { metricKey: 'attack', label: '공격', value: 7.2 },
  { metricKey: 'defense', label: '수비', value: 7.2 },
  { metricKey: 'toss', label: '토스', value: 7.2 }
];

export default function DashboardPreviewPage() {
  const [mode, setMode] = useState<Mode>('rich');

  const { timeline, radar } = useMemo(() => {
    if (mode === 'sparse') return { timeline: SPARSE_TIMELINE, radar: SPARSE_RADAR };
    if (mode === 'empty') return { timeline: [], radar: [] as RadarPoint[] };
    return { timeline: RICH_TIMELINE, radar: RICH_RADAR };
  }, [mode]);

  const best = useMemo(() => (radar.length === 0 ? null : radar.reduce((a, b) => (a.value > b.value ? a : b))), [radar]);
  const worst = useMemo(() => {
    if (radar.length === 0) return null;
    return radar.reduce((a, b) => (a.value < b.value ? a : b));
  }, [radar]);
  const latest = timeline[timeline.length - 1];

  return (
    <>
      <section className="pc-banner-card">
        <div>
          <div className="pc-banner-meta">PREVIEW · MOCK 데이터</div>
          <div className="pc-banner-title">대시보드 차트 미리보기</div>
        </div>
        <div className="pc-pill-row" style={{ margin: 0 }}>
          <button className={`pc-pill${mode === 'rich' ? ' is-active' : ''}`} onClick={() => setMode('rich')}>
            5경기
          </button>
          <button className={`pc-pill${mode === 'sparse' ? ' is-active' : ''}`} onClick={() => setMode('sparse')}>
            1경기
          </button>
          <button className={`pc-pill${mode === 'empty' ? ' is-active' : ''}`} onClick={() => setMode('empty')}>
            데이터 없음
          </button>
        </div>
      </section>

      <section className="pc-player-card">
        <div className="pc-player-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pc-avatar">테</span>
            <div>
              <div style={{ fontWeight: 800 }}>테스터</div>
              <div className="pc-meta">네트 위의 암살자</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--pc-primary)' }}>{latest?.value ?? '-'}</div>
            <div className="pc-meta">최근 점수</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>능력치</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <RadarChart points={radar} />
        </div>
        <div className="pc-stack" style={{ marginTop: 4 }}>
          <div className="quick-link" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: 'var(--pc-accent)' }}>★ BEST</strong>
            <span style={{ fontWeight: 800 }}>{best ? `${best.label} ${best.value}` : '-'}</span>
          </div>
          <div className="quick-link" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: '#60A5FA' }}>▼ NEED</strong>
            <span style={{ fontWeight: 800 }}>{worst ? `${worst.label} ${worst.value}` : '-'}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>성장 그래프</h2>
        <LineChart data={timeline} />
      </section>
    </>
  );
}
