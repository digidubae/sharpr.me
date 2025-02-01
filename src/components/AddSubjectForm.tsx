'use client';

import { useState, useEffect, useRef } from "react";
import { useSubjects } from "@/context/SubjectContext";
import RichTextEditor from './RichTextEditor';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AddSubjectForm() {
  const { addSubject, getAllTags } = useSubjects();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Only trigger if 'a' is pressed and no input/textarea is focused
      if (e.key === 'a' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA' &&
          document.activeElement?.getAttribute('contenteditable') !== 'true') {
        e.preventDefault();
        setIsExpanded(true);
      }

      // Handle Escape key to collapse the form
      if (e.key === 'Escape' && isExpanded) {
        e.preventDefault();
        setIsExpanded(false);
        setContent("");
        setTags("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const processedContent = content.replace(/(<[^>]+>|data:image\/[^;]+;base64,[^"]+)/g, '');
    
    addSubject({
      id: Date.now(),
      content,
      textContent: processedContent,
      tags: tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean),
      createdAt: new Date().toISOString(),
      completed: false,
      images: [],
      isPinned: false
    });

    setContent("");
    setTags("");
    setIsExpanded(false);
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Don't update if empty
    if (!value.trim()) return;

    // Add tag when user presses Enter
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim().toLowerCase();
      if (newTag && !tags.split(',').map(t => t.trim()).includes(newTag)) {
        setTags(prev => prev ? `${prev}, ${newTag}` : newTag);
      }
      e.target.value = '';
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    // Get cursor position
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    // Find the current tag being typed
    const tagList = value.split(',');
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

    const currentTag = tagList[currentTagIndex]?.trim().toLowerCase() || '';
    
    if (currentTag) {
      // Filter existing tags that match current input
      const suggestions = getAllTags()
        .filter(tag => {
          const normalizedTag = tag.toLowerCase();
          const existingTags = tagList
            .map(t => t.trim().toLowerCase())
            .filter(t => t !== currentTag); // Don't exclude current tag being typed
          return normalizedTag.includes(currentTag) && !existingTags.includes(normalizedTag);
        });
      setTagSuggestions(suggestions);
      setShowTagSuggestions(suggestions.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInputRef.current?.value.trim()) {
      setIsAddingTag(false);
      return;
    }
    
    const newTag = tagInputRef.current.value.trim().toLowerCase();
    if (!tags.split(',').map(t => t.trim()).includes(newTag)) {
      setTags(prev => prev ? `${prev}, ${newTag}` : newTag);
    }
    tagInputRef.current.value = '';
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = tags.split(',').map(t => t.trim());
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags.join(', '));
  };

  const handleTagSuggestionClick = (suggestion: string) => {
    if (!tags.split(',').map(t => t.trim()).includes(suggestion)) {
      setTags(prev => prev ? `${prev}, ${suggestion}` : suggestion);
    }
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsAddingTag(false);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Escape key to dismiss tag input
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setIsAddingTag(false); // Hide input and show plus button
      return;
    }

    // Handle Enter key to add new tag regardless of suggestions
    if (e.key === 'Enter') {
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
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < tagSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.tag-suggestions') && !target.closest('.tag-input')) {
        setShowTagSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'h-auto' : 'h-12'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full h-12 px-6 text-left text-gray-500 hover:text-gray-700 
                     dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
          >
            + Add new subject
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-fadeIn">
            <RichTextEditor
              content={content}
              onChange={setContent}
              autoFocus={true}
            />
            <div className="relative">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag !== '')
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
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add a tag"
                      autoFocus
                      className="tag-input w-32 px-2 py-1 text-sm rounded-lg border border-gray-200 
                               dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                      onBlur={() => {
                        if (!tagInputRef.current?.value.trim()) {
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
                    {!tags.split(',').filter(tag => tag.trim() !== '').length && (
                      <span className="text-sm">Add tag</span>
                    )}
                  </button>
                )}
              </div>
              {showTagSuggestions && isAddingTag && (
                <div className="tag-suggestions absolute z-10 w-64 mt-1 bg-white dark:bg-gray-800 
                               rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  {tagSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion}-${index}`}
                      type="button"
                      onClick={() => handleTagSuggestionClick(suggestion)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm
                               first:rounded-t-lg last:rounded-b-lg
                               ${index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors duration-200 text-sm"
              >
                Add Subject
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                         transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 