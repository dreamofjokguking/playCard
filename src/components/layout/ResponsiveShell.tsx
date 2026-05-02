import type { ReactNode } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import SideNav from '@/components/layout/SideNav';

type ResponsiveShellProps = {
  children: ReactNode;
};

export default function ResponsiveShell({ children }: ResponsiveShellProps) {
  return (
    <div className="pc-shell">
      <Header />
      <div className="pc-shell-body">
        <SideNav />
        <main className="pc-main">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
