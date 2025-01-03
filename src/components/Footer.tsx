'use client';

import { useState } from 'react';
import AboutDialog from './AboutDialog';
import packageInfo from '../../package.json';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const pathname = usePathname();
  const isInSpace = pathname.startsWith('/s/');

  return (
    <>
      <footer className="py-4 px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            {(isInSpace) && (
              <Link
                href="/"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 
                         dark:hover:text-blue-300 transition-colors"
              >
                Home
              </Link>
            )}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 
                       dark:hover:text-blue-300 transition-colors"
            >
              About
            </button>
            <Link
              href="/privacy-policy"
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 
                       dark:hover:text-blue-300 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            v{packageInfo.version}
          </span>
        </div>
      </footer>
      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
} 