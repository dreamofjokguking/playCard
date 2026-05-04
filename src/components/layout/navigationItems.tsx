import type { ReactNode } from 'react';

type IconProps = {
  size?: number;
};

function StrokeIcon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function HomeIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
    </StrokeIcon>
  );
}

function StarIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </StrokeIcon>
  );
}

function TrophyIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M6 5h12v6a6 6 0 0 1-12 0z" />
      <path d="M6 9H4.5A2.5 2.5 0 0 1 2 6.5V5h4" />
      <path d="M18 9h1.5A2.5 2.5 0 0 0 22 6.5V5h-4" />
      <path d="M9 17h6l1 4H8z" />
    </StrokeIcon>
  );
}

function UsersIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <circle cx="9" cy="7" r="4" />
      <circle cx="17" cy="9" r="3" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <path d="M14 21a5 5 0 0 1 7 0" />
    </StrokeIcon>
  );
}

function SettingsIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </StrokeIcon>
  );
}

function BellIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </StrokeIcon>
  );
}

function FolderIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </StrokeIcon>
  );
}

function SearchIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </StrokeIcon>
  );
}

function PlusCircleIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </StrokeIcon>
  );
}

export type NavigationItem = {
  href: string;
  label: string;
  icon: (props: IconProps) => ReactNode;
  mobileVisible: boolean;
};

export function getOutsideClubNav(): NavigationItem[] {
  return [
    { href: '/', label: '내 클럽', icon: FolderIcon, mobileVisible: true },
    { href: '/club-rooms/search', label: '클럽 검색', icon: SearchIcon, mobileVisible: true },
    { href: '/club-rooms/new', label: '클럽 생성', icon: PlusCircleIcon, mobileVisible: true }
  ];
}

export function getClubContextNav(clubRoomId: string): NavigationItem[] {
  const base = `/club-rooms/${clubRoomId}`;
  return [
    { href: base, label: '홈', icon: HomeIcon, mobileVisible: true },
    { href: `${base}/evaluation`, label: '평가', icon: StarIcon, mobileVisible: true },
    { href: `${base}/notifications`, label: '알림', icon: BellIcon, mobileVisible: false },
    { href: `${base}/ranking`, label: '순위', icon: TrophyIcon, mobileVisible: true },
    { href: `${base}/team-builder`, label: '팀 구성', icon: UsersIcon, mobileVisible: true },
    { href: `${base}/admin`, label: '관리', icon: SettingsIcon, mobileVisible: true }
  ];
}
