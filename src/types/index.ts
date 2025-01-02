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
}

export interface LibrarySpace {
  id: string;
  title: string;
  addedAt: number;
  userId: string;
  isPinned?: boolean;
} 