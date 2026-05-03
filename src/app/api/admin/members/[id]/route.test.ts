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
vi.mock('@/lib/models/User', () => ({
  default: {
    findById,
    findByIdAndUpdate
  }
}));

const { PATCH } = await import('./route');

describe('/api/admin/members/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when club manager has no permission', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'm1', role: 'member', isServiceAdmin: false }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'u1', clubRoomId: 'room-1' })
    });
    canManageClubRoomById.mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/admin/members/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'member' })
    });
    const res = await PATCH(req, { params: { id: 'u1' } });
    expect(res.status).toBe(403);
  });

  it('returns 400 when body has no updatable field', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'a1', role: 'service_admin', isServiceAdmin: true }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'u1', clubRoomId: 'room-1' })
    });

    const req = new NextRequest('http://localhost/api/admin/members/u1', {
      method: 'PATCH',
      body: JSON.stringify({})
    });
    const res = await PATCH(req, { params: { id: 'u1' } });
    expect(res.status).toBe(400);
  });

  it('updates member for service admin', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'a1', role: 'service_admin', isServiceAdmin: true }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'u1', clubRoomId: 'room-1' })
    });
    findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'u1', role: 'member' })
      })
    });

    const req = new NextRequest('http://localhost/api/admin/members/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'member' })
    });
    const res = await PATCH(req, { params: { id: 'u1' } });
    const body = (await res.json()) as { success: boolean };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });
});

