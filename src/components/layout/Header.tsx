'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigationItems } from '@/components/layout/useNavigationItems';

type ClubBrief = { _id: string; name: string };

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
  const items = useNavigationItems();
  const active = items.find((item) => item.href === pathname);
  const notificationsHref = items.find((item) => item.label === '알림')?.href ?? '/';
  const [currentClub, setCurrentClub] = useState<ClubBrief | null>(null);

  const clubRoomId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/^\/club-rooms\/([^/]+)/);
    if (!match) return null;
    const candidate = match[1];
    if (candidate === 'new' || candidate === 'search') return null;
    return candidate;
  }, [pathname]);

  useEffect(() => {
    if (!clubRoomId) {
      setCurrentClub(null);
      return;
    }
    let active = true;
    fetch(`/api/club-rooms/${clubRoomId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { success?: boolean; data?: ClubBrief } | null) => {
        if (!active || !json?.success || !json.data) return;
        setCurrentClub({ _id: json.data._id, name: json.data.name });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [clubRoomId]);
  const [unreadCount, setUnreadCount] = useState(0);

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
        <div>
          <Link href="/" className="pc-logo">
            PlayCard
          </Link>
          {clubRoomId ? (
            <Link href="/" className="pc-club-chip" aria-label="다른 클럽 선택">
              <span className="pc-club-chip-name">{currentClub?.name ?? '클럽 불러오는 중...'}</span>
              <span className="pc-club-chip-action">↻ 변경</span>
            </Link>
          ) : (
            <div className="pc-active-page">{active?.label ?? '클럽 선택'}</div>
          )}
        </div>
        <div className="pc-header-meta">
          <button type="button" className="pc-icon-btn" aria-label="음악">
            <MusicIcon />
          </button>
          <Link href={notificationsHref} className="pc-icon-btn" aria-label="알림">
            <BellIcon />
            {unreadCount > 0 ? <span className="pc-badge-dot">{unreadCount}</span> : null}
          </Link>
          <Link href="/login" className="pc-chip-link">
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
