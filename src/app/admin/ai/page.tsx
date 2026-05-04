'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SettingsResponse = {
  titlePrompt: string;
  modelName: string;
  defaults: {
    titlePrompt: string;
    modelName: string;
    placeholders: string[];
  };
  updatedAt: string | null;
  updatedBy: string;
};

const COMMON_MODEL_OPTIONS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest'
];

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [titlePrompt, setTitlePrompt] = useState('');
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ title: string | null; rarity: string | null; elapsedMs: number } | null>(null);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/ai/settings', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: SettingsResponse; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '설정을 불러오지 못했습니다.');
        return;
      }
      setSettings(json.data);
      setTitlePrompt(json.data.titlePrompt);
      setModelName(json.data.modelName);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('설정을 불러오지 못했습니다.'));
  }, []);

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/ai/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titlePrompt, modelName })
      });
      const json = (await res.json()) as { success: boolean; data?: SettingsResponse; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '저장 실패');
        return;
      }
      setSettings(json.data);
      setMessage('저장 완료');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    if (!settings) return;
    setTitlePrompt(settings.defaults.titlePrompt);
    setModelName(settings.defaults.modelName);
    setMessage('기본값으로 되돌렸습니다. 저장 버튼을 눌러야 적용됩니다.');
  }

  async function runPreview() {
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await fetch('/api/dev/gemini-health', { cache: 'no-store' });
      const json = (await res.json()) as {
        success: boolean;
        data?: { title: string | null; rarity: string | null; elapsedMs: number };
      };
      if (json.data) setPreviewResult(json.data);
    } catch {
      setPreviewResult({ title: null, rarity: null, elapsedMs: 0 });
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-caption">SERVICE ADMIN · AI</div>
        <h1 className="pc-hero-title">AI 관리</h1>
        <div style={{ marginTop: 6 }}>
          <Link href="/admin" className="pc-meta" style={{ textDecoration: 'underline' }}>
            ← 최상위 관리로
          </Link>
        </div>
      </section>

      {loading ? (
        <section className="card">
          <p>로딩 중...</p>
        </section>
      ) : null}

      {!loading && settings ? (
        <>
          <section className="card">
            <h2>모델</h2>
            <p className="pc-meta">평가 마감 시 칭호 생성을 담당하는 Gemini 모델 ID. 비표준 ID 입력도 가능합니다.</p>
            <input
              className="pc-field"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              placeholder="gemini-2.5-flash"
              style={{ marginTop: 8 }}
            />
            <div className="pc-pill-row" style={{ marginTop: 8 }}>
              {COMMON_MODEL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`pc-pill${modelName === option ? ' is-active' : ''}`}
                  onClick={() => setModelName(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>칭호 생성 프롬프트</h2>
            <p className="pc-meta">
              사용 가능한 placeholder: {settings.defaults.placeholders.join(' · ')}
              <br />
              <code>{'{displayName}'}</code>은 필수입니다. 한 줄당 하나의 한국어 칭호만 생성되도록 톤을 유지해주세요.
            </p>
            <textarea
              className="pc-field"
              value={titlePrompt}
              onChange={(event) => setTitlePrompt(event.target.value)}
              rows={18}
              style={{ marginTop: 8, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            <div className="pc-row" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="pc-button pc-button-primary"
                onClick={() => save()}
                disabled={saving || !titlePrompt.trim() || !modelName.trim()}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button type="button" className="pc-button" onClick={() => resetToDefault()} disabled={saving}>
                기본값으로 되돌리기
              </button>
            </div>
            {message ? (
              <p className="pc-meta" style={{ marginTop: 8 }}>
                {message}
              </p>
            ) : null}
            <p className="pc-meta" style={{ marginTop: 6 }}>
              마지막 업데이트:{' '}
              {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('ko-KR') : '없음'}
              {settings.updatedBy ? ` · ${settings.updatedBy}` : ''}
            </p>
          </section>

          <section className="card">
            <h2>응답 샘플 (개발 환경)</h2>
            <p className="pc-meta">
              현재 저장된 설정으로 샘플 한줄평·점수에 대해 칭호를 1회 생성해봅니다. dev 라우트(`/api/dev/gemini-health`)를 호출하므로 운영 환경에서는 동작하지 않습니다.
            </p>
            <div style={{ marginTop: 10 }}>
              <button type="button" className="pc-button" onClick={() => runPreview()} disabled={previewLoading}>
                {previewLoading ? '생성 중...' : '응답 샘플 보기'}
              </button>
            </div>
            {previewResult ? (
              <pre
                className="pc-meta"
                style={{
                  marginTop: 12,
                  whiteSpace: 'pre-wrap',
                  background: '#161a26',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--pc-line)'
                }}
              >
                {previewResult.title
                  ? `칭호: ${previewResult.title}\n등급: ${previewResult.rarity ?? '-'}\n소요: ${previewResult.elapsedMs}ms`
                  : `응답 실패 (키/모델 확인) · ${previewResult.elapsedMs}ms`}
              </pre>
            ) : null}
          </section>
        </>
      ) : null}
    </>
  );
}
