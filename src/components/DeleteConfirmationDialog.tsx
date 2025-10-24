'use client';

import { useEffect, useRef } from 'react';
import { useDialog } from '@/context/DialogContext';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  subjectSnippet?: string;
}

export default function DeleteConfirmationDialog({ isOpen, onConfirm, onCancel, subjectSnippet }: DeleteConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { setIsDialogOpen } = useDialog();

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen, setIsDialogOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      e.stopPropagation();

      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onConfirm();
      } else if (e.key.toLowerCase() === 'n' || e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the backdrop, not its children
    if (e.target === dialogRef.current) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl animate-fadeIn">
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {`Are you sure you want to delete this subject${subjectSnippet ? ` (${subjectSnippet})` : ''}?`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                     dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                     transition-colors text-sm"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
} 