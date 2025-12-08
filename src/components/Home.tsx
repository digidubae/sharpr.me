"use client";

import AddSubjectForm from "@/components/AddSubjectForm";
import SearchBar from "@/components/SearchBar";
import SubjectList from "@/components/SubjectList";
import { useSubjects } from "@/context/SubjectContext";
import { useSpaces } from "@/hooks/useSpaces";
import { Category, ImportedSubject } from "@/types";
import { fetchWithAuth } from "@/utils/api";
import { decryptData, encryptData } from "@/utils/encryption";
import { saveAs } from "file-saver";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import DeleteSpaceDialog from "./DeleteSpaceDialog";
import EncryptionDialog from "./EncryptionDialog";
import LoadTime from "./LoadTime";
import RecoverSnapshotDialog from "./RecoverSnapshotDialog";
import ShortcutsHelpDialog from "./ShortcutsHelpDialog";
import Shimmer from "./Shimmer";
import SwitchSpaceDialog from "./SwitchSpaceDialog";
import SyncStatus from "./SyncStatus";

const EXAMPLE_TYPES: { [key: string]: string } = {
  personal: "personal.json",
  study: "study.json",
  project: "project.json",
  work: "work.json"
};

export default function Home() {
  const { id } = useParams();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteSpaceDialog, setShowDeleteSpaceDialog] = useState(false);
  const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const {
    subjects,
    setSubjects,
    title,
    setTitle,
    setHideCompleted,
    setSortOption,
    categories,
    setCategories,
    isExample,
    isSyncing,
    setIsSyncing,
    setSyncState,
    setIsLocked,
    isLocked,
    rawData,
    autoSync,
    setAutoSync,
    hasUnsavedChanges,
    triggerManualSave,
  } = useSubjects();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showSwitchSpaceDialog, setShowSwitchSpaceDialog] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { invalidateSpaces } = useSpaces();

  // Update document title when space title changes
  useEffect(() => {
    if (!isLoading && title) {
      document.title = `${title} - Sharpr.me`;
    }
  }, [title, isLoading]);

  // Check if space is encrypted on load
  useEffect(() => {
    const checkEncryption = async () => {
      if (!id || id.toString().endsWith("-example")) {
        setIsLoading(false);
        return;
      }

      // Try to use stored password first if space is locked
      if (isLocked) {
        const storedPassword = sessionStorage.getItem(`space-${id}-password`);
        if (storedPassword) {
          try {
            setIsLoading(true);
            const data = rawData;
            if (!data?.encryptedData) {
              throw new Error("No encrypted data found");
            }
            const decryptedData = await decryptData(data.encryptedData, storedPassword);
            if (decryptedData && decryptedData.subjects && decryptedData.categories) {
              setSubjects(decryptedData.subjects);
              setCategories(decryptedData.categories);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            if (error instanceof Error &&
              (error.message === "Decryption failed - Invalid password or corrupted data" ||
                error.message === "Malformed UTF-8 data")
            ) {
              sessionStorage.removeItem(`space-${id}-password`);
              console.error("Stored password is invalid:", error);
            } else {
              console.error("Error during decryption:", error);
            }
            setShowPasswordPrompt(true);
            setIsLoading(false);
            return;
          }
        }
        setShowPasswordPrompt(true);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    };

    checkEncryption();
  }, [id, isLocked, rawData, setSubjects, setCategories]);

  // Load example data if needed
  useEffect(() => {
    const loadExampleData = async () => {
      if (!id?.toString().endsWith("-example")) {
        return;
      }

      try {
        const exampleType = id.toString().split("-")[0];
        const exampleFile = EXAMPLE_TYPES[exampleType];

        const example = await import(`@/data/examples/${exampleFile}`);
        setTitle(example.title);
        setSubjects(
          example.subjects.map((subject: ImportedSubject) => ({
            ...subject,
            id: Date.now() + Math.random(),
          }))
        );
        setHideCompleted(example.hideCompleted);
        setSortOption("manual");
      } catch (error) {
        console.error("Error loading example:", error);
      }
    };

    loadExampleData();
  }, [id, setTitle, setSubjects, setHideCompleted, setSortOption]);

  // Keyboard shortcuts: '?' for help, Cmd/Ctrl+S for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+S for manual save (works even in text inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!autoSync && hasUnsavedChanges && !isExample) {
          triggerManualSave();
        }
        return;
      }

      // Only when no text inputs are focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsDialog(true);
      } else if (e.shiftKey && e.key === '/') {
        // Some keyboards produce Shift + '/' instead of '?'
        e.preventDefault();
        setShowShortcutsDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [autoSync, hasUnsavedChanges, isExample, triggerManualSave]);

  const handlePasswordSubmit = async (password: string) => {
    if (isExample) return;

    setIsLoading(true); // Set loading state before decryption starts
    try {
      // Get the encrypted data from the context instead of fetching
      const data = rawData;
      if (!data?.encryptedData) {
        throw new Error("No encrypted data found2");
      }

      // Attempt to decrypt
      console.log("decrypting with password...")
      const decryptedData = await decryptData(data.encryptedData, password);

      // Validate the decrypted data
      if (
        !decryptedData ||
        !decryptedData.subjects ||
        !decryptedData.categories
      ) {
        throw new Error("Invalid decrypted data structure");
      }

      // Store the password only after successful decryption and validation
      sessionStorage.setItem(`space-${id}-password`, password);

      // Update all states at once to prevent unnecessary syncs
      setShowPasswordPrompt(false);
      setPasswordError(null);
      setSubjects(decryptedData.subjects);
      setCategories(decryptedData.categories);
      setIsLoading(false);
    } catch (error) {
      console.error("Error decrypting space:", error);
      if (
        error instanceof Error &&
        (error.message ===
          "Decryption failed - Invalid password or corrupted data" ||
          error.message === "Malformed UTF-8 data")
      ) {
        setPasswordError("Incorrect password. Please try again.");
        // toast.error('Incorrect password');
      } else {
        setPasswordError("Failed to decrypt space. Please try again.");
        // toast.error('Failed to decrypt space');
      }
      setIsLoading(false);
      setShowPasswordPrompt(true); // Keep the dialog open
    }
  };

  const handleTitleDoubleClick = () => {
    if (!isExample) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      if (titleInputRef.current) {
        titleInputRef.current.value = title;
      }
    }
  };

  const handleExport = () => {
    const exportData = {
      title,
      subjects,
      categories,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, "-")}.json`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        throw new Error("Please select a file to import");
      }

      const jsonContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          if (typeof event.target?.result !== "string") {
            reject(new Error("Failed to read file"));
            return;
          }
          resolve(event.target.result);
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });

      const importedData = JSON.parse(jsonContent);
      await handleImport(importedData);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import space data.");
    } finally {
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleImport = async (data: any) => {
    try {
      if (!id) {
        throw new Error("Space ID is required");
      }

      setIsImporting(true);

      // Handle different types of id from useParams
      const spaceId = typeof id === "object" && "id" in id ? id.id : id;

      if (!data.title) {
        throw new Error("Invalid import data structure");
      }

      // Sanitize the imported data
      const sanitizedData = {
        id: spaceId,
        title: data.title,
        subjects: (data.subjects || []).map((subject: ImportedSubject) => ({
          id: subject.id,
          content: subject.content || "",
          tags: Array.isArray(subject.tags) ? subject.tags : [],
          createdAt: subject.createdAt || new Date().toISOString(),
          completed: Boolean(subject.completed),
          images: Array.isArray(subject.images) ? subject.images : [],
          order: typeof subject.order === "number" ? subject.order : 0,
        })),
        categories: (data.categories || []).map((category: Category) => ({
          id: category.id || crypto.randomUUID(),
          name: category.name || "",
          tags: Array.isArray(category.tags) ? category.tags : [],
        })),
      };

      console.log("Importing data:", sanitizedData);

      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        throw new Error("Failed to save imported data");
      }

      // Update the UI with the sanitized data
      setTitle(sanitizedData.title);
      setSubjects(sanitizedData.subjects);
      setCategories(sanitizedData.categories);

      toast.success("Data imported successfully", {
        style: {
          background: "#10B981",
          color: "#fff",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      });
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Failed to import space data.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (isExample) return;

    try {
      if (!id) {
        throw new Error("Space ID is required");
      }

      // Handle different types of id from useParams
      const spaceId = typeof id === "object" && "id" in id ? id.id : id;

      const response = await fetchWithAuth(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.details || "Failed to delete space"
        );
      }

      // Wait for the cache invalidation to complete before navigating
      await invalidateSpaces();

      // Only navigate after successful deletion and cache invalidation
      router.push("/");
    } catch (error) {
      console.error("Delete space error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete space"
      );
      throw error; // Re-throw to be caught by the DeleteSpaceDialog
    }
  };

  const handleRecoverSnapshot = async (snapshotUrl: string) => {
    if (isExample) return;

    try {
      if (!id) {
        throw new Error("Space ID is required");
      }

      const spaceId = typeof id === "object" && "id" in id ? id.id : id;
      console.log("Attempting to recover snapshot:", { spaceId, snapshotUrl });

      // First fetch the snapshot data
      const response = await fetch(
        `/api/snapshots/${spaceId}?url=${encodeURIComponent(snapshotUrl)}`
      );
      console.log("Snapshot recovery API response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("Snapshot recovery API error:", error);
        throw new Error(error.error || "Failed to fetch snapshot");
      }

      const snapshotData = await response.json();
      console.log("Received snapshot data:", snapshotData);

      // Check if this is an encrypted snapshot
      if (snapshotData.isLocked && snapshotData.encryptedData) {
        // For encrypted spaces, preserve the encryption state
        const recoveredData = {
          id: spaceId,
          title: snapshotData.title || title,
          subjects: [], // Keep empty as it's encrypted
          categories: [], // Keep empty as it's encrypted
          isLocked: true,
          encryptedData: snapshotData.encryptedData,
        };

        // Save the encrypted snapshot data
        const response = await fetchWithAuth(`/api/subjects?id=${spaceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recoveredData),
        });

        if (!response.ok) {
          throw new Error("Failed to save recovered encrypted snapshot");
        }

        // Close the recovery dialog
        setShowRecoverDialog(false);

        // Show success message
        toast.success("Snapshot recovered successfully");

        // Set encrypted state and show password prompt
        setIsLocked(true);
        setShowPasswordPrompt(true);

        return;
      }

      // Handle unencrypted snapshots as before
      const recoveredData = {
        title: snapshotData.title || title,
        subjects: snapshotData.subjects || [],
        categories: snapshotData.categories || [],
      };

      // Validate the recovered data
      if (!recoveredData.title) {
        throw new Error("Invalid snapshot data: missing title");
      }

      // Prepare the data for saving
      const sanitizedData = {
        id: spaceId,
        title: recoveredData.title,
        subjects: recoveredData.subjects.map((subject: ImportedSubject) => ({
          id: subject.id || Date.now() + Math.random(),
          content: subject.content || "",
          tags: Array.isArray(subject.tags) ? subject.tags : [],
          createdAt: subject.createdAt || new Date().toISOString(),
          completed: Boolean(subject.completed),
          images: Array.isArray(subject.images) ? subject.images : [],
          order: typeof subject.order === "number" ? subject.order : 0,
        })),
        categories: recoveredData.categories.map((category: Category) => ({
          id: category.id || crypto.randomUUID(),
          name: category.name || "",
          tags: Array.isArray(category.tags) ? category.tags : [],
        })),
      };

      console.log("Sanitized data for saving:", sanitizedData);

      // Save the recovered data
      const saveResponse = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || "Failed to save recovered data");
      }

      // Update the UI
      setTitle(sanitizedData.title);
      setSubjects(sanitizedData.subjects);
      setCategories(sanitizedData.categories);

      setShowRecoverDialog(false);
      toast.success("Snapshot recovered successfully");
    } catch (error) {
      console.error("Error recovering snapshot:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to recover snapshot"
      );
    }
  };

  const handleEncrypt = async (password: string) => {
    if (isExample) return;

    // Dismiss dialog immediately
    setShowEncryptionDialog(false);

    try {
      // Show encrypting toast
      const toastId = toast.loading("Encrypting space...");

      // Start sync
      setIsSyncing(true);
      setSyncState("syncing");

      // Delete all snapshots first since they contain unencrypted data
      const deleteResponse = await fetchWithAuth(`/api/snapshots/${id}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete snapshots");
      }

      // Prepare the data for encryption (everything except title)
      // Clean the data to prevent circular references
      const cleanSubjects = subjects.map((subject) => {
        // Extract only the necessary fields and ensure they are serializable
        const cleanSubject = {
          id: subject.id,
          content: typeof subject.content === "string" ? subject.content : "",
          textContent:
            typeof subject.textContent === "string" ? subject.textContent : "",
          tags: Array.isArray(subject.tags) ? [...subject.tags] : [],
          createdAt: subject.createdAt || new Date().toISOString(),
          completed: Boolean(subject.completed),
          images: Array.isArray(subject.images) ? [...subject.images] : [],
          isPinned: Boolean(subject.isPinned),
          order: typeof subject.order === "number" ? subject.order : 0,
        };
        return cleanSubject;
      });

      const cleanCategories = categories.map((category) => ({
        id: category.id,
        name: category.name,
        tags: Array.isArray(category.tags) ? [...category.tags] : [],
      }));

      const dataToEncrypt = {
        subjects: cleanSubjects,
        categories: cleanCategories,
      };

      // Log the data before encryption to check for issues
      // console.log("Data to encrypt:", JSON.stringify(dataToEncrypt));

      // Encrypt the data
      const encryptedData = await encryptData(dataToEncrypt, password);

      // Prepare the space data with encrypted content
      const spaceData = {
        id,
        title,
        subjects: [], // Empty because it's in encrypted form
        categories: [], // Empty because it's in encrypted form
        isLocked: true,
        encryptedData,
      };

      // Save to backend
      const response = await fetchWithAuth(`/api/subjects?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spaceData),
      });

      if (!response.ok) {
        throw new Error("Failed to save encrypted space");
      }

      // Create snapshot
      const snapshotData = {
        spaceId: id,
        data: spaceData,
      };

      const snapshotResponse = await fetchWithAuth("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshotData),
      });

      if (!snapshotResponse.ok) {
        throw new Error("Failed to create snapshot");
      }

      // Only after successful save, update the UI state
      setIsLocked(true); // Set the locked state in context

      // Update the loading toast to success
      toast.success("Space encrypted successfully", {
        id: toastId,
      });

      // End sync successfully
      setSyncState("idle");

      // After everything is done, refresh the page to load the encrypted state
      router.refresh();
    } catch (error) {
      console.error("Error encrypting space:", error);
      toast.error("Failed to encrypt space");
      setSyncState("error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTurnOffEncryption = async () => {
    if (isExample) return;

    // Dismiss dialog immediately
    setShowEncryptionDialog(false);

    try {
      // Show decrypting toast
      const toastId = toast.loading("Turning off encryption...");

      // Start sync
      setIsSyncing(true);
      setSyncState("syncing");

      // Delete all snapshots first since they contain encrypted data
      const deleteResponse = await fetchWithAuth(`/api/snapshots/${id}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete snapshots");
      }

      // Create a clean space data object with ONLY the decrypted data
      const cleanSpaceData = {
        id,
        title,
        subjects: subjects.map((subject) => ({
          id: subject.id,
          content: subject.content,
          textContent: subject.textContent,
          tags: subject.tags,
          createdAt: subject.createdAt,
          completed: subject.completed,
          images: subject.images,
          isPinned: subject.isPinned,
          order: subject.order,
        })),
        categories,
        isLocked: false,
        isPinned: false,
      };

      // Save to backend
      const saveResponse = await fetchWithAuth(`/api/subjects?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanSpaceData),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save decrypted space");
      }

      // Create snapshot with clean data
      const snapshotData = {
        spaceId: id,
        data: cleanSpaceData,
      };

      const snapshotResponse = await fetchWithAuth("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshotData),
      });

      if (!snapshotResponse.ok) {
        throw new Error("Failed to create snapshot");
      }

      // Update the UI state
      setIsLocked(false);

      // Explicitly clean up stored password only when turning off encryption
      sessionStorage.removeItem(`space-${id}-password`);

      // Update the loading toast to success
      toast.success("Encryption turned off successfully", {
        id: toastId,
      });

      // End sync successfully
      setSyncState("idle");

      // After everything is done, refresh the page
      router.refresh();
    } catch (error) {
      console.error("Error turning off encryption:", error);
      toast.error("Failed to turn off encryption");
      setSyncState("error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    // Only add the event listener if the dropdown is shown
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  if (isLoading || isImporting) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Shimmer
            message={isImporting ? "Importing space..." : "Loading space..."}
          />
        </div>
        <LoadTime />
      </div>
    );
  }

  if (showPasswordPrompt && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <EncryptionDialog
            isOpen={true}
            onClose={() => {
              setShowPasswordPrompt(false);
              setPasswordError(null);
              router.push("/");
            }}
            onConfirm={handlePasswordSubmit}
            mode="decrypt"
            error={passwordError}
          />
        </div>
        <LoadTime />
      </div>
    );
  }

  // Don't render the main content until we have actual data
  const hasData = subjects.length > 0 || categories.length > 0 || !isLocked;
  if (!hasData && !isExample) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Shimmer message="Loading space..." />
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
                className={`text-3xl font-bold mb-4 ${
                  !isExample ? "cursor-pointer hover:opacity-80" : ""
                }`}
                onDoubleClick={handleTitleDoubleClick}
              >
                {title}
              </h1>
            )}
            {!isExample && (
              <div className="absolute right-0 top-0 flex items-center gap-2" ref={dropdownRef}>
                {/* Manual Save Button - only visible when autoSync is off and there are unsaved changes */}
                {!autoSync && hasUnsavedChanges && (
                  <button
                    onClick={triggerManualSave}
                    disabled={isSyncing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md shadow-sm transition-colors
                       ${isSyncing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    title={isSyncing ? 'Saving...' : 'Save changes'}
                  >
                    {isSyncing ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                    )}
                    {isSyncing ? 'Saving...' : 'Save'}
                  </button>
                )}
                {/* Unsaved indicator when autoSync is off but no changes yet */}
                {!autoSync && !hasUnsavedChanges && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Manual save
                  </span>
                )}
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <button
                        onClick={() => {
                          document.getElementById("import-file")?.click();
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                           hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
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
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
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
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
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
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                        <span>Switch Space</span>
                      </button>

                      <button
                        onClick={() => {
                          setAutoSync(!autoSync);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                           hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        role="menuitem"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>{autoSync ? 'Switch to Manual Save' : 'Switch to Auto Save'}</span>
                      </button>

                      {subjects.length > 0 && (
                        <button
                          onClick={() => {
                            setShowEncryptionDialog(true);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 
                             hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                          role="menuitem"
                        >
                          {isLocked ? (
                            <svg
                              className="w-5 h-5 mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                          <span>Encryption {isLocked ? "Settings" : ""}</span>
                        </button>
                      )}

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
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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
              <ShortcutsHelpDialog
                isOpen={showShortcutsDialog}
                onClose={() => setShowShortcutsDialog(false)}
              />
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
              <EncryptionDialog
                isOpen={showEncryptionDialog}
                onClose={() => setShowEncryptionDialog(false)}
                onConfirm={isLocked ? handleTurnOffEncryption : handleEncrypt}
                mode={isLocked ? "turn-off" : "encrypt"}
              />
            </>
          )}
        </div>
      </div>
      <LoadTime />
    </div>
  );
}
