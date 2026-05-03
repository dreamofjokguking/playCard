'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/components/layout/navigationItems';

export default function BottomNav() {
  const pathname = usePathname();
  const mobileItems = navigationItems.filter((item) => item.mobileVisible);

  return (
    <nav className="pc-bottom-nav">
      {mobileItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pc-bottom-link${active ? ' is-active' : ''}`}
          >
            <span className="pc-nav-icon">
              <Icon size={20} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
