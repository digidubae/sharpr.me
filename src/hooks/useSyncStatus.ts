import { useState } from 'react';
import { useSubjects } from '@/context/SubjectContext';

type SyncState = 'idle' | 'syncing' | 'error';

export function useSyncStatus() {
  const { setIsSyncing } = useSubjects();
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const startSync = () => {
    setIsSyncing(true);
    setSyncState('syncing');
  };

  const endSync = (success: boolean = true) => {
    setSyncState(success ? 'idle' : 'error');
    setIsSyncing(false);
  };

  return {
    syncState,
    startSync,
    endSync
  };
} 