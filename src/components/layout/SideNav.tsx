'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigationItems } from '@/components/layout/useNavigationItems';

export default function SideNav() {
  const pathname = usePathname();
  const items = useNavigationItems();

  const bestMatchHref = items
    .map((it) => it.href)
    .filter((href) => pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="pc-sidenav">
      <nav className="pc-sidenav-nav">
        {items.map((item) => {
          const active = item.href === bestMatchHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pc-sidenav-link${active ? ' is-active' : ''}`}
            >
              <span className="pc-nav-icon">
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
