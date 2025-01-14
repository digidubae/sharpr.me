import { signIn, signOut } from 'next-auth/react';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

// Create a global AbortController instance
let globalAbortController: AbortController | null = null;

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options;

  // Cancel any pending requests
  if (globalAbortController) {
    globalAbortController.abort();
  }

  // Create a new AbortController for this request
  globalAbortController = new AbortController();
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: globalAbortController.signal,
      headers: {
        ...fetchOptions.headers,
        'Connection': 'keep-alive',
      },
    });

    if (response.status === 401 && requireAuth) {
      // Try to refresh the session
      const result = await signIn('google', { redirect: false });
      
      if (result?.ok) {
        // Retry the original request after refresh
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          signal: globalAbortController.signal,
          headers: {
            ...fetchOptions.headers,
            'Connection': 'keep-alive',
          },
        });
        if (retryResponse.ok) {
          return retryResponse;
        }
      }
      
      // If we still get an error after refresh, sign out
      await signOut({ redirect: false });
      window.location.href = '/api/auth/signin';
      throw new Error('Session expired. Please sign in again.');
    }

    // Handle insufficient permissions
    if (response.status === 403) {
      const data = await response.json();
      if (data.code === 'INSUFFICIENT_PERMISSIONS') {
        window.location.href = '/permissions';
      }
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  } finally {
    // Clear the AbortController reference after the request is complete
    if (globalAbortController) {
      globalAbortController = null;
    }
  }
} 