'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getClubContextNav, getOutsideClubNav, type NavigationItem } from './navigationItems';

function extractClubRoomIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/club-rooms\/([^/]+)/);
  if (!match) return null;
  const candidate = match[1];
  if (candidate === 'new' || candidate === 'search') return null;
  return candidate;
}

export function useNavigationItems(): NavigationItem[] {
  const pathname = usePathname();
  const [isServiceAdmin, setIsServiceAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { success?: boolean; data?: { role?: string } } | null) => {
        if (!active || !json?.success) return;
        setIsServiceAdmin(json.data?.role === 'service_admin');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const urlClubRoomId = extractClubRoomIdFromPath(pathname);

  // 클럽 컨텍스트 = URL이 /club-rooms/[id]/* 형태일 때만
  if (urlClubRoomId) {
    return getClubContextNav(urlClubRoomId);
  }
  return getOutsideClubNav({ isServiceAdmin });
}
