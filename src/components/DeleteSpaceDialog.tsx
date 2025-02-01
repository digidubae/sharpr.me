'use client';

import { useState } from 'react';

interface DeleteSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  spaceCount?: number;
}

export default function DeleteSpaceDialog({ isOpen, onClose, onConfirm, spaceCount = 1 }: DeleteSpaceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting space:', error);
      // TODO: Handle error 
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Delete {spaceCount === 1 ? 'Space' : `${spaceCount} Spaces`}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to delete {spaceCount === 1 ? 'this space' : 'these spaces'}? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="relative px-4 py-2 text-sm font-medium text-white bg-red-500 
                     hover:bg-red-600 rounded-lg disabled:opacity-50 
                     disabled:cursor-not-allowed min-w-[100px]"
          >
            {isDeleting ? (
              <>
                <span className="opacity-0">Delete {spaceCount === 1 ? 'Space' : 'Spaces'}</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </>
            ) : (
              `Delete ${spaceCount === 1 ? 'Space' : 'Spaces'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 