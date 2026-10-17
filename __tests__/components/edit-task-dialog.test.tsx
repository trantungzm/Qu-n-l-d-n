/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditTaskDialog } from '@/components/edit-task-dialog';
import type { TaskLabel } from '@/lib/label';

describe('EditTaskDialog - label delete confirm, count, and rollback', () => {
  const task = {
    id: 'task-1',
    title: 'Some task',
    dueDate: null,
    priority: 'medium',
    type: 'feature',
    labels: [{ id: 'label-1', name: 'Cần review', color: 'red' }] as TaskLabel[],
  };

  const labels: TaskLabel[] = [
    { id: 'label-1', name: 'Cần review', color: 'red', taskCount: 4 },
  ];

  function baseProps(onDeleteLabel: (label: TaskLabel) => Promise<boolean>) {
    return {
      open: true,
      onOpenChange: jest.fn(),
      onTaskUpdated: jest.fn(),
      task,
      projectId: 'project-1',
      labels,
      onLabelsChanged: jest.fn(),
      onDeleteLabel,
    };
  }

  it('shows the task count (including archived Tasks) in the confirm dialog', () => {
    render(<EditTaskDialog {...baseProps(jest.fn())} />);

    fireEvent.click(screen.getByLabelText('Xóa nhãn Cần review'));

    expect(screen.getByText('Xóa nhãn "Cần review"?')).toBeInTheDocument();
    expect(screen.getByText(/đang gắn vào 4 Task/)).toBeInTheDocument();
  });

  it('optimistically deselects the label and calls onDeleteLabel on confirm', async () => {
    const onDeleteLabel = jest.fn().mockResolvedValue(true);
    render(<EditTaskDialog {...baseProps(onDeleteLabel)} />);

    const toggleButton = screen.getByRole('button', { name: 'Cần review' });
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByLabelText('Xóa nhãn Cần review'));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));

    await waitFor(() => expect(onDeleteLabel).toHaveBeenCalledWith(labels[0]));
  });

  it('rolls the selection back when onDeleteLabel reports failure', async () => {
    const onDeleteLabel = jest.fn().mockResolvedValue(false);
    render(<EditTaskDialog {...baseProps(onDeleteLabel)} />);

    fireEvent.click(screen.getByLabelText('Xóa nhãn Cần review'));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));

    await waitFor(() => expect(onDeleteLabel).toHaveBeenCalledTimes(1));

    // Rolled back: the label chip is selected again (same as before the
    // optimistic removal), and the confirm dialog is closed.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cần review' })).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.queryByText('Xóa nhãn "Cần review"?')).not.toBeInTheDocument();
  });
});
