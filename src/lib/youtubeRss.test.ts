import { describe, expect, it } from 'vitest';
import { buildChannelFeedUrl, isValidChannelId, parseYoutubeRss } from './youtubeRss';

describe('buildChannelFeedUrl', () => {
  it('builds URL with channel_id query', () => {
    expect(buildChannelFeedUrl('UCabc123')).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UCabc123');
  });

  it('encodes special characters', () => {
    expect(buildChannelFeedUrl('UC&abc')).toContain('UC%26abc');
  });
});

describe('isValidChannelId', () => {
  it('accepts standard 24-char UC channel id', () => {
    expect(isValidChannelId('UCBR8-60-B28hp2BmDPdntcQ')).toBe(true);
  });

  it('accepts shorter alphanumeric ids', () => {
    expect(isValidChannelId('UC1234567890')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidChannelId('')).toBe(false);
  });

  it('rejects ids with spaces or special chars', () => {
    expect(isValidChannelId('UC abc')).toBe(false);
    expect(isValidChannelId('UC@abc')).toBe(false);
  });
});

describe('parseYoutubeRss', () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/"
      xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>yt:video:abc123</id>
    <yt:videoId>abc123</yt:videoId>
    <title>첫 번째 영상 &amp; 테스트</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/>
    <published>2026-05-08T10:00:00+00:00</published>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/abc123/hqdefault.jpg" width="480" height="360"/>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:def456</id>
    <yt:videoId>def456</yt:videoId>
    <title>두 번째 영상</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=def456"/>
    <published>2026-05-07T08:00:00+00:00</published>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/def456/hqdefault.jpg"/>
    </media:group>
  </entry>
</feed>`;

  it('extracts videoId/title/url/published/thumbnail per entry', () => {
    const videos = parseYoutubeRss(sampleXml);
    expect(videos).toHaveLength(2);
    expect(videos[0].videoId).toBe('abc123');
    expect(videos[0].title).toBe('첫 번째 영상 & 테스트');
    expect(videos[0].url).toBe('https://www.youtube.com/watch?v=abc123');
    expect(videos[0].publishedAt).toBe('2026-05-08T10:00:00+00:00');
    expect(videos[0].thumbnail).toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
    expect(videos[1].videoId).toBe('def456');
  });

  it('falls back to standard youtube URL when link missing', () => {
    const minimal = `<feed><entry><yt:videoId>xyz789</yt:videoId><title>제목</title><published>2026-01-01</published></entry></feed>`;
    const videos = parseYoutubeRss(minimal);
    expect(videos[0].url).toBe('https://www.youtube.com/watch?v=xyz789');
    expect(videos[0].thumbnail).toBe('https://i.ytimg.com/vi/xyz789/hqdefault.jpg');
  });

  it('returns empty array when no entries present', () => {
    expect(parseYoutubeRss('<feed></feed>')).toEqual([]);
  });

  it('skips entries missing yt:videoId', () => {
    const xml = `<feed><entry><title>broken</title></entry></feed>`;
    expect(parseYoutubeRss(xml)).toEqual([]);
  });

  it('decodes HTML entities in title', () => {
    const xml = `<feed><entry><yt:videoId>v1</yt:videoId><title>A &lt;tag&gt; &quot;quote&quot;</title><published>2026-01-01</published></entry></feed>`;
    const videos = parseYoutubeRss(xml);
    expect(videos[0].title).toBe('A <tag> "quote"');
  });
});
