'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return null;
  }

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setShowDropdown(false);
    await signIn('google');
  };

  const renderMenuItems = () => {
    const items = [];

    if (pathname !== '/') {
      items.push(
        <Link
          key="home"
          href="/"
          onClick={() => setShowDropdown(false)}
          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 
                   dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700
                   border-b border-gray-200 dark:border-gray-700"
        >
          <svg 
            className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
          <span>Home</span>
        </Link>
      );
    }

    // if (pathname !== '/settings') {
    //   items.push(
    //     <Link
    //       key="settings"
    //       href="/settings"
    //       onClick={() => setShowDropdown(false)}
    //       className="w-full flex items-center px-4 py-3 text-sm text-gray-700 
    //                dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700
    //                border-b border-gray-200 dark:border-gray-700"
    //     >
    //       <svg 
    //         className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" 
    //         fill="none" 
    //         stroke="currentColor" 
    //         viewBox="0 0 24 24"
    //       >
    //         <path 
    //           strokeLinecap="round" 
    //           strokeLinejoin="round" 
    //           strokeWidth={2} 
    //           d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    //         />
    //         <path 
    //           strokeLinecap="round" 
    //           strokeLinejoin="round" 
    //           strokeWidth={2} 
    //           d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
    //         />
    //       </svg>
    //       <span>Settings</span>
    //     </Link>
    //   );
    // }

    return items;
  };

  if (!session) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isSigningIn}
          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 
                   dark:hover:bg-gray-600 transition-colors flex items-center justify-center
                   disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sign in menu"
        >
          <svg 
            className="w-5 h-5 text-gray-500 dark:text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
        </button>

        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                     rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Not signed in
              </p>
            </div>
            {renderMenuItems()}
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 
                       dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {isSigningIn ? (
                <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg 
                  className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16l4-4m0 0l-4-4m4 4H3m5 4v1a3 3 0 003 3h7a3 3 0 003-3V7a3 3 0 00-3-3h-7a3 3 0 00-3 3v1"
                  />
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-8 h-8 rounded-full overflow-hidden focus:outline-none 
                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                 dark:focus:ring-offset-gray-900"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            className="w-full h-full object-cover"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || '?'}
          </div>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                   rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {session.user?.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {session.user?.email}
            </p>
          </div>
          {renderMenuItems()}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 
                     dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 
                     transition-colors"
          >
            <svg 
              className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
} 