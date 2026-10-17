/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

describe('ProjectDetailPage - label delete rollback on API failure', () => {
  it('restores labels state and every Task\'s labels[] when the DELETE call fails, and shows an error alert', async () => {
    const project = {
      id: 'project-1',
      name: 'Project',
      description: null,
      createdAt: '2026-08-28T00:00:00.000Z',
    };
    const columns = [
      { id: 'col-todo', name: 'Todo', color: 'blue', order: 0, isDoneColumn: false, projectId: 'project-1' },
    ];
    const label = { id: 'label-1', name: 'Cần review', color: 'red', taskCount: 1 };
    const task = {
      id: 'task-1',
      title: 'Labeled task',
      status: 'todo',
      projectId: 'project-1',
      createdAt: '2026-08-28T00:00:00.000Z',
      order: 0,
      columnId: 'col-todo',
      labels: [label],
      subTasks: [],
    };

    const fetchMock = jest.fn((url: RequestInfo | URL, init?: RequestInit) => {
      if (typeof url === 'string' && url === '/api/labels/label-1' && init?.method === 'DELETE') {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      if (typeof url === 'string' && url.endsWith('/labels')) {
        return Promise.resolve({ ok: true, json: async () => [label] });
      }
      if (typeof url === 'string' && url.endsWith('/columns')) {
        return Promise.resolve({ ok: true, json: async () => columns });
      }
      if (typeof url === 'string' && url.endsWith('/tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task] });
      }
      if (url === '/api/projects') {
        return Promise.resolve({ ok: true, json: async () => [project] });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ProjectDetailPage />);
    await screen.findByText('Labeled task');

    // Label chip visible on the TaskCard before deletion.
    const todoColumn = screen.getByText('Todo').closest('div.w-80') as HTMLElement;
    expect(within(todoColumn).getByText('Cần review')).toBeInTheDocument();
    // Label present in the filter dropdown too.
    expect(screen.getByRole('option', { name: 'Cần review' })).toBeInTheDocument();

    // The Pencil/Archive/Trash2 icon buttons on the TaskCard have no
    // aria-label; Pencil (edit) is the first of the three in source order.
    const taskCard = within(todoColumn).getByText('Labeled task').closest('.cursor-grab') as HTMLElement;
    fireEvent.click(within(taskCard).getAllByRole('button')[0]);
    fireEvent.click(await screen.findByLabelText('Xóa nhãn Cần review'));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/labels/label-1', { method: 'DELETE' })
    );

    // Rolled back: error alert shown, label still in the filter dropdown and
    // still attached to the Task (requires closing the edit dialog first,
    // since the TaskCard underneath is covered by the modal overlay).
    await screen.findByText('Không xóa được nhãn, đã khôi phục');
    expect(screen.getByRole('option', { name: 'Cần review' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(within(todoColumn).getByText('Cần review')).toBeInTheDocument();
  });
});
