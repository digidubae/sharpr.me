export interface Space {
  id: string;
  title: string;
  addedAt: number;
  userId: string;
  isPinned?: boolean;
}

export interface SubjectContextType {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  title: string;
  setTitle: (title: string) => void;
  hideCompleted: boolean;
  setHideCompleted: (hideCompleted: boolean) => void;
  sortOption: string;
  setSortOption: (sortOption: string) => void;
  addVisitedSpace: (space: VisitedSpace) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  recoverFromSnapshot: (snapshotUrl: string) => Promise<void>;
  isInLibrary: boolean;
  setIsInLibrary: (isInLibrary: boolean) => void;
  isExample?: boolean;
  getAllTags: () => string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
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
  syncState: 'idle' | 'syncing' | 'error';
  setSyncState: (state: 'idle' | 'syncing' | 'error') => void;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
  rawData?: any;
}

export interface VisitedSpace {
  id: string;
  title: string;
  lastVisited: number;
  isPinned?: boolean;
}

export interface Category {
  id: string;
  name: string;
  tags: string[];
}

export interface ImportedData {
  subjects: Subject[];
  title: string;
  categories: Category[];
  isExample?: boolean;
}

export interface Subject {
  id: number;
  content: string;
  textContent: string;
  tags: string[];
  createdAt: string;
  completed: boolean;
  images: string[];
  order: number;
  isPinned?: boolean;
  reminderDate?: string;
}

export interface LibrarySpace {
  id: string;
  title: string;
  addedAt: number;
  userId: string;
  isPinned?: boolean;
}

export interface SubjectProviderProps {
  children: React.ReactNode;
  initialData?: {
    id: string;
    title: string;
    subjects: Subject[];
    categories: Category[];
    isExample?: boolean;
    needsDecryption?: boolean;
    encryptedData?: string;
    isLocked?: boolean;
    rawData?: any;
  };
}

export interface SpaceData {
  id: string;
  title: string;
  subjects: Subject[];
  categories: Category[];
  isLocked?: boolean;
  encryptedData?: string;
}

export interface LibraryItem {
  isPinned?: boolean;
}

export interface StorageProvider {
  // Space data operations
  getSpace: (id: string) => Promise<SpaceData | null>;
  saveSpace: (id: string, data: Partial<SpaceData>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  listSpaces: () => Promise<string[]>;
  
  // Library operations
  updateLibraryItem: (userId: string, spaceId: string, data: LibraryItem) => Promise<void>;
  
  // Snapshot operations
  createSnapshot: (spaceId: string, data: ImportedData) => Promise<string>;
  listSnapshots: (spaceId: string) => Promise<string[]>;
  deleteAllSnapshots: (spaceId: string) => Promise<void>;
  getSnapshotData: (fileId: string) => Promise<any>;
}

export interface ImportedSubject {
  id: number;
  content: string;
  tags: string[];
  createdAt: string;
  completed: boolean;
  images: string[];
  order: number;
}