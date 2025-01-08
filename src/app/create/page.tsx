'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSpaces } from '@/hooks/useSpaces';

export default function CreateSpacePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [existingSpaceId, setExistingSpaceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { invalidateSpaces } = useSpaces();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [status]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a space title');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setExistingSpaceId(null);

      const response = await fetch('/api/spaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      const data = await response.json();

      if (response.status === 409) {
        setExistingSpaceId(data.spaceId);
        setError('Space already exists. Would you like to open it?');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create space');
      }

      // Invalidate spaces cache after successful creation
      await invalidateSpaces();
      
      // Success - redirect to the new space
      router.push(`/s/${data.spaceId}`);
    } catch (error) {
      console.error('Error creating space:', error);
      setError(error instanceof Error ? error.message : 'Failed to create space');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenExisting = () => {
    if (existingSpaceId) {
      router.push(`/s/${existingSpaceId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 transition-all duration-200 hover:shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Create New Space</h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Space Title
              </label>
              <div className="mt-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleCreate();
                    }
                  }}
                  placeholder="Enter space title"
                  className="block w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 ease-in-out
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           text-gray-900 dark:text-white
                           bg-white dark:bg-gray-700
                           outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                <p>{error}</p>
                {existingSpaceId && (
                  <button
                    onClick={handleOpenExisting}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline mt-2 font-medium"
                  >
                    Open existing space
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 pt-4">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 px-6 py-3 border border-transparent text-sm font-medium rounded-lg
                         text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                         transform transition-all duration-200 ease-in-out
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         dark:focus:ring-offset-gray-800
                         hover:scale-[1.02]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                         disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-500"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Space'
                )}
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg
                         text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                         transform transition-all duration-200 ease-in-out
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         dark:focus:ring-offset-gray-800
                         hover:border-gray-300 dark:hover:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 