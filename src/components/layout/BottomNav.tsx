'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigationItems } from '@/components/layout/useNavigationItems';

export default function BottomNav() {
  const pathname = usePathname();
  const items = useNavigationItems();
  const mobileItems = items.filter((item) => item.mobileVisible);

  const bestMatchHref = items
    .map((it) => it.href)
    .filter((href) => pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="pc-bottom-nav">
      {mobileItems.map((item) => {
        const active = item.href === bestMatchHref;
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
