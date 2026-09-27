'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Hệ thống', icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      role="group"
      aria-label="Chọn giao diện sáng/tối"
      className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 md:justify-start"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              'flex h-7 flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors md:px-2',
              active
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden md:ml-1.5 md:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
