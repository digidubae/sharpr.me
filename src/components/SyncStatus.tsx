'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSubjects } from '@/context/SubjectContext';
import { fetchWithAuth } from '@/utils/api';
import { toast } from 'react-hot-toast';

type SyncState = 'idle' | 'syncing' | 'error';

export default function SyncStatus() {
  const { id } = useParams();
  const { 
    subjects, 
    title, 
    categories,
    isSyncing,
    setIsSyncing
  } = useSubjects();
  const [syncState, setSyncState] = useState<SyncState>('idle');

  // Use a ref to track the last saved data
  const lastSavedDataRef = useRef<string>('');
  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  // Use a ref to store the latest data for retry
  const latestDataRef = useRef<string>('');

  // Add beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncing) {
        e.preventDefault();
        e.returnValue = 'Changes you made may not be saved. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing]);

  const saveData = async (data: string) => {
    setIsSyncing(true);
    setSyncState('syncing');
    try {
      // Save the space data
      console.log(`saving space data..`)
      const spaceResponse = await fetchWithAuth(`/api/subjects?id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data
      });

      if (!spaceResponse.ok) {
        throw new Error(`Failed to save space data: ${spaceResponse.statusText}`);
      }

      // Update last saved data reference
      lastSavedDataRef.current = data;
      setSyncState('idle');

      // Create snapshot
      try {
        const snapshotData = {
          spaceId: id,
          data: JSON.parse(data)
        };
        
        const snapshotResponse = await fetchWithAuth('/api/snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshotData)
        });

        const responseText = await snapshotResponse.text();

        if (!snapshotResponse.ok) {
          let errorDetails;
          try {
            errorDetails = JSON.parse(responseText);
          } catch {
            errorDetails = { error: responseText };
          }
          throw new Error(`Snapshot creation failed: ${JSON.stringify(errorDetails)}`);
        }

        const result = responseText ? JSON.parse(responseText) : {};
        // console.log('Snapshot created successfully:', result);
      } catch (error) {
        console.error('Snapshot creation error:', error);
        const err = error as Error;
        if (err instanceof Error) {
          console.error('Full snapshot error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
          });
        }
        toast.error('Failed to create snapshot. Your changes are saved but backup failed.');
      }
    } catch (error) {
      console.error('Space sync error:', error);
      setSyncState('error');
      toast.error('Failed to sync changes');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Skip saving on initial mount
    if (isInitialMount.current) {
      // Set initial data reference
      const initialData = JSON.stringify({ id, title, subjects, categories });
      lastSavedDataRef.current = initialData;
      latestDataRef.current = initialData;
      isInitialMount.current = false;
      return;
    }

    let isStale = false;

    const initiateSync = () => {
      if (isStale) return;

      // Create a string representation of current data
      const currentData = JSON.stringify({ id, title, subjects, categories });
      latestDataRef.current = currentData;

      // If this exact data was just saved, skip
      if (currentData === lastSavedDataRef.current) {
        return;
      }

      saveData(currentData);
    };

    const debouncedSave = setTimeout(initiateSync, 1000);
    
    return () => {
      isStale = true;
      clearTimeout(debouncedSave);
    };
  }, [id, subjects, title, categories, setIsSyncing]);

  const handleRetry = () => {
    if (syncState === 'error' && latestDataRef.current) {
      saveData(latestDataRef.current);
    }
  };

  return (
    <div className="fixed top-4 left-4">
      {syncState === 'syncing' ? (
        <svg 
          className="w-5 h-5 text-blue-500 animate-spin" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      ) : syncState === 'error' ? (
        <button 
          onClick={handleRetry}
          className="text-red-500 hover:text-red-600 transition-colors"
          title="Click to retry sync"
        >
          <svg 
            className="w-5 h-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </button>
      ) : (
        <svg 
          className="w-5 h-5 text-green-500" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
} 