'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDialog } from '@/context/DialogContext';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LibrarySpace } from '@/types';
import SpaceCard from './SpaceCard';
import { fetchWithAuth } from '@/utils/api';
import { useSubjects } from '@/context/SubjectContext';

interface SwitchSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SwitchSpaceDialog({ isOpen, onClose }: SwitchSpaceDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const { setIsDialogOpen } = useDialog();
  const { id: currentSpaceId } = useParams();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { data: session } = useSession();
  const [librarySpaces, setLibrarySpaces] = useState<LibrarySpace[]>([]);
  const { isSyncing } = useSubjects();
  const [isLoading, setIsLoading] = useState(false);

  const handleSpaceSwitch = useCallback(async (spaceId: string) => {
    router.push(`/s/${spaceId}`);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen, setIsDialogOpen]);

  // Fetch library spaces when dialog opens and user is signed in
  useEffect(() => {
    if (isOpen && session?.user && !hasLoadedRef.current) {
      setIsLoading(true);
      hasLoadedRef.current = true;
      fetchWithAuth('/api/library')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLibrarySpaces(data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (!session) {
      setLibrarySpaces([]);
      setIsLoading(false);
      hasLoadedRef.current = false;
    }
  }, [isOpen, session]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      e.stopPropagation();

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            if (prev === null) return 0;
            return Math.min(prev + 1, librarySpaces.length - 1);
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            if (prev === null) return null;
            return Math.max(prev - 1, 0);
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex !== null && !isSyncing) {
            handleSpaceSwitch(librarySpaces[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, librarySpaces, selectedIndex, handleSpaceSwitch, isSyncing]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4">Switch Space</h2>
        
        <div className="space-y-3 mb-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ))}
            </>
          ) : (
            <>
              {librarySpaces
                .sort((a: LibrarySpace, b: LibrarySpace) => {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return b.addedAt - a.addedAt;
                })
                .map((space, index) => {
                  const isCurrentSpace = space.id === currentSpaceId;

                  return (
                    <SpaceCard
                      key={space.id}
                      id={space.id}
                      title={space.title}
                      lastVisited={space.addedAt}
                      isPinned={space.isPinned}
                      isSelected={selectedIndex === index}
                      onSelect={isCurrentSpace || isSyncing ? undefined : setSelectedIndex}
                      onDelete={async (id, e) => {
                        if (isCurrentSpace || isSyncing) return;
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const response = await fetchWithAuth('/api/library', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ spaceId: id })
                          });
                          
                          if (response.ok) {
                            setLibrarySpaces(prev => prev.filter(s => s.id !== id));
                          }
                        } catch (error) {
                          console.error('Error removing from library:', error);
                        }
                      }}
                      onPin={async (id, e) => {
                        if (isCurrentSpace || isSyncing) return;
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const updatedSpaces = librarySpaces.map(s => 
                            s.id === id ? { ...s, isPinned: !s.isPinned } : s
                          );
                          setLibrarySpaces(updatedSpaces);
                          
                          await fetchWithAuth('/api/library/pin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              spaceId: id, 
                              isPinned: updatedSpaces.find(s => s.id === id)?.isPinned 
                            })
                          });
                        } catch (error) {
                          console.error('Error toggling pin status:', error);
                          setLibrarySpaces(librarySpaces); // Revert on error
                        }
                      }}
                      index={index}
                      onClick={isCurrentSpace || isSyncing ? undefined : handleSpaceSwitch}
                      section="library"
                      disabled={isCurrentSpace || isSyncing}
                      showActions={true}
                    />
                  );
                })}
              {librarySpaces.length === 0 && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No spaces in your library
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                     dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 