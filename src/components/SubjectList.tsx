"use client";

import { useSubjects } from "@/context/SubjectContext";
import {
  useState,
  useEffect,
  useRef,
  KeyboardEvent as ReactKeyboardEvent,
  useMemo,
  useCallback,
} from "react";
import RichTextEditor from "./RichTextEditor";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
} from "@hello-pangea/dnd";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { useDialog } from "@/context/DialogContext";
import {
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import RemindDialog from "./RemindDialog";
import { formatDistanceToNow } from "date-fns";

// Update the PinIcon component to accept a filled prop
function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

interface SubjectListProps {
  readOnly?: boolean;
  preventSync?: boolean;
}

export default function SubjectList({
  readOnly,
  preventSync,
}: SubjectListProps) {
  const {
    subjects,
    searchQuery,
    selectedTags,
    hideCompleted,
    deleteSubject,
    updateSubject,
    toggleHideCompleted,
    reorderSubjects,
    getAllTags,
    setSelectedTags,
  } = useSubjects();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ content: "", tags: "" });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    subjectId: number | null;
  }>({
    isOpen: false,
    subjectId: null,
  });
  const selectedSubjectRef = useRef<HTMLDivElement | null>(null);
  const { isDialogOpen } = useDialog();
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState<number>(-1);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [remindDialog, setRemindDialog] = useState<{
    isOpen: boolean;
    subjectId: number | null;
  }>({
    isOpen: false,
    subjectId: null,
  });

  const filteredAndSortedSubjects = useMemo(
    () =>
      subjects
        .filter((subject) => {
          return (
            (!hideCompleted || !subject.completed) &&
            (
              subject.textContent ||
              subject.content.replace(
                /(<[^>]+>|data:image\/[^;]+;base64,[^"]+)/g,
                ""
              )
            )
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) &&
            (selectedTags.length === 0 ||
              selectedTags.every((tag) => subject.tags.includes(tag)))
          );
        })
        .sort((a, b) => {
          // First check for today's and past reminders
          const now = new Date();
          const today = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
          )
            .toISOString()
            .split("T")[0];
          const aHasPastOrTodayReminder =
            a.reminderDate && a.reminderDate <= today;
          const bHasPastOrTodayReminder =
            b.reminderDate && b.reminderDate <= today;

          if (aHasPastOrTodayReminder && !bHasPastOrTodayReminder) return -1;
          if (!aHasPastOrTodayReminder && bHasPastOrTodayReminder) return 1;

          // Then sort by pinned status
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;

          // Finally sort by order
          return a.order - b.order;
        }),
    [subjects, hideCompleted, searchQuery, selectedTags]
  );

  const getHighlightedContent = useMemo(() => {
    const highlightText = (content: string) => {
      if (!searchQuery) {
        // When there's no search query, we still need to process time elements
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        // Update all time elements
        tempDiv.querySelectorAll('.signal-content time.relative-time').forEach((timeElement) => {
          const date = new Date(timeElement.getAttribute('datetime') || '');
          timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
        });

        return tempDiv.innerHTML;
      }

      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      const highlightTextNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          const escapedQuery = searchQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          const regex = new RegExp(`(${escapedQuery})`, "gi");

          if (regex.test(text)) {
            const span = document.createElement("span");
            span.innerHTML = text.replace(
              regex,
              `<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>`
            );
            node.parentNode?.replaceChild(span, node);
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          !(node as Element).matches("mark, img, code, pre")
        ) {
          // Update time elements while processing nodes
          if ((node as Element).matches('.signal-content time.relative-time')) {
            const timeElement = node as Element;
            const date = new Date(timeElement.getAttribute('datetime') || '');
            timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
          }
          // Recursively process child nodes, but skip already highlighted text and specific elements
          Array.from(node.childNodes).forEach(highlightTextNode);
        }
      };

      // Process all nodes
      Array.from(tempDiv.childNodes).forEach(highlightTextNode);

      return tempDiv.innerHTML;
    };

    // Create a map of highlighted content for visible subjects
    return new Map(
      filteredAndSortedSubjects.map((subject) => [
        subject.id,
        highlightText(subject.content),
      ])
    );
  }, [searchQuery, filteredAndSortedSubjects]);

  const handleToggleComplete = useCallback((id: number) => {
    const subject = subjects.find((s) => s.id === id);
    if (!subject) return;

    const maxOrder = Math.max(...subjects.map((s) => s.order));
    const newOrder = subject.completed ? 0 : maxOrder + 1000;

    updateSubject(id, {
      completed: !subject.completed,
      order: newOrder,
    });

    if (hideCompleted) {
      const currentSubject = filteredAndSortedSubjects[selectedIndex];
      if (currentSubject?.id === id) {
        const remainingSubjects = filteredAndSortedSubjects.filter(
          (s) => s.id !== id
        );
        if (remainingSubjects.length > 0) {
          const newIndex = Math.min(
            selectedIndex,
            remainingSubjects.length - 1
          );
          setSelectedIndex(newIndex);
        } else {
          setSelectedIndex(-1);
        }
      }
    }
  }, [subjects, updateSubject, hideCompleted, filteredAndSortedSubjects, selectedIndex]);

  const handleEdit = useCallback((subject: (typeof subjects)[0]) => {
    // Prevent the Enter keypress from being added to the textarea
    setTimeout(() => {
      setEditingId(subject.id);
      setEditForm({
        content: subject.content,
        tags: subject.tags.join(", "),
      });
    }, 0);
  }, []); // Remove readOnly dependency

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Don't handle keyboard shortcuts when dialog is open
      if (isDialogOpen) return;

      // Don't handle keyboard shortcuts when in edit mode
      if (editingId !== null) return;

      // Don't handle shortcuts when focus is in input/textarea/contenteditable
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex =
              prev < filteredAndSortedSubjects.length - 1 ? prev + 1 : prev;
            // If reaching the last item, scroll to bottom
            if (newIndex === filteredAndSortedSubjects.length - 1) {
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
              });
            }
            return newIndex;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : prev;
            // If reaching the first item, scroll to top
            if (newIndex === 0) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            return newIndex;
          });
          break;
        case "Enter":
          if (
            selectedIndex >= 0 &&
            selectedIndex < filteredAndSortedSubjects.length
          ) {
            handleEdit(filteredAndSortedSubjects[selectedIndex]);
          }
          break;
        case "d":
          e.preventDefault();
          if (
            selectedIndex >= 0 &&
            selectedIndex < filteredAndSortedSubjects.length
          ) {
            setDeleteConfirmation({
              isOpen: true,
              subjectId: filteredAndSortedSubjects[selectedIndex].id,
            });
          }
          break;
        case " ":
          e.preventDefault();
          if (
            selectedIndex >= 0 &&
            selectedIndex < filteredAndSortedSubjects.length
          ) {
            handleToggleComplete(filteredAndSortedSubjects[selectedIndex].id);
          }
          break;
        case "h":
          e.preventDefault();
          toggleHideCompleted();
          break;
        case "p":
          e.preventDefault();
          if (
            selectedIndex >= 0 &&
            selectedIndex < filteredAndSortedSubjects.length
          ) {
            const subject = filteredAndSortedSubjects[selectedIndex];
            updateSubject(subject.id, { isPinned: !subject.isPinned });
          }
          break;
        case "t":
          e.preventDefault();
          if (selectedIndex >= 0) {
            // Only if a subject is selected
            setSelectedIndex(0);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          break;
        case "b":
          e.preventDefault();
          if (selectedIndex >= 0) {
            // Only if a subject is selected
            setSelectedIndex(filteredAndSortedSubjects.length - 1);
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "smooth",
            });
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    filteredAndSortedSubjects,
    selectedIndex,
    editingId,
    deleteSubject,
    handleToggleComplete,
    toggleHideCompleted,
    handleEdit,
    hideCompleted,
    isDialogOpen,
    updateSubject,
  ]); // Remove readOnly from dependencies

  // Focus the contentEditable div when entering edit mode
  useEffect(() => {
    if (editingId !== null && contentEditableRef.current) {
      contentEditableRef.current.focus();

      // Place cursor at the end of the content
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [editingId]);

  const handleSaveEdit = (id: number) => {
    const processedContent = editForm.content.replace(
      /(<[^>]+>|data:image\/[^;]+;base64,[^"]+)/g,
      ""
    );

    const newTags = editForm.tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    // Check if we need to clear tag filter
    const subjectsWithSelectedTags = subjects.filter(subject =>
      selectedTags.every(tag => subject.tags.includes(tag))
    );

    // If there's exactly one subject with the selected tags and it's the one being edited
    if (selectedTags.length > 0 && 
        subjectsWithSelectedTags.length === 1 && 
        subjectsWithSelectedTags[0].id === id) {
      // Check if any of the selected tags are being removed
      const isRemovingSelectedTag = selectedTags.some(tag => !newTags.includes(tag));
      if (isRemovingSelectedTag) {
        // Clear the tag filter by setting selectedTags to empty array
        setSelectedTags([]);
      }
    }

    // Update the UI state
    updateSubject(id, {
      content: editForm.content,
      textContent: processedContent,
      tags: newTags,
    });

    // Reset edit state
    setEditingId(null);
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Don't update if empty
    if (!value.trim()) return;

    // Add tag when user presses Enter
    if (value.endsWith(",")) {
      const newTag = value.slice(0, -1).trim().toLowerCase();
      if (
        newTag &&
        !editForm.tags
          .split(",")
          .map((t) => t.trim())
          .includes(newTag)
      ) {
        setEditForm((prev) => ({
          ...prev,
          tags: prev.tags ? `${prev.tags}, ${newTag}` : newTag,
        }));
      }
      e.target.value = "";
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    // Get cursor position
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    // Find the current tag being typed
    const tagList = value.split(",");
    let currentPos = 0;
    let currentTagIndex = 0;

    for (let i = 0; i < tagList.length; i++) {
      const tagLength = tagList[i].length;
      currentPos += tagLength + 1; // +1 for comma
      if (currentPos >= cursorPos) {
        currentTagIndex = i;
        break;
      }
    }

    const currentTag = tagList[currentTagIndex]?.trim().toLowerCase() || "";

    if (currentTag) {
      // Filter existing tags that match current input
      const suggestions = getAllTags().filter((tag) => {
        const normalizedTag = tag.toLowerCase();
        const existingTags = tagList
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t !== currentTag); // Don't exclude current tag being typed
        return (
          normalizedTag.includes(currentTag) &&
          !existingTags.includes(normalizedTag)
        );
      });
      setTagSuggestions(suggestions);
      setShowTagSuggestions(suggestions.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInputRef.current?.value.trim()) return;

    const newTag = tagInputRef.current.value.trim().toLowerCase();
    if (
      !editForm.tags
        .split(",")
        .map((t) => t.trim())
        .includes(newTag)
    ) {
      setEditForm((prev) => ({
        ...prev,
        tags: prev.tags ? `${prev.tags}, ${newTag}` : newTag,
      }));
    }
    tagInputRef.current.value = "";
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = editForm.tags.split(",").map((t) => t.trim());
    const updatedTags = currentTags.filter((tag) => tag !== tagToRemove);
    setEditForm((prev) => ({
      ...prev,
      tags: updatedTags.join(", "),
    }));
  };

  const handleTagSuggestionClick = (suggestion: string) => {
    if (
      !editForm.tags
        .split(",")
        .map((t) => t.trim())
        .includes(suggestion)
    ) {
      setEditForm((prev) => ({
        ...prev,
        tags: prev.tags ? `${prev.tags}, ${suggestion}` : suggestion,
      }));
    }
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsAddingTag(false); // Hide input after selection
  };

  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    subjectId: number
  ) => {
    // Handle Escape key to dismiss tag input
    if (e.key === "Escape") {
      e.preventDefault();
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setIsAddingTag(false); // Hide input and show plus button
      return;
    }

    // Handle Enter key to add new tag regardless of suggestions
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        // If a suggestion is selected, use it
        handleTagSuggestionClick(tagSuggestions[selectedSuggestionIndex]);
      } else if (tagInputRef.current?.value.trim()) {
        // If no suggestion selected but input has value, add as new tag
        handleAddTag();
      }
      return;
    }

    if (!showTagSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < tagSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveEdit(editingId!);
    }
  };

  // Add this new function to handle the click
  const handleCreateClick = useCallback(() => {
    // Find the 'a' key handler in AddSubjectForm and trigger it
    const event = new KeyboardEvent("keydown", { key: "a" });
    document.dispatchEvent(event);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    // Get the actual subject IDs from the filtered list
    const sourceId = filteredAndSortedSubjects[sourceIndex].id;
    const destinationId = filteredAndSortedSubjects[destinationIndex].id;

    // Find the actual indices in the full list
    const fullSourceIndex = subjects.findIndex((s) => s.id === sourceId);
    const fullDestinationIndex = subjects.findIndex(
      (s) => s.id === destinationId
    );

    // Use the full list indices for reordering
    reorderSubjects(fullSourceIndex, fullDestinationIndex);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmation({ isOpen: true, subjectId: id });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.subjectId) {
      deleteSubject(deleteConfirmation.subjectId);
      // Adjust selected index if needed
      if (selectedIndex >= filteredAndSortedSubjects.length - 1) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    }
    setDeleteConfirmation({ isOpen: false, subjectId: null });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, subjectId: null });
  };

  // Add this useEffect to handle scrolling
  useEffect(() => {
    if (selectedIndex >= 0 && selectedSubjectRef.current) {
      selectedSubjectRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const setRefs = (
    el: HTMLDivElement | null,
    provided: DraggableProvided,
    index: number
  ) => {
    provided.innerRef(el);
    if (index === selectedIndex && el) {
      selectedSubjectRef.current = el;
    }
  };

  useEffect(() => {
    const handleSelectFirst = () => {
      if (filteredAndSortedSubjects.length > 0) {
        setSelectedIndex(0);
        // Optionally scroll the first item into view
        if (selectedSubjectRef.current) {
          selectedSubjectRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    };

    document.addEventListener("selectFirstSubject", handleSelectFirst);
    return () => {
      document.removeEventListener("selectFirstSubject", handleSelectFirst);
    };
  }, [filteredAndSortedSubjects.length]);

  // Add click handler for subject selection
  const handleSubjectClick = (index: number, e: React.MouseEvent) => {
    // Don't select when clicking buttons or checkboxes
    const target = e.target as Element;
    const isButton =
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.tagName === "INPUT";

    if (!isButton) {
      setSelectedIndex(index);
    }
  };

  // Add click handler for outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside any subject
      const isOutsideClick =
        !e.target || !(e.target as Element).closest(".subject-container");

      // Don't unselect if clicking inside a dialog
      const isDialogClick = (e.target as Element).closest('[role="dialog"]');

      if (isOutsideClick && !isDialogClick) {
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this to check if there are any completed subjects
  const hasCompletedSubjects = useMemo(
    () => subjects.some((subject) => subject.completed),
    [subjects]
  );

  const handleSearchChange = useCallback(() => {
    setSelectedIndex(-1); // Reset selection when search changes
  }, []);

  const handleTagsChange = useCallback(() => {
    setSelectedIndex(-1); // Reset selection when tags change
  }, []);

  // Add this useEffect to watch for search and tag changes
  useEffect(() => {
    if (searchQuery) {
      handleSearchChange();
    }
  }, [searchQuery, handleSearchChange]);

  useEffect(() => {
    if (selectedTags.length > 0) {
      handleTagsChange();
    }
  }, [selectedTags, handleTagsChange]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        !target.closest(".tag-suggestions") &&
        !target.closest(".tag-input")
      ) {
        setShowTagSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this new handler
  const handleTogglePin = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent subject selection when clicking pin
    updateSubject(id, {
      isPinned: !subjects.find((s) => s.id === id)?.isPinned,
    });
  };

  // Add new handlers for remind functionality
  const handleRemindClick = (id: number) => {
    setRemindDialog({ isOpen: true, subjectId: id });
  };

  const handleRemindConfirm = (date: Date) => {
    if (remindDialog.subjectId) {
      // Adjust the date to local timezone and get only the date part
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );
      updateSubject(remindDialog.subjectId, {
        reminderDate: localDate.toISOString().split("T")[0],
      });
    }
    setRemindDialog({ isOpen: false, subjectId: null });
  };

  const handleRemindCancel = () => {
    setRemindDialog({ isOpen: false, subjectId: null });
  };

  const handleRemoveReminder = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent subject selection when clicking delete

    // Get the minimum order value to place this subject at the top
    const minOrder = Math.min(...subjects.map((s) => s.order)) - 1000;

    updateSubject(id, {
      reminderDate: undefined,
      order: minOrder, // Set the order to keep it at the top
    });
  };

  // Add new handler for sending subject to bottom
  const handleSendToBottom = (id: number) => {
    // Get the maximum order value and add 1000 to ensure it goes to the bottom
    const maxOrder = Math.max(...subjects.map((s) => s.order)) + 1000;
    updateSubject(id, { order: maxOrder });
  };

  // Add time update functionality for signals
  useEffect(() => {
    const updateSignalTimes = () => {
      const timeElements = document.querySelectorAll('.signal-content time.relative-time');
      timeElements.forEach((timeElement) => {
        const date = new Date(timeElement.getAttribute('datetime') || '');
        timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
      });
    };

    // Initial update
    updateSignalTimes();

    // Update every minute
    const updateInterval = setInterval(updateSignalTimes, 60000);

    return () => clearInterval(updateInterval);
  }, [subjects]); // Re-run when subjects change directly

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            Subjects ({filteredAndSortedSubjects.length})
          </h2>
          {hasCompletedSubjects && (
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={() => toggleHideCompleted()}
                className="rounded border-gray-300 text-blue-500 
                         focus:ring-blue-500 cursor-pointer"
              />
              Hide completed
            </label>
          )}
        </div>
      </div>

      {filteredAndSortedSubjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedTags.length > 0 ? (
              "No subjects match your search criteria"
            ) : (
              <>
                No subjects yet.{" "}
                <button
                  onClick={handleCreateClick}
                  className="text-blue-500 hover:text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Add new subject
                </button>
              </>
            )}
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="subjects" isDropDisabled={readOnly}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {filteredAndSortedSubjects.map((subject, index) => (
                  <Draggable
                    key={subject.id}
                    draggableId={subject.id.toString()}
                    index={index}
                    isDragDisabled={readOnly}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={(el) => setRefs(el, provided, index)}
                        {...provided.draggableProps}
                        className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow 
                          hover:shadow-md transition-shadow subject-container
                          ${snapshot.isDragging ? "shadow-xl" : ""} 
                          ${
                            index === selectedIndex
                              ? "ring-2 ring-blue-500"
                              : ""
                          }
                          ${
                            subject.reminderDate &&
                            subject.reminderDate <=
                              new Date(
                                new Date().getTime() -
                                  new Date().getTimezoneOffset() * 60000
                              )
                                .toISOString()
                                .split("T")[0]
                              ? "border-2 border-red-500 dark:border-red-500"
                              : ""
                          }`}
                        onClick={(e) => handleSubjectClick(index, e)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              onClick={(e) => handleTogglePin(subject.id, e)}
                              className={`p-1 -mb-1 transition-colors ${
                                subject.isPinned
                                  ? "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500"
                                  : "text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                              }`}
                              title={
                                subject.isPinned
                                  ? "Unpin subject"
                                  : "Pin subject"
                              }
                            >
                              <PinIcon filled={subject.isPinned} />
                            </button>
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-move p-1 hover:bg-gray-100 
                                dark:hover:bg-gray-700 rounded mt-0.5"
                            >
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 8h16M4 16h16"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={subject.completed}
                              onChange={() => handleToggleComplete(subject.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-500 
                                       focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1">
                            {editingId === subject.id ? (
                              // Edit mode
                              <div>
                                <RichTextEditor
                                  content={editForm.content}
                                  onChange={(newContent) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      content: newContent,
                                    }))
                                  }
                                  onKeyDown={handleKeyDown}
                                />
                                <div className="relative mt-4">
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {editForm.tags
                                      .split(",")
                                      .map((tag) => tag.trim())
                                      .filter((tag) => tag !== "")
                                      .map((tag, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                                        >
                                          <span className="text-sm">{tag}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                                          >
                                            <XMarkIcon className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                    {isAddingTag ? (
                                      <div className="flex gap-2">
                                        <input
                                          ref={tagInputRef}
                                          type="text"
                                          onChange={handleTagInput}
                                          onKeyDown={(e) =>
                                            handleTagInputKeyDown(e, subject.id)
                                          }
                                          placeholder="Add a tag"
                                          autoFocus
                                          className="tag-input w-32 px-2 py-1 text-sm rounded-lg border border-gray-200 
                                                           dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                                          onBlur={() => {
                                            if (
                                              !tagInputRef.current?.value.trim()
                                            ) {
                                              setIsAddingTag(false);
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setIsAddingTag(true)}
                                        className={`flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 
                                                          hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors`}
                                        aria-label="Add tag"
                                      >
                                        <PlusIcon className="w-4 h-4" />
                                        {!editForm.tags
                                          .split(",")
                                          .filter((tag) => tag.trim() !== "")
                                          .length && (
                                          <span className="text-sm">
                                            Add tag
                                          </span>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  {showTagSuggestions && isAddingTag && (
                                    <div
                                      className="tag-suggestions absolute z-10 w-64 mt-1 bg-white dark:bg-gray-800 
                                                           rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                                    >
                                      {tagSuggestions.map(
                                        (suggestion, index) => (
                                          <button
                                            key={`${suggestion}-${index}`}
                                            type="button"
                                            onClick={() =>
                                              handleTagSuggestionClick(
                                                suggestion
                                              )
                                            }
                                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm
                                                           first:rounded-t-lg last:rounded-b-lg
                                                           ${
                                                             index ===
                                                             selectedSuggestionIndex
                                                               ? "bg-gray-100 dark:bg-gray-700"
                                                               : ""
                                                           }`}
                                            onMouseEnter={() =>
                                              setSelectedSuggestionIndex(index)
                                            }
                                          >
                                            {suggestion}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(subject.id)}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <div
                                  className={`prose dark:prose-invert max-w-none ${
                                    subject.completed
                                      ? "line-through text-gray-400 dark:text-gray-500"
                                      : ""
                                  }`}
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      getHighlightedContent.get(subject.id) ||
                                      subject.content,
                                  }}
                                />
                                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                                  {subject.tags
                                    .filter((tag) => tag.trim() !== "")
                                    .map((tag, index) => (
                                      <span
                                        key={index}
                                        className={`px-2 py-1 rounded-full text-sm ${
                                          subject.completed
                                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                            : "bg-gray-100 dark:bg-gray-700"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                </div>
                                {index === selectedIndex && (
                                  <div className="flex gap-2 items-center">
                                    <button
                                      onClick={() => handleEdit(subject)}
                                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteClick(subject.id)
                                      }
                                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                      Delete
                                    </button>
                                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    {subject.reminderDate ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {(() => {
                                            const today = new Date(
                                              new Date().getTime() -
                                                new Date().getTimezoneOffset() *
                                                  60000
                                            )
                                              .toISOString()
                                              .split("T")[0];
                                            const reminderDate = new Date(
                                              subject.reminderDate + "T00:00:00"
                                            );
                                            const currentDate = new Date();
                                            currentDate.setHours(0, 0, 0, 0);

                                            if (
                                              subject.reminderDate === today
                                            ) {
                                              return `For your attention ${reminderDate.toLocaleDateString()}`;
                                            } else if (
                                              reminderDate < currentDate
                                            ) {
                                              return `Brought to attention on ${reminderDate.toLocaleDateString()}`;
                                            } else {
                                              return `Will bring to your attention on ${reminderDate.toLocaleDateString()}`;
                                            }
                                          })()}
                                        </span>
                                        <button
                                          onClick={(e) =>
                                            handleRemoveReminder(subject.id, e)
                                          }
                                          className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                          title="Remove reminder"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleRemindClick(subject.id)
                                        }
                                        className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline"
                                      >
                                        Remind me
                                      </button>
                                    )}
                                    {index !==
                                      filteredAndSortedSubjects.length - 1 &&
                                      !subject.isPinned &&
                                      (!subject.reminderDate ||
                                        subject.reminderDate >
                                          new Date(
                                            new Date().getTime() -
                                              new Date().getTimezoneOffset() * 60000
                                          )
                                            .toISOString()
                                            .split("T")[0]) && (
                                      <>
                                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                        <button
                                          onClick={() =>
                                            handleSendToBottom(subject.id)
                                          }
                                          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline"
                                        >
                                          Send to bottom
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <RemindDialog
        isOpen={remindDialog.isOpen}
        onClose={handleRemindCancel}
        onConfirm={handleRemindConfirm}
      />
      <DeleteConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
