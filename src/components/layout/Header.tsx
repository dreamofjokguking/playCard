'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { navigationItems } from '@/components/layout/navigationItems';

export default function Header() {
  const pathname = usePathname();
  const active = navigationItems.find((item) => item.href === pathname);
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

  return (
    <header className="pc-header">
      <div className="pc-header-inner">
        <Link href="/" className="pc-logo">
          PlayCard
        </Link>
        <div className="pc-header-meta">
          <span className="pc-active-page">{active?.label ?? '홈'}</span>
          <Link href="/notifications" className="pc-login-link">
            알림{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Link>
          <Link href="/login" className="pc-login-link">
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
