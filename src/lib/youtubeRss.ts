export const YOUTUBE_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml';

export type YoutubeVideo = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
};

export function buildChannelFeedUrl(channelId: string): string {
  return `${YOUTUBE_RSS_BASE}?channel_id=${encodeURIComponent(channelId)}`;
}

export function isValidChannelId(value: string): boolean {
  return /^[A-Za-z0-9_-]{10,40}$/.test(value.trim());
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function pickAttr(tag: string, attr: string): string {
  const match = tag.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? match[1] : '';
}

function pickInner(entry: string, tagName: string): string {
  const match = entry.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`));
  if (!match) return '';
  return decodeXmlEntities(match[1].trim());
}

/**
 * YouTube 채널 RSS Atom 피드를 파싱해 비디오 메타 배열로 변환합니다.
 * 외부 라이브러리 의존성 없이 정규식 기반 파싱 — YouTube 피드 구조가 안정적이라 충분.
 */
export function parseYoutubeRss(xml: string): YoutubeVideo[] {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/g) ?? [];
  const videos: YoutubeVideo[] = [];

  for (const entry of entries) {
    const videoId = pickInner(entry, 'yt:videoId');
    if (!videoId) continue;

    const title = pickInner(entry, 'title');
    const publishedAt = pickInner(entry, 'published');

    const linkMatch = entry.match(/<link[^>]*rel="alternate"[^>]*\/>/);
    const url = linkMatch ? pickAttr(linkMatch[0], 'href') : `https://www.youtube.com/watch?v=${videoId}`;

    const thumbMatch = entry.match(/<media:thumbnail[^>]*\/>/);
    const thumbnail = thumbMatch
      ? pickAttr(thumbMatch[0], 'url')
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    videos.push({ videoId, title, url, publishedAt, thumbnail });
  }

  return videos;
}

export async function fetchChannelLatestVideos(channelId: string, limit: number): Promise<YoutubeVideo[]> {
  const res = await fetch(buildChannelFeedUrl(channelId), {
    next: { revalidate: 600 } // 10분 서버 캐시
  });
  if (!res.ok) {
    throw new Error(`YouTube RSS fetch 실패: ${res.status}`);
  }
  const xml = await res.text();
  const all = parseYoutubeRss(xml);
  return all.slice(0, Math.max(1, Math.min(15, limit)));
}
