'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import { useEffect, useState, useRef } from 'react';
import SpaceCard from '@/components/SpaceCard';
import { LibrarySpace } from '@/types';
import { fetchWithAuth } from '@/utils/api';
import Shimmer from '@/components/Shimmer';
import { useSpaces } from '@/hooks/useSpaces';

export default function HomePage() {
  const { data: session, status: authStatus } = useSession();
  const { spaces: librarySpaces, isLoading: spacesLoading, invalidateSpaces } = useSpaces();
  const hasLoadedRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        if (session?.user) {
          window.location.href = '/create';
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [session]);

  if (authStatus === "loading") {
    return <Shimmer message="Loading..." />;
  }

  const handleSignIn = () => {
    signIn('google', { redirect: false });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await invalidateSpaces();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Sharpr.me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Stay sharp with information at your fingertips
          </p>
          {!session && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Try an example space: {' '}
              <Link href="/example/personal" className="text-blue-600 dark:text-blue-400 hover:underline">personal</Link>,{' '}
              <Link href="/example/project" className="text-blue-600 dark:text-blue-400 hover:underline">project</Link>,{' '}
              <Link href="/example/study" className="text-blue-600 dark:text-blue-400 hover:underline">study</Link>{' '}
              or{' '}
              <Link href="/example/work" className="text-blue-600 dark:text-blue-400 hover:underline">work</Link>
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {session ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome, {session.user?.name}
                </h1>
                <SignOutButton />
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You're signed in as {session.user?.email}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Spaces</h2>
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Refresh spaces"
                    >
                      <svg
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                  <Link
                    href="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Create New Space
                  </Link>
                </div>

                <div className="space-y-3">
                  {(spacesLoading || isRefreshing) ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      ))}
                    </>
                  ) : (
                    <>
                      {librarySpaces
                        .sort((a, b) => {
                          if (a.isPinned && !b.isPinned) return -1;
                          if (!a.isPinned && b.isPinned) return 1;
                          return b.addedAt - a.addedAt;
                        })
                        .map((space, index) => (
                          <SpaceCard
                            key={space.id}
                            id={space.id}
                            title={space.title}
                            lastVisited={space.addedAt}
                            isPinned={space.isPinned}
                            index={index}
                            onClick={(id) => window.location.href = `/s/${id}`}
                            section="library"
                            showActions={false}
                          />
                        ))}
                      {librarySpaces.length === 0 && (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                          No spaces in your library. Create one to get started!
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Organize Knowledge</h3>
                  <p className="text-gray-600 dark:text-gray-300">Create dedicated spaces for different areas of your life - work, study, or personal projects.</p>
                </div>

                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quick Access</h3>
                  <p className="text-gray-600 dark:text-gray-300">Find information instantly with powerful search and keyboard shortcuts.</p>
                </div>

                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Easy to Use</h3>
                  <p className="text-gray-600 dark:text-gray-300">Simple and intuitive interface to manage and organize your information.</p>
                </div>
              </div>

              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Sign in to get started
                </h2>
                <button
                  onClick={handleSignIn}
                  className="h-10 px-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-md border border-gray-300 dark:border-gray-600 inline-flex items-center transition-colors"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
