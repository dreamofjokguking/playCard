import type { Metadata, Viewport } from 'next';
import ResponsiveShell from '@/components/layout/ResponsiveShell';
import PwaRegister from '@/components/layout/PwaRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'PlayCard',
  description: '스포츠 동호회 통합 운영 플랫폼 — 평가, 순위, 칭호, 팀 구성을 한 화면에',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'PlayCard',
    statusBarStyle: 'black-translucent'
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFB020'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <ResponsiveShell>{children}</ResponsiveShell>
        <PwaRegister />
      </body>
    </html>
  );
}
