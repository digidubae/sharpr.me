'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Subject, Category, VisitedSpace } from '@/types';
import { useSession } from 'next-auth/react';
import { fetchWithAuth } from '@/utils/api';

export interface SubjectContextType {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  title: string;
  setTitle: (title: string) => void;
  hideCompleted: boolean;
  setHideCompleted: (hide: boolean) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  addVisitedSpace: (space: VisitedSpace) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  recoverFromSnapshot: (snapshotUrl: string) => Promise<void>;
  isInLibrary: boolean;
  setIsInLibrary: (isInLibrary: boolean) => void;
  isExample?: boolean;
  getAllTags: () => string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addSubject: (subject: Omit<Subject, 'order'>) => void;
  updateSubject: (id: number, updates: Partial<Subject>) => void;
  reorderSubjects: (sourceIndex: number, destinationIndex: number) => void;
  deleteSubject: (id: number) => void;
  toggleHideCompleted: () => void;
  isSyncing: boolean;
  setIsSyncing: (isSyncing: boolean) => void;
}

interface SubjectProviderProps {
  children: React.ReactNode;
  initialData?: {
    id: string;
    title: string;
    subjects: Subject[];
    categories: Category[];
    isExample?: boolean;
  };
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export function SubjectProvider({ children, initialData }: SubjectProviderProps) {
  const { id } = useParams();
  const [subjects, setSubjects] = useState<Subject[]>(initialData?.subjects || []);
  const [title, setTitle] = useState(initialData?.title || 'Sharpr.me');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [categories, setCategories] = useState<Category[]>(initialData?.categories || []);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const { data: session } = useSession();
  const isExample = initialData?.isExample;

  // Check library status when component mounts
  useEffect(() => {
    const checkLibraryStatus = async () => {
      if (!isExample && session?.user && id) {
        try {
          const response = await fetchWithAuth('/api/library');
          if (response.ok) {
            const library = await response.json();
            setIsInLibrary(library.some((item: any) => item.id === id));
          }
        } catch (error) {
          console.error('Error checking library status:', error);
        }
      }
    };

    checkLibraryStatus();
  }, [session, id, isExample]);

  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    subjects.forEach(subject => {
      subject.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  }, [subjects]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const addSubject = useCallback((subject: Omit<Subject, 'order'>) => {
    setSubjects(prev => {
      const maxOrder = prev.reduce((max, s) => Math.max(max, s.order), 0);
      return [...prev, { ...subject, order: maxOrder + 1 }];
    });
  }, []);

  const updateSubject = useCallback((id: number, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(subject => 
      subject.id === id ? { ...subject, ...updates } : subject
    ));
  }, []);

  const reorderSubjects = useCallback((sourceIndex: number, destinationIndex: number) => {
    setSubjects(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      
      // Update order values
      return result.map((subject, index) => ({
        ...subject,
        order: index + 1
      }));
    });
  }, []);

  const addVisitedSpace = useCallback(() => {
    if (isExample || !id) return;

    const visitedSpaces = JSON.parse(localStorage.getItem('visitedSpaces') || '[]');
    const existingSpaceIndex = visitedSpaces.findIndex((space: any) => space.id === id);

    if (existingSpaceIndex !== -1) {
      // Update existing space
      visitedSpaces[existingSpaceIndex] = {
        ...visitedSpaces[existingSpaceIndex],
        title,
        lastVisited: Date.now()
      };
    } else {
      // Add new space
      visitedSpaces.push({
        id,
        title,
        lastVisited: Date.now()
      });
    }

    // Sort by last visited and pinned status
    visitedSpaces.sort((a: any, b: any) => {
      // Pinned items always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by last visited
      return b.lastVisited - a.lastVisited;
    });

    // Keep only the last 10 spaces
    const maxSpaces = 10;
    if (visitedSpaces.length > maxSpaces) {
      // Keep pinned spaces and remove oldest unpinned spaces
      const pinnedSpaces = visitedSpaces.filter((space: any) => space.isPinned);
      const unpinnedSpaces = visitedSpaces
        .filter((space: any) => !space.isPinned)
        .slice(0, maxSpaces - pinnedSpaces.length);
      visitedSpaces.length = 0;
      visitedSpaces.push(...pinnedSpaces, ...unpinnedSpaces);
    }

    localStorage.setItem('visitedSpaces', JSON.stringify(visitedSpaces));
  }, [id, title, isExample]);

  const recoverFromSnapshot = useCallback(async (data: any) => {
    try {
      setTitle(data.title || '');
      setSubjects(data.subjects || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error recovering from snapshot:', error);
    }
  }, []);

  const deleteSubject = useCallback((id: number) => {
    setSubjects(prev => prev.filter(subject => subject.id !== id));
  }, []);

  const toggleHideCompleted = useCallback(() => {
    setHideCompleted(prev => !prev);
  }, []);

  const contextValue: SubjectContextType = {
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
    isExample: initialData?.isExample,
    getAllTags,
    selectedTags,
    toggleTag,
    searchQuery,
    setSearchQuery,
    addSubject,
    updateSubject,
    reorderSubjects,
    deleteSubject,
    toggleHideCompleted,
    isSyncing,
    setIsSyncing
  };

  return (
    <SubjectContext.Provider value={contextValue}>
      {children}
    </SubjectContext.Provider>
  );
}

export function useSubjects() {
  const context = useContext(SubjectContext);
  if (context === undefined) {
    throw new Error('useSubjects must be used within a SubjectProvider');
  }
  return context;
} 