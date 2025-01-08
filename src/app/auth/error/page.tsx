'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 text-red-500 dark:text-red-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Text content */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Authentication Error
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {error === 'AccessTokenMissing' 
                ? 'Your session needs to be refreshed. Please sign in again.'
                : 'There was a problem signing you in. Please try again.'}
            </p>
          </div>

          {/* Action button */}
          <Link
            href="/api/auth/signin"
            className="inline-block px-6 py-3 text-base font-medium text-white 
                     bg-blue-500 rounded-lg hover:bg-blue-600 
                     transition-colors duration-200"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 