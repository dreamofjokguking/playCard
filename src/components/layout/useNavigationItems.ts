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
  const [primaryClubRoomId, setPrimaryClubRoomId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { success?: boolean; data?: { primaryClubRoom?: { _id: string } | null } } | null) => {
        if (!active || !json?.success) return;
        setPrimaryClubRoomId(json.data?.primaryClubRoom?._id ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const urlClubRoomId = extractClubRoomIdFromPath(pathname);
  const clubRoomId = urlClubRoomId ?? primaryClubRoomId;

  // 클럽 컨텍스트 = URL이 /club-rooms/[id]/* 형태일 때만
  if (urlClubRoomId) {
    return getClubContextNav(urlClubRoomId);
  }
  // /club-rooms 목록, /club-rooms/new, /club-rooms/search 등은 클럽 외 컨텍스트
  // 단, 내가 가진 클럽이 있다면 그걸 가지고 있어도 무방하지만 명확성 위해 outside로 통일
  void clubRoomId;
  return getOutsideClubNav();
}
