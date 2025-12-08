'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSubjects } from '@/context/SubjectContext';
import { fetchWithAuth } from '@/utils/api';
import { toast } from 'react-hot-toast';
import { encryptData, decryptData } from '@/utils/encryption';

export default function SyncStatus() {
  const { id } = useParams();
  const { 
    subjects, 
    title, 
    categories,
    isSyncing,
    setIsSyncing,
    syncState,
    setSyncState,
    isLocked,
    isExample,
    autoSync,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    manualSaveTrigger
  } = useSubjects();

  // Use a ref to track the last saved data
  const lastSavedDataRef = useRef<string>('');
  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  // Use a ref to store the latest data for retry
  const latestDataRef = useRef<string>('');

  // Add beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncing || hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Changes you made may not be saved. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing, hasUnsavedChanges]);

  const saveData = useCallback(async (data: string) => {
    setIsSyncing(true);
    setSyncState('syncing');
    try {
      // Parse the current data
      const currentData = JSON.parse(data);

      // If the space is locked, we need to encrypt the data
      let dataToSave = currentData;
      if (isLocked) {
        // Get the password from sessionStorage (temporarily stored during decryption)
        const password = sessionStorage.getItem(`space-${id}-password`);
        if (!password) {
          throw new Error('No encryption password found');
        }

        // Re-encrypt the updated data
        const dataToEncrypt = {
          subjects: currentData.subjects,
          categories: currentData.categories
        };
        const encryptedData = await encryptData(dataToEncrypt, password);

        // Prepare the space data with encrypted content
        dataToSave = {
          ...currentData,
          subjects: [], // Empty because it's encrypted
          categories: [], // Empty because it's encrypted
          isLocked: true,
          encryptedData
        };
      }

      // Save the space data
      console.log(`saving space data..`)
      const spaceResponse = await fetchWithAuth(`/api/subjects?id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      if (!spaceResponse.ok) {
        throw new Error(`Failed to save space data: ${spaceResponse.statusText}`);
      }

      // Update last saved data reference
      lastSavedDataRef.current = JSON.stringify(dataToSave);
      
      // Set sync state to idle after successful save
      setSyncState('idle');
      setIsSyncing(false);

      // Create snapshot after successful save, but don't wait for it
      const createSnapshot = async () => {
        try {
          console.log("Creating snapshot...");
          const snapshotData = {
            spaceId: id,
            data: dataToSave
          };
          
          const snapshotResponse = await fetchWithAuth('/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snapshotData)
          });

          if (!snapshotResponse.ok) {
            throw new Error('Failed to create snapshot');
          }
        } catch (error) {
          console.error('Snapshot creation error:', error);
          toast.error('Failed to create snapshot. Your changes are saved but backup failed');
        }
      };

      // Fire and forget snapshot creation
      createSnapshot();

    } catch (error) {
      console.error('Space sync error:', error);
      setSyncState('error');
      toast.error('Failed to sync changes');
    } finally {
      setIsSyncing(false);
    }
    // Clear unsaved changes flag after successful save
    setHasUnsavedChanges(false);
  }, [id, isLocked, setIsSyncing, setSyncState, setHasUnsavedChanges]);

  // Track data changes and update unsaved state
  useEffect(() => {
    console.log('SyncStatus useEffect');
    // Skip on initial mount
    if (isInitialMount.current) {
      // Set initial data reference
      const initialData = JSON.stringify({ id, title, subjects, categories });
      lastSavedDataRef.current = initialData;
      latestDataRef.current = initialData;
      isInitialMount.current = false;
      return;
    }

    // Create a string representation of current data
    const currentData = JSON.stringify({ id, title, subjects, categories });
    latestDataRef.current = currentData;

    // Check if data has changed from last saved
    const hasChanges = currentData !== lastSavedDataRef.current;
    
    if (isExample) return;

    // If autoSync is enabled, save automatically
    if (autoSync) {
      if (!hasChanges) {
        console.log('SyncStatus useEffect - skipping save - data unchanged');
        return;
      }

      let isStale = false;
      const debouncedSave = setTimeout(() => {
        if (!isStale) {
          console.log('SyncStatus useEffect - auto-saving data');
          saveData(currentData);
        }
      }, 100);
      
      return () => {
        isStale = true;
        clearTimeout(debouncedSave);
      };
    } else {
      // Manual sync mode - just track unsaved changes
      setHasUnsavedChanges(hasChanges);
    }
  }, [id, subjects, title, categories, isExample, saveData, autoSync, setHasUnsavedChanges]);

  // Handle manual save trigger
  useEffect(() => {
    if (manualSaveTrigger > 0 && !autoSync && latestDataRef.current) {
      console.log('SyncStatus - manual save triggered');
      saveData(latestDataRef.current);
    }
  }, [manualSaveTrigger, autoSync, saveData]);

  // Skip syncing for example spaces
  if (isExample) {
    return null;
  }

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