'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/components/layout/navigationItems';

export default function Header() {
  const pathname = usePathname();
  const active = navigationItems.find((item) => item.href === pathname);

  return (
    <header className="pc-header">
      <div className="pc-header-inner">
        <Link href="/" className="pc-logo">
          PlayCard
        </Link>
        <div className="pc-header-meta">
          <span className="pc-active-page">{active?.label ?? '홈'}</span>
          <Link href="/login" className="pc-login-link">
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
