'use client';

import { useRef, useEffect } from 'react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

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
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4">Sharpr.me</h2>
        
        <div className="space-y-6 text-gray-600 dark:text-gray-300">
          <section>
            <p className="mb-4 leading-relaxed">
              Welcome to Sharpr, your personal knowledge acceleration tool. Supercharge your brain by capturing and 
              organizing what matters most to you.
            </p>
            <p>
            With lightning-fast keyboard shortcuts and intelligent organization, 
              you can instantly access and stay on top of your knowledge base.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Key Features</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Smart organization with spaces, subjects and tags</li>
              <li>Rich text editor for rich content</li>
              <li>Seamless keyboard navigation</li>
              <li>Progress tracking with completion states</li>
              <li>Priority management with pinning and custom ordering</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Navigation</h4>
                <ul className="space-y-1">
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd> Previous subject</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd> Next subject</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">/</kbd> Focus search</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">t</kbd> Jump to top subject</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">b</kbd> Jump to bottom subject</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Actions</h4>
                <ul className="space-y-1">
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">a</kbd> Add subject</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> Toggle complete</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">h</kbd> Toggle hide completed</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">d</kbd> Delete subject</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> Edit subject</li>
                  <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">p</kbd> Toggle pin</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                     dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 