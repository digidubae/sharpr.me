'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SpaceNotFoundProps {
  spaceId: string;
}

export default function SpaceNotFound({ spaceId }: SpaceNotFoundProps) {
  const router = useRouter();

  const handleCreateSpace = async () => {
    try {
      // Create the space directly
      const response = await fetch(`/api/subjects?id=${spaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: spaceId, // Include the ID in the body
          title: spaceId, // Use spaceId as default title, user can change it later
          subjects: [], // Start with empty subjects
          categories: [] // Include empty categories
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create space');
      }

      // Navigate to the newly created space
      router.push(`/s/${spaceId}`); // Updated to use /s/ instead of /i/
    } catch (error) {
      console.error('Error creating space:', error);
      // Fallback to manual creation if automatic fails
      router.push(`/?create=${spaceId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Icon */}
          <div className="mx-auto w-24 h-24 text-gray-400 dark:text-gray-500">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>

          {/* Text content */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Space Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The space "{spaceId}" doesn't exist yet
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 
                       transition-colors duration-200"
            >
              Return Home
            </button>
            <button
              onClick={handleCreateSpace}
              className="px-6 py-3 text-base font-medium text-white 
                       bg-blue-500 rounded-lg hover:bg-blue-600 
                       transition-colors duration-200"
            >
              Create This Space
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 