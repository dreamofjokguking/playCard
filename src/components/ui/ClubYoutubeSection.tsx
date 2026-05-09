'use client';

import { useEffect, useState } from 'react';

type Video = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
};

type Payload = {
  channelId: string;
  videos: Video[];
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ClubYoutubeSection({
  clubRoomId,
  limit = 4
}: {
  clubRoomId: string;
  limit?: number;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/club-rooms/${encodeURIComponent(clubRoomId)}/youtube-latest?limit=${limit}`,
          { cache: 'no-store' }
        );
        const json = (await res.json()) as { success: boolean; data?: Payload; message?: string };
        if (!active) return;
        if (!res.ok || !json.success || !json.data) {
          setError(json.message || '영상 조회 실패');
          return;
        }
        setData(json.data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '요청 실패');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [clubRoomId, limit]);

  // 채널 미등록이거나 영상이 없으면 섹션 자체를 숨김
  if (!loading && !error && (!data?.channelId || data.videos.length === 0)) {
    return null;
  }

  return (
    <section className="card">
      <h2>우리 클럽 영상</h2>
      {loading ? <p className="pc-meta">불러오는 중...</p> : null}
      {error ? <p className="pc-meta">{error}</p> : null}
      {data && data.videos.length > 0 ? (
        <div className="pc-youtube-grid">
          {data.videos.map((video) => (
            <a
              key={video.videoId}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pc-youtube-card"
            >
              <div className="pc-youtube-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail} alt={video.title} loading="lazy" />
                <span className="pc-youtube-play" aria-hidden="true">▶</span>
              </div>
              <div className="pc-youtube-meta">
                <div className="pc-youtube-title">{video.title}</div>
                <time className="pc-meta" dateTime={video.publishedAt}>
                  {formatDate(video.publishedAt)}
                </time>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
