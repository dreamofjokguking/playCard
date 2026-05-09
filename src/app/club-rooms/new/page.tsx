'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { CLUB_CATEGORIES } from '@/lib/clubCategories';
import { cloudinaryTransform } from '@/lib/cloudinaryTransform';

export default function ClubRoomCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CLUB_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFile(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('파일은 5MB 이하만 업로드 가능합니다.');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'playcard/club-cover');
      const res = await fetch('/api/upload/image', { method: 'POST', body: form });
      const json = (await res.json()) as { success: boolean; data?: { url: string }; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '이미지 업로드에 실패했습니다.');
        return;
      }
      setCoverImage(json.data.url);
    } finally {
      setUploading(false);
    }
  }

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
        body: JSON.stringify({
          name: name.trim(),
          sportType: 'etc',
          category: category.trim(),
          description: description.trim(),
          coverImage,
          ownerId
        })
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
              maxLength={40}
              style={{ marginTop: 6 }}
            />
          </label>

          <label>
            <span className="pc-meta">카테고리</span>
            <select
              className="pc-field"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              style={{ marginTop: 6 }}
            >
              {CLUB_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="pc-meta">클럽 소개 (선택)</span>
            <textarea
              className="pc-field"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="활동 시간, 모임 분위기, 가입 조건 등 자유롭게"
              maxLength={500}
              rows={5}
              style={{ marginTop: 6, fontFamily: 'inherit', resize: 'vertical' }}
            />
            <span className="pc-meta" style={{ display: 'block', textAlign: 'right' }}>
              {description.length}/500
            </span>
          </label>

          <div>
            <span className="pc-meta">커버 이미지 (선택)</span>
            <div style={{ marginTop: 6 }}>
              {coverImage ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cloudinaryTransform(coverImage, { width: 800, crop: 'fill' })}
                    alt="클럽 커버"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    className="pc-pill"
                    onClick={() => setCoverImage('')}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    제거
                  </button>
                </div>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div className="pc-row">
                <button
                  type="button"
                  className="pc-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '업로드 중...' : coverImage ? '이미지 변경' : '이미지 선택'}
                </button>
                <span className="pc-meta">JPEG/PNG/WebP, 최대 5MB</span>
              </div>
            </div>
          </div>
        </div>

        <p className="pc-meta" style={{ marginTop: 12 }}>
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
