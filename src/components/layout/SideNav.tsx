'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/components/layout/navigationItems';

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="pc-sidenav">
      <nav className="pc-sidenav-nav">
        {navigationItems.map((item) => {
          const active = pathname === item.href;
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
