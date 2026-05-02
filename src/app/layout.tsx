import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
