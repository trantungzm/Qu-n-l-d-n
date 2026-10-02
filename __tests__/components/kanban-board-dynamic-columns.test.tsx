/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react';
import ProjectDetailPage from '@/app/projects/[id]/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: 'project-1' }),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: jest.fn(),
  PointerSensor: jest.fn(),
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

describe('Kanban board renders project-defined columns', () => {
  it('renders the fetched Column list (not a hardcoded Todo/Doing/Done) with tasks under the right column', async () => {
    const project = {
      id: 'project-1',
      name: 'Project',
      description: null,
      createdAt: '2026-08-28T00:00:00.000Z',
    };
    const columns = [
      { id: 'col-backlog', name: 'Backlog', color: 'gray', order: 0, isDoneColumn: false, projectId: 'project-1' },
      { id: 'col-review', name: 'Review', color: 'purple', order: 1, isDoneColumn: false, projectId: 'project-1' },
    ];
    const tasks = [
      {
        id: 'task-1',
        title: 'In the backlog',
        status: 'todo',
        projectId: 'project-1',
        createdAt: '2026-08-28T00:00:00.000Z',
        order: 0,
        columnId: 'col-backlog',
      },
      {
        id: 'task-2',
        title: 'Being reviewed',
        status: 'todo',
        projectId: 'project-1',
        createdAt: '2026-08-28T00:00:00.000Z',
        order: 0,
        columnId: 'col-review',
      },
    ];

    global.fetch = jest.fn((url: RequestInfo | URL) => {
      if (url === '/api/projects') {
        return Promise.resolve({ ok: true, json: async () => [project] } as Response);
      }
      if (typeof url === 'string' && url.endsWith('/columns')) {
        return Promise.resolve({ ok: true, json: async () => columns } as Response);
      }
      if (typeof url === 'string' && url.endsWith('/tasks')) {
        return Promise.resolve({ ok: true, json: async () => tasks } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    }) as unknown as typeof fetch;

    render(<ProjectDetailPage />);

    await screen.findByText('In the backlog');

    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.queryByText('Todo')).not.toBeInTheDocument();
    expect(screen.queryByText('Doing')).not.toBeInTheDocument();
    expect(screen.queryByText('Done')).not.toBeInTheDocument();

    const backlogColumn = screen.getByText('Backlog').closest('div.w-80') as HTMLElement;
    const reviewColumn = screen.getByText('Review').closest('div.w-80') as HTMLElement;

    expect(within(backlogColumn).getByText('In the backlog')).toBeInTheDocument();
    expect(within(backlogColumn).queryByText('Being reviewed')).not.toBeInTheDocument();
    expect(within(reviewColumn).getByText('Being reviewed')).toBeInTheDocument();
    expect(within(reviewColumn).queryByText('In the backlog')).not.toBeInTheDocument();

    expect(screen.getByText('Thêm cột')).toBeInTheDocument();
  });
});
