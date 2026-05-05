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
vi.mock('@/lib/models/ClubRoom', () => ({
  default: { findById, findByIdAndUpdate }
}));

const findUserById = vi.fn();
const findUsers = vi.fn();
vi.mock('@/lib/models/User', () => ({
  default: { findById: findUserById, find: findUsers }
}));

const { POST, GET } = await import('./route');

const baseClub = {
  _id: 'c1',
  ownerId: 'owner-1',
  managers: [],
  pendingApplications: []
};

describe('/api/club-rooms/[id]/applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUserById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    findUsers.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })
    });
    findByIdAndUpdate.mockResolvedValue({});
  });

  it('POST - rejects unauthenticated', async () => {
    getActorAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ success: false }, { status: 401 })
    });
    const req = new NextRequest('http://localhost/api/club-rooms/c1/applications', {
      method: 'POST',
      body: JSON.stringify({ message: 'hi' })
    });
    const res = await POST(req, { params: { id: 'c1' } });
    expect(res.status).toBe(401);
  });

  it('POST - rejects when actor is owner', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'owner-1', role: 'member', isServiceAdmin: false }
    });
    findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseClub) });
    const req = new NextRequest('http://localhost/api/club-rooms/c1/applications', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req, { params: { id: 'c1' } });
    expect(res.status).toBe(400);
  });

  it('POST - rejects duplicate application', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'u1', role: 'member', isServiceAdmin: false }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        ...baseClub,
        pendingApplications: [{ userId: 'u1', message: '', requestedAt: new Date() }]
      })
    });
    const req = new NextRequest('http://localhost/api/club-rooms/c1/applications', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req, { params: { id: 'c1' } });
    expect(res.status).toBe(409);
  });

  it('POST - pushes new application', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'u1', role: 'member', isServiceAdmin: false }
    });
    findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseClub) });
    const req = new NextRequest('http://localhost/api/club-rooms/c1/applications', {
      method: 'POST',
      body: JSON.stringify({ message: '잘 부탁드립니다' })
    });
    const res = await POST(req, { params: { id: 'c1' } });
    expect(res.status).toBe(201);
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const update = findByIdAndUpdate.mock.calls[0][1] as {
      $push: { pendingApplications: { userId: string; message: string } };
    };
    expect(update.$push.pendingApplications.userId).toBe('u1');
    expect(update.$push.pendingApplications.message).toBe('잘 부탁드립니다');
  });

  it('GET - rejects non-manager', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'someone', role: 'member', isServiceAdmin: false }
    });
    findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(baseClub) });
    canManageClubRoomById.mockResolvedValue(false);
    const req = new NextRequest('http://localhost/api/club-rooms/c1/applications');
    const res = await GET(req, { params: { id: 'c1' } });
    expect(res.status).toBe(403);
  });

  it('GET - returns applications with displayName for manager', async () => {
    getActorAccess.mockResolvedValue({
      ok: true,
      access: { actorId: 'owner-1', role: 'service_admin', isServiceAdmin: true }
    });
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        ...baseClub,
        pendingApplications: [
          { userId: 'u1', message: '안녕하세요', requestedAt: new Date('2026-05-01') }
        ]
      })
    });
    findUsers.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: 'u1', displayName: '신청자1', nickname: 'a', profileImage: '' }])
      })
    });

    const req = new NextRequest('http://localhost/api/club-rooms/c1/applications');
    const res = await GET(req, { params: { id: 'c1' } });
    const body = (await res.json()) as { success: boolean; data: Array<{ displayName: string; userId: string }> };
    expect(res.status).toBe(200);
    expect(body.data[0].displayName).toBe('신청자1');
    expect(body.data[0].userId).toBe('u1');
  });
});
