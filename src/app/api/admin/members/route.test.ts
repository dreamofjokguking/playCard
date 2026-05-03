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

const getActorAccess = vi.fn();
const canManageClubRoomById = vi.fn();
vi.mock('@/lib/accessControl', () => ({
  getActorAccess,
  canManageClubRoomById
}));

const find = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: {
    find
  }
}));

const { GET } = await import('./route');

describe('/api/admin/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when auth fails', async () => {
    getActorAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
    });

    const req = new NextRequest('http://localhost/api/admin/members');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for club manager without clubRoomId', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'm1', role: 'member', isServiceAdmin: false }
    });

    const req = new NextRequest('http://localhost/api/admin/members');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns members for service admin', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'a1', role: 'service_admin', isServiceAdmin: true }
    });
    find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([{ _id: 'u1' }])
          })
        })
      })
    });

    const req = new NextRequest('http://localhost/api/admin/members');
    const res = await GET(req);
    const body = (await res.json()) as { success: boolean; data?: { _id: string }[] };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.[0]?._id).toBe('u1');
  });
});

