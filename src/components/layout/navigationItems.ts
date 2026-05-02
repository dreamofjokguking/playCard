export type NavigationItem = {
  href: string;
  label: string;
  iconText: string;
};

export const navigationItems: NavigationItem[] = [
  { href: '/', label: '홈', iconText: 'H' },
  { href: '/dashboard', label: '대시보드', iconText: 'D' },
  { href: '/evaluation', label: '평가', iconText: 'E' },
  { href: '/ranking', label: '순위', iconText: 'R' },
  { href: '/team-builder', label: '팀구성', iconText: 'T' },
  { href: '/admin', label: '관리', iconText: 'A' }
];
