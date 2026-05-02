import type { Metadata } from 'next';
import ResponsiveShell from '@/components/layout/ResponsiveShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'PlayCard',
  description: 'Club room based sports operation platform'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <ResponsiveShell>{children}</ResponsiveShell>
      </body>
    </html>
  );
}
