'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: NotificationRow[]; message?: string };
      if (!res.ok || !json.success || !json.data) {
        setMessage(json.message || '알림 조회에 실패했습니다.');
        return;
      }
      setRows(json.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청에 실패했습니다.');
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
      setMessage(json.message || '읽음 처리에 실패했습니다.');
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
    if (row.path) router.push(row.path);
  }

  useEffect(() => {
    load().catch(() => setMessage('알림 조회에 실패했습니다.'));
  }, []);

  const filtered = useMemo(() => (filter === 'all' ? rows : rows.filter((row) => !row.read)), [rows, filter]);

  useEffect(() => {
    let socket: Socket | null = null;
    let mounted = true;

    async function connectSocket() {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = (await res.json()) as { success: boolean; data?: { actorId: string } };
      if (!mounted || !res.ok || !json.success || !json.data?.actorId) return;

      socket = io('/', {
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket']
      });
      socket.emit('join-user-room', { userId: json.data.actorId });
      socket.on('notification-created', () => {
        load().catch(() => undefined);
      });
    }

    connectSocket().catch(() => undefined);
    return () => {
      mounted = false;
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <section className="card">
      <h1>알림함</h1>
      <div className="pc-pill-row">
        <button type="button" className={`pc-pill${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>
          전체
        </button>
        <button type="button" className={`pc-pill${filter === 'unread' ? ' is-active' : ''}`} onClick={() => setFilter('unread')}>
          미확인
        </button>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button className="pc-button" onClick={() => load()} disabled={loading}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
        <button className="pc-button pc-button-primary" onClick={() => markAllRead()}>
          전체 읽음
        </button>
      </div>

      {filtered.length > 0 ? (
        <ul className="pc-list-reset pc-stack">
          {filtered.map((row) => (
            <li key={row._id} className={`pc-notification-item${row.read ? '' : ' is-unread'}`} onClick={() => openNotification(row)}>
              <strong>{row.read ? '읽음' : '새 알림'}</strong> / {row.title}
              <div style={{ marginTop: 4 }}>{row.message}</div>
              <div className="pc-meta">{new Date(row.sentAt).toLocaleString('ko-KR')}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ marginTop: 12 }}>표시할 알림이 없습니다.</p>
      )}
      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </section>
  );
}
