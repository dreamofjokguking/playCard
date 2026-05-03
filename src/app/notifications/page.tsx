'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type NotificationRow = {
  _id: string;
  type: string;
  title: string;
  message: string;
  path?: string;
  read: boolean;
  sentAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: NotificationRow[]; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '알림 조회 실패');
        return;
      }
      setRows(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 실패');
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    const res = await fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    const json = (await res.json()) as { success: boolean; message?: string };
    if (!res.ok || !json.success) {
      setMessage(json.message || '읽음 처리 실패');
      return;
    }
    await load();
  }

  async function openNotification(row: NotificationRow) {
    if (!row.read) {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: row._id })
      });
    }
    await load();
    if (row.path) {
      router.push(row.path);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage('알림 조회 실패'));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      load().catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="card">
      <h1>알림함</h1>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => load()} disabled={loading}>
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
        <button onClick={() => markAllRead()}>전체 읽음</button>
      </div>
      <ul className="check-list" style={{ marginTop: 10 }}>
        {rows.map((row) => (
          <li key={row._id} style={{ cursor: 'pointer' }} onClick={() => openNotification(row)}>
            <strong>{row.read ? '읽음' : '새 알림'}</strong> / {row.title}
            <div>{row.message}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{new Date(row.sentAt).toLocaleString('ko-KR')}</div>
          </li>
        ))}
      </ul>
      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </section>
  );
}
