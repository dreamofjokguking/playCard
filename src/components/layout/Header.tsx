'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigationItems } from '@/components/layout/useNavigationItems';
import PwaInstallButton from '@/components/layout/PwaInstallButton';

type MeBrief = { actorId: string; displayName?: string; nickname?: string };

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M9 18V5l12-2v13" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useNavigationItems();
  const notificationsHref = items.find((item) => item.label === '알림')?.href ?? '/';
  const [me, setMe] = useState<MeBrief | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { success?: boolean; data?: MeBrief } | null) => {
        if (!active) return;
        if (json?.success && json.data) setMe(json.data);
        else setMe(null);
      })
      .catch(() => setMe(null));
    return () => {
      active = false;
    };
  }, [pathname]);

  const [unreadCount, setUnreadCount] = useState(0);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setMe(null);
      setUnreadCount(0);
      router.replace('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true', { cache: 'no-store' });
      if (!res.ok) {
        setUnreadCount(0);
        return;
      }
      const json = (await res.json()) as { success: boolean; data?: Array<unknown> };
      if (!json.success || !Array.isArray(json.data)) {
        setUnreadCount(0);
        return;
      }
      setUnreadCount(json.data.length);
    } catch {
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    fetchUnreadCount().catch(() => undefined);
    const timer = setInterval(() => {
      fetchUnreadCount().catch(() => undefined);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let socket: Socket | null = null;
    let mounted = true;

    async function connectSocket() {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: { actorId: string } };
      if (!mounted || !res.ok || !json.success || !json.data?.actorId) return;

      socket = io('/', {
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket']
      });
      socket.emit('join-user-room', { userId: json.data.actorId });
      socket.on('notification-created', () => {
        fetchUnreadCount().catch(() => undefined);
      });
    }

    connectSocket().catch(() => undefined);
    return () => {
      mounted = false;
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <header className="pc-header">
      <div className="pc-header-inner">
        <Link href="/" className="pc-logo" aria-label="PlayCard 홈">
          PlayCard
        </Link>
        <div className="pc-header-meta">
          <PwaInstallButton />
          <button type="button" className="pc-icon-btn" aria-label="음악">
            <MusicIcon />
          </button>
          <Link href={notificationsHref} className="pc-icon-btn" aria-label="알림">
            <BellIcon />
            {unreadCount > 0 ? <span className="pc-badge-dot">{unreadCount}</span> : null}
          </Link>
          {me ? (
            <button
              type="button"
              className="pc-chip-link"
              onClick={() => signOut()}
              disabled={signingOut}
            >
              {signingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          ) : (
            <Link href="/login" className="pc-chip-link">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
