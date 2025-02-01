'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';

// const CACHE_KEY = 'sharpr-cache';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const queryClientRef = useRef<QueryClient>();
  
  useEffect(() => {
    // Initialize with data from localStorage if available
    if (!queryClientRef.current) {
      queryClientRef.current = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: false
          },
        },
      });

      // Try to restore cache from localStorage
      // const cache = localStorage.getItem(CACHE_KEY);
      // if (cache) {
      //   try {
      //     const parsedCache = JSON.parse(cache);
      //     queryClientRef.current.setQueryData(['spaces'], parsedCache.spaces);
      //   } catch (e) {
      //     console.error('Failed to parse cache:', e);
      //   }
      // }
    }
    setMounted(true);
  }, []);

  // Save cache to localStorage when it changes
  useEffect(() => {
    if (!queryClientRef.current) return;

    // const saveCache = () => {
    //   const spaces = queryClientRef.current?.getQueryData(['spaces']);
    //   if (spaces) {
    //     localStorage.setItem(CACHE_KEY, JSON.stringify({ spaces }));
    //   }
    // };

    // Save cache before page unload
    // window.addEventListener('beforeunload', saveCache);
    // return () => window.removeEventListener('beforeunload', saveCache);
  }, []);

  if (!mounted || !queryClientRef.current) return null;

  return (
    <QueryClientProvider client={queryClientRef.current}>{children}</QueryClientProvider>
  );
} 