/** @jest-environment jsdom */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Home from '@/app/page';
import ProjectDetailPage from '@/app/projects/[id]/page';

const mockPush = jest.fn();
let dragEndHandler: ((event: { active: { id: string }; over: { id: string } }) => void) | undefined;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'project-1' }),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: typeof dragEndHandler }) => {
    dragEndHandler = onDragEnd;
    return <>{children}</>;
  },
  closestCenter: jest.fn(),
  PointerSensor: jest.fn(),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
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

describe('loading and error recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dragEndHandler = undefined;
  });

  it('retries the projects API after the first request fails', async () => {
    const project = {
      id: 'project-1',
      name: 'Recovered project',
      description: null,
      createdAt: '2026-08-28T00:00:00.000Z',
    };
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [project],
      });
    global.fetch = fetchMock as typeof fetch;

    render(<Home />);

    expect(screen.getByLabelText('Đang tải dự án')).toBeInTheDocument();
    await screen.findByText('Không tải được dữ liệu, thử lại');

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Recovered project')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/projects');
  });

  it('rolls a task back to its original column when status update fails', async () => {
    const project = {
      id: 'project-1',
      name: 'Project',
      description: null,
      createdAt: '2026-08-28T00:00:00.000Z',
    };
    const task = {
      id: 'task-1',
      title: 'Rollback me',
      status: 'todo',
      projectId: 'project-1',
      createdAt: '2026-08-28T00:00:00.000Z',
      order: 0,
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [project] })
      .mockResolvedValueOnce({ ok: true, json: async () => [task] })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    global.fetch = fetchMock as typeof fetch;

    render(<ProjectDetailPage />);
    await screen.findByText('Rollback me');

    const todoColumn = screen.getByRole('heading', { name: 'Todo' }).parentElement?.parentElement;
    const doingColumn = screen.getByRole('heading', { name: 'Doing' }).parentElement?.parentElement;
    expect(todoColumn).toBeTruthy();
    expect(doingColumn).toBeTruthy();
    expect(within(todoColumn as HTMLElement).getByText('Rollback me')).toBeInTheDocument();

    await act(async () => {
      await dragEndHandler?.({ active: { id: 'task-1' }, over: { id: 'doing' } });
    });

    await waitFor(() => {
      expect(within(todoColumn as HTMLElement).getByText('Rollback me')).toBeInTheDocument();
      expect(within(doingColumn as HTMLElement).queryByText('Rollback me')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Không lưu được thứ tự task, task đã được khôi phục')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/tasks/reorder',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ updates: [{ id: 'task-1', status: 'doing', order: 0 }] }),
      }),
    );
  });

  it('rolls a task back to its original position when reordering within the same column fails', async () => {
    const project = {
      id: 'project-1',
      name: 'Project',
      description: null,
      createdAt: '2026-08-28T00:00:00.000Z',
    };
    const taskA = {
      id: 'task-a',
      title: 'Task A',
      status: 'todo',
      projectId: 'project-1',
      createdAt: '2026-08-28T00:00:00.000Z',
      order: 0,
    };
    const taskB = {
      id: 'task-b',
      title: 'Task B',
      status: 'todo',
      projectId: 'project-1',
      createdAt: '2026-08-29T00:00:00.000Z',
      order: 1,
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [project] })
      .mockResolvedValueOnce({ ok: true, json: async () => [taskA, taskB] })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    global.fetch = fetchMock as typeof fetch;

    render(<ProjectDetailPage />);
    await screen.findByText('Task A');

    const todoColumn = screen.getByRole('heading', { name: 'Todo' }).parentElement?.parentElement as HTMLElement;
    const titlesBefore = within(todoColumn).getAllByText(/^Task [AB]$/).map((el) => el.textContent);
    expect(titlesBefore).toEqual(['Task A', 'Task B']);

    // Move "task-b" (last) to the front of the same column.
    await act(async () => {
      await dragEndHandler?.({ active: { id: 'task-b' }, over: { id: 'task-a' } });
    });

    await waitFor(() => {
      const titlesAfter = within(todoColumn).getAllByText(/^Task [AB]$/).map((el) => el.textContent);
      expect(titlesAfter).toEqual(['Task A', 'Task B']);
    });
    expect(screen.getByText('Không lưu được thứ tự task, task đã được khôi phục')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/tasks/reorder',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
