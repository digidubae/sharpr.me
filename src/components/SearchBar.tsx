'use client';

import { useSubjects } from "@/context/SubjectContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";
import { Category } from '@/types';

export default function SearchBar() {
  const { 
    setSearchQuery, 
    getAllTags, 
    selectedTags, 
    toggleTag,
    excludedTags,
    toggleExcludedTag,
    subjects,
    searchQuery,
    hideCompleted,
    categories,
    setCategories,
  } = useSubjects();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingTag, setIsDraggingTag] = useState(false);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [categorizedTags, setCategorizedTags] = useState<string[]>([]);

  const allTags = getAllTags();

  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');
  const editCategoryInputRef = useRef<HTMLInputElement>(null);

  const getFilteredSubjects = useCallback(() => {
    return subjects.filter(subject => {
      const searchableContent = subject.textContent || subject.content.replace(/(<[^>]+>|data:image\/[^;]+;base64,[^"]+)/g, '');
      
      return (!hideCompleted || !subject.completed) &&
        searchableContent.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedTags.length === 0 || selectedTags.every(tag => subject.tags.includes(tag))) &&
        (excludedTags.length === 0 || excludedTags.every(tag => !subject.tags.includes(tag)));
    });
  }, [subjects, hideCompleted, searchQuery, selectedTags, excludedTags]);

  const getTagCount = useCallback((tag: string) => {
    return subjects.filter(subject => 
      (!hideCompleted || !subject.completed) &&
      subject.tags.includes(tag)
    ).length;
  }, [subjects, hideCompleted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA' &&
          document.activeElement?.getAttribute('contenteditable') !== 'true') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        setSearchQuery('');
        if (searchInputRef.current) {
          searchInputRef.current.value = '';
          searchInputRef.current.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSearchQuery]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const filteredSubjects = getFilteredSubjects();
      if (filteredSubjects.length > 0) {
        const event = new CustomEvent('selectFirstSubject');
        document.dispatchEvent(event);
        searchInputRef.current?.blur();
      }
    }
  };

  const handleDragStart = (tag: string) => {
    setIsDraggingTag(true);
    setDraggedTag(tag);
  };

  const handleDragEnd = () => {
    if (!showCategoryInput) {
      setIsDraggingTag(false);
      setDraggedTag(null);
    }
  };

  const handleDrop = () => {
    if (draggedTag) {
      setShowCategoryInput(true);
    }
  };

  const handleCategoryInputComplete = (inputValue?: string) => {
    if (inputValue && draggedTag) {
      const categoryName = inputValue.trim();
      
      const updatedCategories = categories.map((cat: Category) => ({
        ...cat,
        tags: cat.tags.filter(tag => tag !== draggedTag)
      })).filter((cat: Category) => cat.tags.length > 0);

      const existingCategoryIndex = updatedCategories.findIndex(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategoryIndex >= 0) {
        const finalCategories = [...updatedCategories];
        if (!finalCategories[existingCategoryIndex].tags.includes(draggedTag)) {
          finalCategories[existingCategoryIndex].tags.push(draggedTag);
        }
        setCategories(finalCategories);
      } else {
        setCategories([...updatedCategories, { 
          id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: categoryName, 
          tags: [draggedTag] 
        }]);
      }
    }
    setShowCategoryInput(false);
    setIsDraggingTag(false);
    setDraggedTag(null);
  };

  const allCategorizedTags = categories.flatMap(category => category.tags);

  const getCategoryNames = () => {
    return categories.map(cat => cat.name);
  };

  const handleCategoryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    
    if (!value.trim()) {
      setShowCategorySuggestions(false);
      return;
    }

    const suggestions = getCategoryNames()
      .filter(name => name.toLowerCase().includes(value));
    
    setCategorySuggestions(suggestions);
    setShowCategorySuggestions(suggestions.length > 0);
    setSelectedCategoryIndex(-1);
  };

  const handleCategorySuggestionClick = (categoryName: string) => {
    handleCategoryInputComplete(categoryName);
    setShowCategorySuggestions(false);
  };

  const handleCategoryInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCategoryIndex(prev => 
        prev < categorySuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCategoryIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedCategoryIndex >= 0) {
        handleCategoryInputComplete(categorySuggestions[selectedCategoryIndex]);
      } else {
        handleCategoryInputComplete(e.currentTarget.value);
      }
      setShowCategorySuggestions(false);
    } else if (e.key === 'Escape') {
      setShowCategorySuggestions(false);
      handleCategoryInputComplete();
    }
  };

  const handleCategoryDrop = (categoryName: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTag) {
      handleCategoryInputComplete(categoryName);
    }
  };

  const handleUncategorize = () => {
    if (draggedTag) {
      const updatedCategories = categories
        .map((cat: Category) => ({
          ...cat,
          tags: cat.tags.filter(tag => tag !== draggedTag)
        }))
        .filter((cat: Category) => cat.tags.length > 0);
      
      setCategories(updatedCategories);
      setIsDraggingTag(false);
      setDraggedTag(null);
    }
  };

  const handleCategoryDoubleClick = (categoryName: string) => {
    setEditingCategoryId(categoryName);
    setEditingCategoryName(categoryName);
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingCategoryName(e.target.value);
  };

  const handleCategoryNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, originalName: string) => {
    if (e.key === 'Enter') {
      const newName = editingCategoryName.trim();
      if (newName && newName !== originalName) {
        const existingCategory = categories.find(
          (cat: Category) => cat.name.toLowerCase() === newName.toLowerCase() && cat.name !== originalName
        );

        let updatedCategories: Category[];
        if (existingCategory) {
          // Merge categories if the new name already exists
          updatedCategories = categories
            .map((cat: Category) => {
              if (cat.name === originalName) {
                return null; // Remove the original category
              }
              if (cat.name.toLowerCase() === newName.toLowerCase()) {
                // Merge tags into existing category
                const mergedTags = [...new Set([...cat.tags, ...categories.find((c: Category) => c.name === originalName)?.tags || []])];
                return { ...cat, tags: mergedTags };
              }
              return cat;
            })
            .filter((cat: Category | null): cat is Category => cat !== null);
        } else {
          // Simply rename the category
          updatedCategories = categories.map((cat: Category) =>
            cat.name === originalName ? { ...cat, name: newName } : cat
          );
        }
        
        setCategories(updatedCategories);
      }
      setEditingCategoryId(null);
    } else if (e.key === 'Escape') {
      setEditingCategoryId(null);
    }
  };

  const generateUniqueKey = (category: Category, index: number, tag?: string, tagIndex?: number) => {
    if (tag && typeof tagIndex === 'number') {
      return `category-${category.id}-${index}-tag-${tagIndex}-${tag}`;
    }
    return `category-${category.id}-${index}`;
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    if (e.shiftKey) {
      toggleExcludedTag(tag);
    } else {
      toggleTag(tag);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search subjects..."
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          value={searchQuery}
          className="w-full px-4 py-2 pl-10 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div 
        className="border-2 border-transparent rounded-lg p-4"
        onDragOver={(e) => {
          e.preventDefault();
          if (draggedTag && allCategorizedTags.includes(draggedTag)) {
            e.currentTarget.classList.add(
              'border-dashed',
              'border-blue-500',
              'bg-blue-50',
              'dark:bg-blue-900/20'
            );
          }
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove(
            'border-dashed',
            'border-blue-500',
            'bg-blue-50',
            'dark:bg-blue-900/20'
          );
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove(
            'border-dashed',
            'border-blue-500',
            'bg-blue-50',
            'dark:bg-blue-900/20'
          );
          handleUncategorize();
        }}
      >
        <div className="flex flex-wrap gap-2">
          {allTags
            .filter(tag => !allCategorizedTags.includes(tag))
            .map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleTagClick(e, tag)}
                draggable
                onDragStart={() => handleDragStart(tag)}
                onDragEnd={handleDragEnd}
                className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 cursor-grab active:cursor-grabbing
                  ${selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : excludedTags.includes(tag)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {tag} ({getTagCount(tag)})
              </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isDraggingTag && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop();
              }}
              className="mt-4 border-2 border-dashed border-blue-500 rounded-lg p-4 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20"
            >
              {showCategoryInput ? (
                <div className="relative w-full max-w-xs">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    autoFocus
                    placeholder="Enter category name"
                    className="w-full px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 
                             dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={handleCategoryInput}
                    onKeyDown={handleCategoryInputKeyDown}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowCategorySuggestions(false);
                        handleCategoryInputComplete();
                      }, 200);
                    }}
                  />
                  {showCategorySuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 
                                  rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      {categorySuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleCategorySuggestionClick(suggestion)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm
                                   first:rounded-t-lg last:rounded-b-lg
                                   ${index === selectedCategoryIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                          onMouseEnter={() => setSelectedCategoryIndex(index)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-blue-600 dark:text-blue-400">
                  Add to category
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {categories.map((category, categoryIndex) => (
        <div 
          key={generateUniqueKey(category, categoryIndex)} 
          className="space-y-2"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add(
              'border-2',
              'border-dashed',
              'border-blue-500',
              'rounded-lg',
              'bg-blue-50',
              'dark:bg-blue-900/20'
            );
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove(
              'border-2',
              'border-dashed',
              'border-blue-500',
              'rounded-lg',
              'bg-blue-50',
              'dark:bg-blue-900/20'
            );
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove(
              'border-2',
              'border-dashed',
              'border-blue-500',
              'rounded-lg',
              'bg-blue-50',
              'dark:bg-blue-900/20'
            );
            handleCategoryDrop(category.name, e);
          }}
        >
          <div className="flex items-center gap-4">
            {editingCategoryId === category.name ? (
              <div className="flex-grow">
                <input
                  ref={editCategoryInputRef}
                  type="text"
                  value={editingCategoryName}
                  onChange={handleCategoryNameChange}
                  onKeyDown={(e) => handleCategoryNameKeyDown(e, category.name)}
                  onBlur={() => setEditingCategoryId(null)}
                  autoFocus
                  className="text-xl font-semibold px-2 py-1 rounded-lg border border-gray-200 
                           dark:border-gray-700 dark:bg-gray-800 focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <h2 
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 p-2 cursor-pointer flex-shrink-0"
                onDoubleClick={() => handleCategoryDoubleClick(category.name)}
              >
                {category.name}
              </h2>
            )}
            <div className="flex flex-wrap gap-2">
              {category.tags
                .filter(tag => getTagCount(tag) > 0)
                .map((tag, tagIndex: number) => (
                <motion.button
                  key={generateUniqueKey(category, categoryIndex, tag, tagIndex)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleTagClick(e, tag)}
                  draggable
                  onDragStart={() => handleDragStart(tag)}
                  onDragEnd={handleDragEnd}
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 cursor-grab active:cursor-grabbing
                    ${selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : excludedTags.includes(tag)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {tag} ({getTagCount(tag)})
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 