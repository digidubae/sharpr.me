'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, SystemIcon } from './icons';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center py-4" aria-hidden="true">
        <div className="h-8 w-[160px] rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4">
      <div className="relative flex h-8 items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
        {/* Sliding background */}
        <div
          className={`absolute h-6 w-[48px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out dark:bg-gray-700
            ${theme === 'light' ? 'translate-x-0' : ''}
            ${theme === 'dark' ? 'translate-x-[52px]' : ''}
            ${theme === 'system' ? 'translate-x-[104px]' : ''}
          `}
        />

        {/* Buttons */}
        <button
          onClick={() => setTheme('light')}
          className={`relative z-10 flex h-6 w-[48px] items-center justify-center rounded-full transition-colors
            ${theme === 'light' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          aria-label="Light theme"
        >
          <SunIcon />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`relative z-10 flex h-6 w-[48px] items-center justify-center rounded-full transition-colors
            ${theme === 'dark' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          aria-label="Dark theme"
        >
          <MoonIcon />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`relative z-10 flex h-6 w-[48px] items-center justify-center rounded-full transition-colors
            ${theme === 'system' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          aria-label="System theme"
        >
          <SystemIcon />
        </button>
      </div>
    </div>
  );
}
