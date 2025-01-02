'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SubjectList from "@/components/SubjectList";
import AddSubjectForm from "@/components/AddSubjectForm";
import SearchBar from "@/components/SearchBar";
import Shimmer from './Shimmer';
import { useSubjects } from "@/context/SubjectContext";
import { saveAs } from 'file-saver';
import DeleteSpaceDialog from './DeleteSpaceDialog';
import SwitchSpaceDialog from './SwitchSpaceDialog';
import { VisitedSpace, Category } from '@/types';
import RecoverSnapshotDialog from './RecoverSnapshotDialog';
import { useSession } from 'next-auth/react';
import { Editor } from '@tinymce/tinymce-react';
import LoadTime from './LoadTime';
import { toast } from 'react-hot-toast';
import SyncStatus from './SyncStatus';
import { fetchWithAuth } from '@/utils/api';

interface ImportedSubject {
  id: number;
  content: string;
  tags: string[];
  createdAt: string;
  completed: boolean;
  images: string[];
  order: number;
}

interface ImportedData {
  subjects: ImportedSubject[];
  title: string;
  categories: Category[];
}

const EXAMPLE_TYPES: { [key: string]: string } = {
  'personal': 'personal.json',
  'study': 'study.json',
  'project': 'project.json'
};

export default function Home() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteSpaceDialog, setShowDeleteSpaceDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { 
    subjects, 
    setSubjects, 
    title, 
    setTitle, 
    hideCompleted,
    setHideCompleted,
    sortOption,
    setSortOption,
    addVisitedSpace, 
    categories,
    setCategories,
    recoverFromSnapshot,
    isInLibrary,
    setIsInLibrary,
    isExample
  } = useSubjects();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showSwitchSpaceDialog, setShowSwitchSpaceDialog] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load example data if needed
  useEffect(() => {
    const loadExampleData = async () => {
      if (id?.toString().endsWith('-example')) {
        try {
          const exampleType = id.toString().split('-')[0] || 'work';
          const exampleFile = EXAMPLE_TYPES[exampleType] || EXAMPLE_TYPES['work'];
          
          const example = await import(`@/data/examples/${exampleFile}`);
          setTitle(example.title);
          setSubjects(example.subjects.map((subject: ImportedSubject) => ({
            ...subject,
            id: Date.now() + Math.random(),
          })));
          setHideCompleted(example.hideCompleted);
          setSortOption('manual');
        } catch (error) {
          console.error('Error loading example:', error);
        }
      }
      setIsLoading(false);
    };

    loadExampleData();
  }, [id]);

  const handleTitleDoubleClick = () => {
    if (!isExample) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      if (titleInputRef.current) {
        titleInputRef.current.value = title;
      }
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleExport = () => {
    const exportData = {
      title,
      subjects,
      categories
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.json`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        throw new Error('Please select a file to import');
      }

      const jsonContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (typeof event.target?.result !== 'string') {
            reject(new Error('Failed to read file'));
            return;
          }
          resolve(event.target.result);
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const importedData = JSON.parse(jsonContent);
      await handleImport(importedData);

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import space data.');
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleImport = async (data: any) => {
    try {
      if (!id) {
        throw new Error('Space ID is required');
      }

      setIsImporting(true);

      // Handle different types of id from useParams
      const spaceId = typeof id === 'object' && 'id' in id ? id.id : id;
      
      if (!data.title) {
        throw new Error('Invalid import data structure');
      }

      // Sanitize the imported data
      const sanitizedData = {
        id: spaceId,
        title: data.title,
        subjects: (data.subjects || []).map((subject: ImportedSubject) => ({
          id: subject.id,
          content: subject.content || '',
          tags: Array.isArray(subject.tags) ? subject.tags : [],
          createdAt: subject.createdAt || new Date().toISOString(),
          completed: Boolean(subject.completed),
          images: Array.isArray(subject.images) ? subject.images : [],
          order: typeof subject.order === 'number' ? subject.order : 0
        })),
        categories: (data.categories || []).map((category: Category) => ({
          id: category.id || crypto.randomUUID(),
          name: category.name || '',
          tags: Array.isArray(category.tags) ? category.tags : []
        }))
      };

      console.log('Importing data:', sanitizedData);

      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to save imported data');
      }

      // Update the UI with the sanitized data
      setTitle(sanitizedData.title);
      setSubjects(sanitizedData.subjects);
      setCategories(sanitizedData.categories);
      
      toast.success('Data imported successfully', {
        style: {
          background: '#10B981',
          color: '#fff'
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981'
        }
      });
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import space data.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteSpace = async () => {
    try {
      if (!id) {
        throw new Error('Space ID is required');
      }

      // Handle different types of id from useParams
      const spaceId = typeof id === 'object' && 'id' in id ? id.id : id;

      const response = await fetchWithAuth(`/api/spaces/${spaceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to delete space');
      }

      router.push('/');
    } catch (error) {
      console.error('Delete space error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete space');
      throw error; // Re-throw to be caught by the DeleteSpaceDialog
    }
  };

  const handleRecoverSnapshot = async (snapshotUrl: string) => {
    try {
      if (!id) {
        throw new Error('Space ID is required');
      }

      const spaceId = typeof id === 'object' && 'id' in id ? id.id : id;
      
      // First fetch the snapshot data
      const response = await fetch(`/api/snapshots/${spaceId}?url=${encodeURIComponent(snapshotUrl)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch snapshot');
      }
      
      const snapshotData = await response.json();
      console.log('Received snapshot data:', snapshotData);

      // Extract data from the snapshot
      const recoveredData = {
        title: snapshotData.title || title, // Use current title as fallback
        subjects: snapshotData.subjects || [],
        categories: snapshotData.categories || []
      };
      
      // Validate the recovered data
      if (!recoveredData.title) {
        throw new Error('Invalid snapshot data: missing title');
      }

      // Prepare the data for saving
      const sanitizedData = {
        id: spaceId,
        title: recoveredData.title,
        subjects: recoveredData.subjects.map((subject: ImportedSubject) => ({
          id: subject.id || Date.now() + Math.random(),
          content: subject.content || '',
          tags: Array.isArray(subject.tags) ? subject.tags : [],
          createdAt: subject.createdAt || new Date().toISOString(),
          completed: Boolean(subject.completed),
          images: Array.isArray(subject.images) ? subject.images : [],
          order: typeof subject.order === 'number' ? subject.order : 0
        })),
        categories: recoveredData.categories.map((category: Category) => ({
          id: category.id || crypto.randomUUID(),
          name: category.name || '',
          tags: Array.isArray(category.tags) ? category.tags : []
        }))
      };

      console.log('Sanitized data for saving:', sanitizedData);

      // Save the recovered data
      const saveResponse = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData)
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || 'Failed to save recovered data');
      }

      // Update the UI
      setTitle(sanitizedData.title);
      setSubjects(sanitizedData.subjects);
      setCategories(sanitizedData.categories);
      
      setShowRecoverDialog(false);
      toast.success('Snapshot recovered successfully');
    } catch (error) {
      console.error('Error recovering snapshot:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recover snapshot');
    }
  };

  const handleLibraryToggle = undefined;

  if (isLoading || isImporting) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Shimmer message={isImporting ? 'Importing space...' : 'Loading space...'} />
        </div>
        <LoadTime />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-space-loaded={!isLoading}>
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {!isExample && <SyncStatus />}
          <header className="mb-12 text-center relative">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                defaultValue={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl font-bold text-center bg-transparent border-b-2 
                 border-gray-300 dark:border-gray-600 outline-none dark:text-white"
                maxLength={50}
              />
            ) : (
              <h1 
                className={`text-3xl font-bold mb-4 ${!isExample ? 'cursor-pointer hover:opacity-80' : ''}`}
                onDoubleClick={handleTitleDoubleClick}
              >
                {title}
              </h1>
            )}
            {!isExample && (
              <div className="absolute right-0 top-0" ref={dropdownRef}>
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 text-gray-600 hover:text-gray-900 
                     dark:text-gray-400 dark:hover:text-gray-100"
                  title="More options"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => {
                          document.getElementById('import-file')?.click();
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                           hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Import</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleExport();
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                           hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowRecoverDialog(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                           hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Recover Snapshot</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowSwitchSpaceDialog(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                           hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Switch Space</span>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setShowDeleteSpaceDialog(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Space</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </header>
          
          <main className="space-y-8">
            <SearchBar />
            <AddSubjectForm />
            <SubjectList readOnly={false} preventSync={isExample} />
          </main>

          {!isExample && (
            <>
              <DeleteSpaceDialog
                isOpen={showDeleteSpaceDialog}
                onClose={() => setShowDeleteSpaceDialog(false)}
                onConfirm={handleDeleteSpace}
              />

              <SwitchSpaceDialog
                isOpen={showSwitchSpaceDialog}
                onClose={() => setShowSwitchSpaceDialog(false)}
              />

              <RecoverSnapshotDialog
                isOpen={showRecoverDialog}
                onClose={() => setShowRecoverDialog(false)}
                onConfirm={handleRecoverSnapshot}
                spaceId={id as string}
              />
            </>
          )}
        </div>
      </div>
      <LoadTime />
    </div>
  );
} 