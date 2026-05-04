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

const findById = vi.fn();
const findByIdAndUpdate = vi.fn();
vi.mock('@/lib/models/Match', () => ({
  default: {
    findById,
    findByIdAndUpdate
  }
}));

const { GET, PATCH } = await import('./route');

describe('/api/admin/matches/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admin request', async () => {
    getActorAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ success: false, message: '관리자 권한이 없습니다.' }, { status: 403 })
    });

    const req = new NextRequest('http://localhost/api/admin/matches/m1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    });
    const res = await PATCH(req, { params: { id: 'm1' } });
    expect(res.status).toBe(403);
  });

  it('updates status for admin request', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'm1', clubRoomId: 'room-1' })
    });
    findByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'm1', status: 'completed' })
    });

    const req = new NextRequest('http://localhost/api/admin/matches/m1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    });
    const res = await PATCH(req, { params: { id: 'm1' } });
    const body = (await res.json()) as { success: boolean };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('rejects club manager when room management permission is missing', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'member-1', role: 'member', isServiceAdmin: false }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'm1', clubRoomId: 'room-1' })
    });
    canManageClubRoomById.mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/admin/matches/m1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    });
    const res = await PATCH(req, { params: { id: 'm1' } });
    expect(res.status).toBe(403);
  });

  it('returns match by id for authorized user', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'admin-1', role: 'service_admin', isServiceAdmin: true }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'm1', clubRoomId: 'room-1', participants: ['u1'] })
    });

    const req = new NextRequest('http://localhost/api/admin/matches/m1');
    const res = await GET(req, { params: { id: 'm1' } });
    const body = (await res.json()) as { success: boolean; data: { _id: string } };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('m1');
  });
});
