'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/components/layout/navigationItems';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pc-bottom-nav">
      {navigationItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pc-bottom-link${active ? ' is-active' : ''}`}
          >
            <span className="pc-nav-glyph">{item.iconText}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
