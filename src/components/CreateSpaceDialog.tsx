'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/context/DialogContext';
import { motion } from 'framer-motion';

interface CreateSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialSpaceId?: string | null;
}

export default function CreateSpaceDialog({ isOpen, onClose, initialSpaceId }: CreateSpaceDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setIsDialogOpen } = useDialog();
  const [title, setTitle] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [error, setError] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const baseUrl = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'sharpr.me';

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen, setIsDialogOpen]);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  // Generate slug from title
  useEffect(() => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    if (slug) {
      setSpaceId(slug);
      checkExistingSpace(slug);
    }
  }, [title]);

  // Set initial values when dialog opens with initialSpaceId
  useEffect(() => {
    if (isOpen && initialSpaceId) {
      setSpaceId(initialSpaceId);
      // Generate a title from the spaceId
      const title = initialSpaceId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setTitle(title);
      checkExistingSpace(initialSpaceId);
    }
  }, [isOpen, initialSpaceId]);

  const checkExistingSpace = async (slug: string) => {
    if (!slug) {
      setIsExisting(false);
      setError('');
      return;
    }

    try {
      console.log('Checking space:', slug); // Debug log
      const response = await fetch(`/api/subjects?id=${slug}`);
      console.log('Response status:', response.status); // Debug log
      
      const exists = response.status === 200;
      console.log('Space exists:', exists); // Debug log
      
      setIsExisting(exists);
      if (!exists) {
        setError('');
      }
    } catch (error) {
      console.error('Error checking space:', error);
      setIsExisting(false);
      setError('Error checking space availability');
    }
  };

  const handleClose = () => {
    // Reset form values
    setTitle('');
    setSpaceId('');
    setError('');
    setIsExisting(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId.trim()) {
      setError('Please enter a space URL');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/subjects?id=${spaceId}`);
      
      if (response.status === 404) {
        // Space doesn't exist, create it
        const createResponse = await fetch(`/api/subjects?id=${spaceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subjects: [],
            hideCompleted: false,
            sortOption: 'manual',
            title: title || spaceId
          })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create space');
        }
        
      }
      // Whether the space was just created or already existed, navigate to it
      router.push(`/s/${spaceId}`);
      onClose();
      
    } catch (error) {
      console.error('Error creating/checking space:', error);
      setError('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Stop propagation for all keyboard events when dialog is open
      e.stopPropagation();

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <h2 className="text-xl font-semibold mb-4">Create New Space</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Space title
            </label>
            <input
              ref={titleInputRef}
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:bg-gray-700 dark:text-white"
              placeholder="My awesome space"
              maxLength={50}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="spaceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Space URL
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-1">{baseUrl}/s/</span>
              <input
                type="text"
                id="spaceId"
                value={spaceId}
                onChange={(e) => {
                  setSpaceId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  checkExistingSpace(e.target.value);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white"
                placeholder="my-space"
                maxLength={50}
              />
            </div>
          </div>

          {isExisting && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">
              This space already exists. Click "Open Existing Space" to access it.
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="relative px-4 py-2 text-sm font-medium text-white bg-blue-500 
                       hover:bg-blue-600 rounded-lg disabled:opacity-50 
                       disabled:cursor-not-allowed min-w-[140px]"
            >
              {isCreating ? (
                <>
                  <span className="opacity-0">
                    {isExisting ? 'Open Existing Space' : 'Create New Space'}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </>
              ) : (
                isExisting ? 'Open Existing Space' : 'Create New Space'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 