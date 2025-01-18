import { signIn, signOut } from 'next-auth/react';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

// Create a request queue to manage concurrent requests
const requestQueue: Map<string, Promise<Response>> = new Map();

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options;
  // Create a unique key for this request
  const requestKey = JSON.stringify({ url, ...fetchOptions });

  // If there's already a request in progress for this exact URL + options, return that promise
  const existingRequest = requestQueue.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Cache-Control': 'no-store',
        },
      });

      console.log(`fetchWithAuth: ${url} response: ${response.status}`, options);

      if (response.status === 401 && requireAuth) {
        // Try to refresh the session
        const result = await signIn('google', { redirect: false });
        
        if (result?.ok) {
          // Retry the original request after refresh
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              'Cache-Control': 'no-store',
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
      // Remove this request from the queue when it's done
      requestQueue.delete(requestKey);
    }
  })();

  // Add the request to the queue
  requestQueue.set(requestKey, requestPromise);

  return requestPromise;
} 