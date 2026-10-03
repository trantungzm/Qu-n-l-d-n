import { prisma } from '@/lib/prisma';
import { PATCH } from '@/app/api/projects/[id]/archive/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      update: jest.fn(),
    },
  },
}));

describe('PATCH /api/projects/[id]/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets archivedAt to a Date when archived is true', async () => {
    (prisma.project.update as jest.Mock).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'project-1', name: 'P', ...data })
    );

    const response = await PATCH(
      new Request('http://localhost/api/projects/project-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(response.status).toBe(200);
    const [[call]] = (prisma.project.update as jest.Mock).mock.calls;
    expect(call.where).toEqual({ id: 'project-1' });
    expect(call.data.archivedAt).toBeInstanceOf(Date);

    const body = await response.json();
    expect(body.archivedAt).not.toBeNull();
  });

  it('restores the project by setting archivedAt back to null when archived is false', async () => {
    (prisma.project.update as jest.Mock).mockResolvedValue({
      id: 'project-1',
      name: 'P',
      archivedAt: null,
    });

    const response = await PATCH(
      new Request('http://localhost/api/projects/project-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { archivedAt: null },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.archivedAt).toBeNull();
  });

  it('rejects a non-boolean archived value with 400', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/projects/project-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: 'yes' }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(response.status).toBe(400);
    expect(prisma.project.update).not.toHaveBeenCalled();
  });
});
