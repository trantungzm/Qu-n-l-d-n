/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArchivedPage from '@/app/archived/page';

describe('Archived page', () => {
  const archivedProject = {
    id: 'project-1',
    name: 'Old Project',
    description: null,
    archivedAt: '2026-10-01T00:00:00.000Z',
  };
  const archivedTask = {
    id: 'task-1',
    title: 'Old Task',
    archivedAt: '2026-10-01T00:00:00.000Z',
    project: { id: 'project-2', name: 'Other Project' },
  };

  function mockFetchOnce(projects: unknown[], tasks: unknown[]) {
    global.fetch = jest.fn((url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/api/projects?archived=true')) {
        return Promise.resolve({ ok: true, json: async () => projects } as Response);
      }
      if (typeof url === 'string' && url === '/api/tasks/archived') {
        return Promise.resolve({ ok: true, json: async () => tasks } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    }) as unknown as typeof fetch;
  }

  it('lists archived projects on the default tab', async () => {
    mockFetchOnce([archivedProject], [archivedTask]);

    render(<ArchivedPage />);

    expect(await screen.findByText('Old Project')).toBeInTheDocument();
    expect(screen.queryByText('Old Task')).not.toBeInTheDocument();
  });

  it('switches to the tasks tab and lists archived tasks', async () => {
    mockFetchOnce([archivedProject], [archivedTask]);

    render(<ArchivedPage />);
    await screen.findByText('Old Project');

    fireEvent.click(screen.getByRole('button', { name: /Công việc/ }));

    expect(await screen.findByText('Old Task')).toBeInTheDocument();
  });

  it('restores an archived project via Khôi phục, removing it from the list', async () => {
    mockFetchOnce([archivedProject], []);
    const fetchMock = global.fetch as jest.Mock;

    render(<ArchivedPage />);
    await screen.findByText('Old Project');

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ...archivedProject, archivedAt: null }) });

    fireEvent.click(screen.getByRole('button', { name: 'Khôi phục' }));

    await waitFor(() => expect(screen.queryByText('Old Project')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/project-1/archive',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ archived: false }),
      })
    );
  });

  it('permanently deletes an archived project after confirming in the AlertDialog', async () => {
    mockFetchOnce([archivedProject], []);
    const fetchMock = global.fetch as jest.Mock;

    render(<ArchivedPage />);
    await screen.findByText('Old Project');

    fireEvent.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));

    expect(await screen.findByText('Xóa vĩnh viễn dự án Old Project?')).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const confirmButtons = screen.getAllByRole('button', { name: 'Xóa vĩnh viễn' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(screen.queryByText('Old Project')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/project-1', { method: 'DELETE' });
  });
});
