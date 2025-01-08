'use client';

import { useRef, useEffect, useState } from 'react';
import { useDialog } from '@/context/DialogContext';

interface Snapshot {
  url: string;
  timestamp: string;
  filename: string;
}

interface RecoverSnapshotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (snapshotUrl: string) => void;
  spaceId: string;
}

export default function RecoverSnapshotDialog({ isOpen, onClose, onConfirm, spaceId }: RecoverSnapshotDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveringSnapshot, setRecoveringSnapshot] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshots = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching snapshots for spaceId:', spaceId);
        const response = await fetch(`/api/snapshots/${spaceId}`);
        console.log('Snapshot list API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Snapshot list API error:', errorData);
          throw new Error('Failed to fetch snapshots');
        }
        
        const data = await response.json();
        console.log('Received snapshots data:', data);
        setSnapshots(data.snapshots || []);
      } catch (error) {
        console.error('Error fetching snapshots:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch snapshots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshots();
  }, [isOpen, spaceId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleSnapshotRecover = async (snapshotUrl: string) => {
    setRecoveringSnapshot(snapshotUrl);
    try {
      await onConfirm(snapshotUrl);
    } finally {
      setRecoveringSnapshot(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Recover from Snapshot</h2>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading snapshots...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-300">No snapshots available</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.url}
                onClick={() => handleSnapshotRecover(snapshot.url)}
                disabled={recoveringSnapshot !== null}
                className={`w-full p-2 border rounded-lg dark:border-gray-700 hover:bg-gray-50 
                       dark:hover:bg-gray-700 transition-colors text-left relative
                       ${recoveringSnapshot === snapshot.url ? 'opacity-50' : ''}`}
              >
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(snapshot.timestamp).toLocaleString()}
                </div>
                {recoveringSnapshot === snapshot.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 dark:bg-opacity-20 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={recoveringSnapshot !== null}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                   dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 