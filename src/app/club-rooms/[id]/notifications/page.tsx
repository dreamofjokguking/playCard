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

type IconKey = 'whistle' | 'flag' | 'trophy' | 'clipboard' | 'bell';

type TypeMeta = {
  icon: IconKey;
  tone: 'primary' | 'secondary' | 'accent' | 'neutral';
};

function metaForType(type: string): TypeMeta {
  if (type === 'evaluation.position.requested') return { icon: 'clipboard', tone: 'primary' };
  if (type === 'evaluation.started') return { icon: 'whistle', tone: 'secondary' };
  if (type === 'evaluation.completed') return { icon: 'trophy', tone: 'accent' };
  if (type.startsWith('evaluation')) return { icon: 'flag', tone: 'primary' };
  return { icon: 'bell', tone: 'neutral' };
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = now - then;
  if (diff < 0) return '방금';
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return '방금';
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  const date = new Date(iso);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

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

  const unreadCount = useMemo(() => rows.filter((row) => !row.read).length, [rows]);
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
    <section className="card pc-notification-section">
      <div className="pc-notification-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>알림함</h1>
          <p className="pc-meta" style={{ marginTop: 0 }}>
            {unreadCount > 0 ? `미확인 ${unreadCount}건` : '모두 읽었어요'}
          </p>
        </div>
        <button
          type="button"
          className="pc-pill"
          onClick={() => markAllRead()}
          disabled={loading || unreadCount === 0}
        >
          전체 읽음
        </button>
      </div>

      <div className="pc-pill-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          className={`pc-pill${filter === 'all' ? ' is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 {rows.length}
        </button>
        <button
          type="button"
          className={`pc-pill${filter === 'unread' ? ' is-active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          미확인 {unreadCount}
        </button>
        <button
          type="button"
          className="pc-pill"
          onClick={() => load()}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? '불러오는 중...' : '↻ 새로고침'}
        </button>
      </div>

      {filtered.length > 0 ? (
        <ul className="pc-list-reset pc-notification-list">
          {filtered.map((row) => {
            const meta = metaForType(row.type);
            return (
              <li
                key={row._id}
                className={`pc-notification-item pc-tone-${meta.tone}${row.read ? '' : ' is-unread'}`}
                onClick={() => openNotification(row)}
              >
                <span className="pc-notification-icon" aria-hidden="true">
                  <NotificationIcon kind={meta.icon} />
                </span>
                <div className="pc-notification-body">
                  <div className="pc-notification-row">
                    <strong className="pc-notification-title">{row.title}</strong>
                    <time className="pc-notification-time" dateTime={row.sentAt}>
                      {formatRelative(row.sentAt)}
                    </time>
                  </div>
                  <div className="pc-notification-message">{row.message}</div>
                </div>
                {row.read ? null : <span className="pc-notification-dot" aria-label="미확인" />}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="pc-notification-empty">
          <div className="pc-notification-empty-icon" aria-hidden="true">
            <NotificationIcon kind="bell" />
          </div>
          <strong>{filter === 'unread' ? '미확인 알림이 없어요' : '아직 받은 알림이 없어요'}</strong>
          <p className="pc-meta" style={{ marginTop: 4 }}>
            경기 일정이 잡히거나 평가가 시작되면 여기로 알려드릴게요.
          </p>
        </div>
      )}
      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </section>
  );
}

function NotificationIcon({ kind }: { kind: IconKey }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };
  if (kind === 'whistle') {
    return (
      <svg {...common}>
        <circle cx="9" cy="14" r="5" />
        <path d="M14 14h7l-2-4-5 1" />
        <path d="M9 9V5" />
      </svg>
    );
  }
  if (kind === 'flag') {
    return (
      <svg {...common}>
        <path d="M5 21V4" />
        <path d="M5 4h12l-2 4 2 4H5" />
      </svg>
    );
  }
  if (kind === 'trophy') {
    return (
      <svg {...common}>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
        <path d="M5 5H3v2a3 3 0 0 0 3 3" />
        <path d="M19 5h2v2a3 3 0 0 1-3 3" />
        <path d="M10 17h4v3h-4z" />
        <path d="M8 21h8" />
      </svg>
    );
  }
  if (kind === 'clipboard') {
    return (
      <svg {...common}>
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <path d="M9 4v2h6V4" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
