import { signIn, signOut } from 'next-auth/react';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && requireAuth) {
      // Try to refresh the session
      const result = await signIn('google', { redirect: false });
      
      if (result?.ok) {
        // Retry the original request after refresh
        const retryResponse = await fetch(url, fetchOptions);
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
  }
} 