'use client';

import { useEffect, useState } from 'react';

export function useTaskReminderCount(refreshKey: unknown = null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/tasks/reminders')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.count === 'number') {
          setCount(data.count);
        }
      })
      .catch(() => {
        // Badge/banner just keeps its previous count on network failure.
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return count;
}
