import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbConnect = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdAndDelete = vi.fn();
const mockFindByIdAndUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  dbConnect: mockDbConnect
}));

vi.mock('@/lib/models/ClubRoom', () => ({
  default: {
    findById: mockFindById,
    findByIdAndDelete: mockFindByIdAndDelete,
    findByIdAndUpdate: mockFindByIdAndUpdate
  }
}));

const routeModulePromise = import('./route');

describe('club-rooms/[id] route auth guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH returns 401 when x-actor-id header is missing', async () => {
    const { PATCH } = await routeModulePromise;
    const req = new NextRequest('http://localhost:3000/api/club-rooms/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new name' })
    });
    const res = await PATCH(req, { params: { id: 'abc' } });
    expect(res.status).toBe(401);
  });

  it('PATCH returns 403 when actor is not owner/manager', async () => {
    const { PATCH } = await routeModulePromise;
    mockFindById.mockResolvedValue({
      ownerId: 'owner-1',
      managers: ['manager-1']
    });

    const req = new NextRequest('http://localhost:3000/api/club-rooms/abc', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-actor-id': 'other-user'
      },
      body: JSON.stringify({ name: 'new name' })
    });
    const res = await PATCH(req, { params: { id: 'abc' } });
    expect(res.status).toBe(403);
  });

  it('DELETE returns 403 when actor is not owner/manager', async () => {
    const { DELETE } = await routeModulePromise;
    mockFindById.mockResolvedValue({
      ownerId: 'owner-1',
      managers: ['manager-1']
    });

    const req = new NextRequest('http://localhost:3000/api/club-rooms/abc', {
      method: 'DELETE',
      headers: {
        'x-actor-id': 'other-user'
      }
    });
    const res = await DELETE(req, { params: { id: 'abc' } });
    expect(res.status).toBe(403);
  });
});
