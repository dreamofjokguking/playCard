import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deriveDisplayName, getKakaoOAuthConfig, isKakaoOAuthConfigured } from './kakaoOAuth';

describe('getKakaoOAuthConfig', () => {
  const originalKey = process.env.KAKAO_REST_API_KEY;
  const originalSecret = process.env.KAKAO_CLIENT_SECRET;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.KAKAO_REST_API_KEY = originalKey;
    process.env.KAKAO_CLIENT_SECRET = originalSecret;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('returns ok=false when REST API key missing', () => {
    delete process.env.KAKAO_REST_API_KEY;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const config = getKakaoOAuthConfig();
    expect(config.ok).toBe(false);
  });

  it('returns ok=false when app URL missing', () => {
    process.env.KAKAO_REST_API_KEY = 'k1';
    delete process.env.NEXT_PUBLIC_APP_URL;
    const config = getKakaoOAuthConfig();
    expect(config.ok).toBe(false);
  });

  it('returns redirect URI assembled from app URL', () => {
    process.env.KAKAO_REST_API_KEY = 'k1';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000/';
    const config = getKakaoOAuthConfig();
    expect(config.ok).toBe(true);
    if (!config.ok) return;
    expect(config.redirectUri).toBe('http://localhost:3000/api/auth/kakao/callback');
    expect(config.appUrl).toBe('http://localhost:3000');
  });

  it('isKakaoOAuthConfigured reflects env presence', () => {
    process.env.KAKAO_REST_API_KEY = 'k1';
    expect(isKakaoOAuthConfigured()).toBe(true);
    delete process.env.KAKAO_REST_API_KEY;
    expect(isKakaoOAuthConfigured()).toBe(false);
  });
});

describe('deriveDisplayName', () => {
  it('prefers kakao_account.profile.nickname', () => {
    const result = deriveDisplayName({
      id: 1,
      kakao_account: { profile: { nickname: '홍길동' } },
      properties: { nickname: 'fallback' }
    });
    expect(result.nickname).toBe('홍길동');
    expect(result.displayName).toBe('홍길동');
  });

  it('falls back to properties.nickname when account profile missing', () => {
    const result = deriveDisplayName({
      id: 1,
      properties: { nickname: '대체이름' }
    });
    expect(result.nickname).toBe('대체이름');
  });

  it('uses kakao_<id-prefix> when both nicknames missing', () => {
    const result = deriveDisplayName({ id: '1234567890' });
    expect(result.nickname).toMatch(/^kakao_/);
  });

  it('extracts profile image url', () => {
    const result = deriveDisplayName({
      id: 1,
      kakao_account: { profile: { profile_image_url: 'https://k.kakaocdn.net/x.jpg' } }
    });
    expect(result.profileImage).toBe('https://k.kakaocdn.net/x.jpg');
  });
});
