"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useParams } from "next/navigation";
import {
  Subject,
  Category,
  VisitedSpace,
  SubjectContextType,
  SubjectProviderProps,
} from "@/types";
import { useSession } from "next-auth/react";
import { fetchWithAuth } from "@/utils/api";

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export function SubjectProvider({
  children,
  initialData,
}: SubjectProviderProps) {
  const { id } = useParams();
  const [subjects, setSubjects] = useState<Subject[]>(
    initialData?.subjects || []
  );
  const [title, setTitle] = useState(initialData?.title || "Sharpr.me");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortOption, setSortOption] = useState("newest");
  const [categories, setCategories] = useState<Category[]>(
    initialData?.categories || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">(
    "idle"
  );
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isLocked, setIsLocked] = useState(initialData?.isLocked || false);
  const { data: session } = useSession();
  const isExample = initialData?.isExample;

  // Check library status when component mounts
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const checkLibraryStatus = async () => {
      if (!isExample && session?.user && id && !isLocked) {
        try {
          const response = await fetchWithAuth("/api/library", {
            signal: abortController.signal,
          });
          if (isMounted && response.ok) {
            const library = await response.json();
            setIsInLibrary(library.some((item: any) => item.id === id));
          }
        } catch (error: any) {
          if (error.name !== 'AbortError' && isMounted) {
            console.error("Error checking library status:", error);
          } else {
            console.log(`checkLibraryStatus: fetch aborted`);
          }
        }
      }
    };

    // Only check library status after decryption is complete
    if (!isLocked) {
      checkLibraryStatus();
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [session, id, isExample, isLocked]);

  useEffect(() => {
    if (id) {
      const key = `hideCompleted_${id}`;
      const saved = localStorage.getItem(key);
      setHideCompleted(saved ? JSON.parse(saved) : false);
    }
  }, [id]);

  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    subjects.forEach((subject) => {
      if (!hideCompleted || !subject.completed) {
        subject.tags.forEach((tag) => allTags.add(tag));
      }
    });
    return Array.from(allTags);
  }, [subjects, hideCompleted]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const isSelected = prev.includes(tag);
      const next = isSelected ? prev.filter((t) => t !== tag) : [...prev, tag];
      if (!isSelected) {
        // Ensure exclusivity with excluded tags
        setExcludedTags((prevExcluded) => prevExcluded.filter((t) => t !== tag));
      }
      return next;
    });
  }, []);

  const toggleExcludedTag = useCallback((tag: string) => {
    setExcludedTags((prev) => {
      const isExcluded = prev.includes(tag);
      const next = isExcluded ? prev.filter((t) => t !== tag) : [...prev, tag];
      if (!isExcluded) {
        // Ensure exclusivity with selected tags
        setSelectedTags((prevSelected) => prevSelected.filter((t) => t !== tag));
      }
      return next;
    });
  }, []);

  const addSubject = useCallback((subject: Omit<Subject, "order">) => {
    setSubjects((prev) => {
      const minOrder = prev.reduce((min, s) => Math.min(min, s.order), 0);
      return [{ ...subject, order: minOrder - 1000 }, ...prev];
    });
  }, []);

  const updateSubject = useCallback((id: number, updates: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, ...updates } : subject
      )
    );
  }, []);

  const reorderSubjects = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      setSubjects((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(sourceIndex, 1);
        result.splice(destinationIndex, 0, removed);

        // Update order values
        return result.map((subject, index) => ({
          ...subject,
          order: index + 1,
        }));
      });
    },
    []
  );

  const addVisitedSpace = useCallback(() => {
    if (isExample || !id) return;

    const visitedSpaces = JSON.parse(
      localStorage.getItem("visitedSpaces") || "[]"
    );
    const existingSpaceIndex = visitedSpaces.findIndex(
      (space: any) => space.id === id
    );

    if (existingSpaceIndex !== -1) {
      // Update existing space
      visitedSpaces[existingSpaceIndex] = {
        ...visitedSpaces[existingSpaceIndex],
        title,
        lastVisited: Date.now(),
      };
    } else {
      // Add new space
      visitedSpaces.push({
        id,
        title,
        lastVisited: Date.now(),
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

    localStorage.setItem("visitedSpaces", JSON.stringify(visitedSpaces));
  }, [id, title, isExample]);

  const recoverFromSnapshot = useCallback(async (data: any) => {
    try {
      setTitle(data.title || "");
      setSubjects(data.subjects || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error recovering from snapshot:", error);
    }
  }, []);

  const deleteSubject = useCallback((id: number) => {
    setSubjects((prev) => {
      const newSubjects = prev.filter((subject) => subject.id !== id);
      
      // Get all remaining tags across all subjects
      const remainingTags = new Set<string>();
      newSubjects.forEach(subject => {
        subject.tags.forEach(tag => remainingTags.add(tag));
      });

      // Update selectedTags to only include tags that still exist
      setSelectedTags(prevTags => 
        prevTags.filter(tag => remainingTags.has(tag))
      );

      // Update excludedTags to only include tags that still exist
      setExcludedTags(prevTags => 
        prevTags.filter(tag => remainingTags.has(tag))
      );

      return newSubjects;
    });
  }, []);

  const toggleHideCompleted = useCallback(() => {
    setHideCompleted((prev: boolean) => {
      const newValue = !prev;
      if (id) {
        const key = `hideCompleted_${id}`;
        localStorage.setItem(key, JSON.stringify(newValue));
      }
      return newValue;
    });
  }, [id]);

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
    isExample,
    getAllTags,
    selectedTags,
    setSelectedTags,
    toggleTag,
    excludedTags,
    setExcludedTags,
    toggleExcludedTag,
    searchQuery,
    setSearchQuery,
    addSubject,
    updateSubject,
    reorderSubjects,
    deleteSubject,
    toggleHideCompleted,
    isSyncing,
    setIsSyncing,
    syncState,
    setSyncState,
    isLocked,
    setIsLocked,
    rawData: initialData?.rawData,
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
    throw new Error("useSubjects must be used within a SubjectProvider");
  }
  return context;
}
