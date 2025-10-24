'use client';

import { useEffect, useRef } from 'react';
import { useDialog } from '@/context/DialogContext';

interface ShortcutsHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsHelpDialog({ isOpen, onClose }: ShortcutsHelpDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { setIsDialogOpen } = useDialog();

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen, setIsDialogOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Navigation</h3>
            <ul className="space-y-1">
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd> Previous subject</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd> Next subject</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">→</kbd> Expand selected (collapsed view)</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">←</kbd> Collapse selected (collapsed view)</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">/</kbd> Focus search</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">t</kbd> Jump to top</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">b</kbd> Jump to bottom</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Actions</h3>
            <ul className="space-y-1">
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">a</kbd> Add subject</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> Toggle complete</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">h</kbd> Hide completed</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">c</kbd> Toggle collapsed/full view</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">d</kbd> Delete subject</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> Edit subject</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Shift + Esc</kbd> Exit edit</li>
              <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">p</kbd> Toggle pin</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


