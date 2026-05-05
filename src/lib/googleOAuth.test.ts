import { afterEach, describe, expect, it } from 'vitest';
import { deriveDisplayName, getGoogleOAuthConfig, isGoogleOAuthConfigured } from './googleOAuth';

describe('getGoogleOAuthConfig', () => {
  const originalId = process.env.GOOGLE_CLIENT_ID;
  const originalSecret = process.env.GOOGLE_CLIENT_SECRET;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = originalId;
    process.env.GOOGLE_CLIENT_SECRET = originalSecret;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('returns ok=false when client id missing', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 's';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const config = getGoogleOAuthConfig();
    expect(config.ok).toBe(false);
  });

  it('returns ok=false when client secret missing', () => {
    process.env.GOOGLE_CLIENT_ID = 'i';
    delete process.env.GOOGLE_CLIENT_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const config = getGoogleOAuthConfig();
    expect(config.ok).toBe(false);
  });

  it('builds redirect URI from app URL', () => {
    process.env.GOOGLE_CLIENT_ID = 'i';
    process.env.GOOGLE_CLIENT_SECRET = 's';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000/';
    const config = getGoogleOAuthConfig();
    expect(config.ok).toBe(true);
    if (!config.ok) return;
    expect(config.redirectUri).toBe('http://localhost:3000/api/auth/google/callback');
  });

  it('isGoogleOAuthConfigured reflects env presence', () => {
    process.env.GOOGLE_CLIENT_ID = 'i';
    process.env.GOOGLE_CLIENT_SECRET = 's';
    expect(isGoogleOAuthConfigured()).toBe(true);
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleOAuthConfigured()).toBe(false);
  });
});

describe('deriveDisplayName (google)', () => {
  it('uses name when present', () => {
    const result = deriveDisplayName({ sub: 'g1', name: '홍길동', email: 'gildong@example.com' });
    expect(result.nickname).toBe('홍길동');
    expect(result.email).toBe('gildong@example.com');
  });

  it('falls back to given_name', () => {
    const result = deriveDisplayName({ sub: 'g1', given_name: '길동' });
    expect(result.nickname).toBe('길동');
  });

  it('falls back to email local part', () => {
    const result = deriveDisplayName({ sub: 'g1', email: 'someone@example.com' });
    expect(result.nickname).toBe('someone');
  });

  it('uses google_<sub-prefix> as last resort', () => {
    const result = deriveDisplayName({ sub: 'abc123def456' });
    expect(result.nickname).toMatch(/^google_/);
  });

  it('extracts picture as profile image', () => {
    const result = deriveDisplayName({ sub: 'g1', name: 'A', picture: 'https://lh3.googleusercontent.com/x' });
    expect(result.profileImage).toBe('https://lh3.googleusercontent.com/x');
  });
});
