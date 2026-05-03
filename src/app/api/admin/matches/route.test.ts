import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiLogger', () => ({
  withApiLogging: <TArgs extends unknown[]>(
    handler: (request: NextRequest, ...args: TArgs) => Promise<Response>
  ) => handler
}));

vi.mock('@/lib/db', () => ({
  dbConnect: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@/lib/notifications', () => ({
  broadcastNotification: vi.fn().mockResolvedValue(undefined)
}));

const getActorAccess = vi.fn();
const canManageClubRoomById = vi.fn();
vi.mock('@/lib/accessControl', () => ({
  getActorAccess,
  canManageClubRoomById
}));

const find = vi.fn();
const create = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: {
    find,
    create
  }
}));

const { GET, POST } = await import('./route');

describe('/api/admin/matches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when admin check fails', async () => {
    getActorAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
    });

    const req = new NextRequest('http://localhost/api/admin/matches');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('creates match for admin', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    create.mockResolvedValue({ _id: 'match-1' });

    const req = new NextRequest('http://localhost/api/admin/matches', {
      method: 'POST',
      body: JSON.stringify({
        clubRoomId: 'room-1',
        date: '2026-05-03',
        time: '19:00',
        participants: ['u1', 'u2']
      })
    });
    const res = await POST(req);
    const body = (await res.json()) as { success: boolean; data?: { _id?: string } };

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('rejects club manager post when not owner/manager', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'member-1', role: 'member', isServiceAdmin: false }
    });
    canManageClubRoomById.mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/admin/matches', {
      method: 'POST',
      body: JSON.stringify({
        clubRoomId: 'room-1',
        date: '2026-05-03',
        time: '19:00',
        participants: ['u1', 'u2']
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
