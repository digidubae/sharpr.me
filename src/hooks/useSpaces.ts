import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/api';
import { useSession } from 'next-auth/react';
import { Space } from '@/types';




const SPACES_QUERY_KEY = 'spaces';
// const CACHE_KEY = 'sharpr-cache';

export function useSpaces() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data: spaces = [], isLoading, error } = useQuery<Space[]>({
    queryKey: [SPACES_QUERY_KEY],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth('/api/library');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch spaces');
        }

        // Update both caches
        // localStorage.setItem(CACHE_KEY, JSON.stringify({ spaces: data }));
        queryClient.setQueryData([SPACES_QUERY_KEY], data);
        
        return data;
      } catch (error) {
        console.error('Error fetching spaces:', error);
        throw error;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!session?.user,
    retry: false,
    initialData: () => {
      // try {
      //   const cache = localStorage.getItem(CACHE_KEY);
      //   if (cache) {
      //     const { spaces } = JSON.parse(cache);
      //     return spaces;
      //   }
      // } catch (e) {
      //   console.error('Failed to parse cache:', e);
      // }
      return queryClient.getQueryData([SPACES_QUERY_KEY]);
    }
  });

  const invalidateSpaces = async () => {
    // Clear both caches
    // localStorage.removeItem(CACHE_KEY);
    queryClient.removeQueries({ queryKey: [SPACES_QUERY_KEY] });
    
    // Force an immediate refetch
    const newData = await queryClient.fetchQuery({
      queryKey: [SPACES_QUERY_KEY],
      queryFn: async () => {
        const response = await fetchWithAuth('/api/library');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch spaces');
        }
        return data;
      }
    });

    // Update both caches with new data
    // localStorage.setItem(CACHE_KEY, JSON.stringify({ spaces: newData }));
    queryClient.setQueryData([SPACES_QUERY_KEY], newData);
  };

  return {
    spaces,
    isLoading: isLoading && !spaces?.length,
    error,
    invalidateSpaces
  };
} 