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

const findById = vi.fn();
const findByIdAndUpdate = vi.fn();
const findByIdAndDelete = vi.fn();

vi.mock('@/lib/models/ClubRoom', () => ({
  default: {
    findById,
    findByIdAndUpdate,
    findByIdAndDelete
  }
}));

const { DELETE, PATCH } = await import('./route');

describe('/api/club-rooms/[id] permission checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects PATCH without session cookie', async () => {
    const request = new NextRequest('http://localhost/api/club-rooms/room-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'updated' })
    });

    const response = await PATCH(request, { params: { id: 'room-1' } });
    const body = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(findById).not.toHaveBeenCalled();
  });

  it('rejects PATCH for non-manager user', async () => {
    findById.mockResolvedValue({
      ownerId: 'owner-1',
      managers: ['manager-1']
    });

    const request = new NextRequest('http://localhost/api/club-rooms/room-1', {
      method: 'PATCH',
      headers: {
        cookie: 'playcard_session_user_id=outsider-1'
      },
      body: JSON.stringify({ name: 'updated-name' })
    });

    const response = await PATCH(request, { params: { id: 'room-1' } });
    const body = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('allows owner PATCH including metric add', async () => {
    findById.mockResolvedValue({
      ownerId: 'owner-1',
      managers: []
    });
    findByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'room-1',
        name: 'updated-name',
        ownerId: 'owner-1',
        managers: [],
        sportType: 'soccer',
        positionMetrics: [{ key: 'pass', label: '패스', order: 1, isActive: true }]
      })
    });

    const request = new NextRequest('http://localhost/api/club-rooms/room-1', {
      method: 'PATCH',
      headers: {
        cookie: 'playcard_session_user_id=owner-1'
      },
      body: JSON.stringify({
        name: 'updated-name',
        positionMetrics: [{ key: 'pass', label: '패스', order: 1 }]
      })
    });

    const response = await PATCH(request, { params: { id: 'room-1' } });
    const body = (await response.json()) as { success: boolean; data: { _id: string } };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('room-1');
    expect(findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('rejects DELETE for non-manager user', async () => {
    findById.mockResolvedValue({
      ownerId: 'owner-1',
      managers: ['manager-1']
    });

    const request = new NextRequest('http://localhost/api/club-rooms/room-1', {
      method: 'DELETE',
      headers: {
        cookie: 'playcard_session_user_id=outsider-1'
      }
    });

    const response = await DELETE(request, { params: { id: 'room-1' } });

    expect(response.status).toBe(403);
    expect(findByIdAndDelete).not.toHaveBeenCalled();
  });
});
