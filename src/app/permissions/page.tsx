'use client';

import { signOut } from 'next-auth/react';

export default function PermissionsPage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Additional Permissions Required
            </h1>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Sharpr.me needs permission to See, edit, and delete only the files in your Google Drive ONLY in the "Sharpr.me Data" folder.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Why do we need these permissions?
              </h2>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                <p>We need these permission to list, create, and delete spaces in "Sharpr.me Data" folder.</p>
              </ul>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Sign out and sign in again to grant these permissions.
            </p>

            <div className="text-center">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 