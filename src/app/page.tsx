'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import { useEffect, useState, useRef } from 'react';
import SpaceCard from '@/components/SpaceCard';
import { LibrarySpace } from '@/types';
import { fetchWithAuth } from '@/utils/api';
import Shimmer from '@/components/Shimmer';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [librarySpaces, setLibrarySpaces] = useState<LibrarySpace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  // Fetch library spaces when component mounts and user is signed in
  useEffect(() => {
    if (session?.user && !hasLoadedRef.current) {
      setIsLoading(true);
      hasLoadedRef.current = true;
      fetchWithAuth('/api/library')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLibrarySpaces(data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (!session) {
      setLibrarySpaces([]);
      setIsLoading(false);
      hasLoadedRef.current = false;
    }
  }, [session]);

  if (status === "loading") {
    return <Shimmer message="Loading..." />;
  }

  const handleSignIn = () => {
    signIn('google', { redirect: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Sharpr.me
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay sharp with information at your fingertips
          </p>
          {!session && (
            <p className="mt-4 text-gray-600">
              Try an example space: {' '}
              <Link href="/example/personal" className="text-blue-600 hover:underline">personal</Link>,{' '}
              <Link href="/example/project" className="text-blue-600 hover:underline">project</Link>,{' '}
              <Link href="/example/study" className="text-blue-600 hover:underline">study</Link>{' '}
              or{' '}
              <Link href="/example/work" className="text-blue-600 hover:underline">work</Link>
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {session ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {session.user?.name}
                </h1>
                <SignOutButton />
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  You're signed in as {session.user?.email}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Your Spaces</h2>
                  <Link 
                    href="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create New Space
                  </Link>
                </div>

                <div className="space-y-3">
                  {isLoading ? (
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
                        <p className="text-gray-600 text-center py-8">
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Organize Knowledge</h3>
                  <p className="text-gray-600">Create dedicated spaces for different areas of your life - work, study, or personal projects.</p>
                </div>

                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
                  <p className="text-gray-600">Find information instantly with powerful search and keyboard shortcuts.</p>
                </div>

                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
                  <p className="text-gray-600">Simple and intuitive interface to manage and organize your information.</p>
                </div>
              </div>

              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Sign in to get started
                </h2>
                <button
                  onClick={handleSignIn}
                  className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-600 font-medium rounded-md border border-gray-300 inline-flex items-center transition-colors"
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
