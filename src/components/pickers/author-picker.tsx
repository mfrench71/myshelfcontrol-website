/**
 * AuthorPicker Component
 * Single-select author picker with typeahead and library suggestions
 */
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Plus, User } from 'lucide-react';
import { getBooks } from '@/lib/repositories/books';
import { normalizeAuthor, debounce } from '@/lib/utils';
import type { Book } from '@/lib/types';

/** Author data with count */
interface AuthorData {
  name: string;
  normalizedName: string;
  count: number;
}

export interface AuthorPickerProps {
  /** Current user's ID */
  userId: string;
  /** Current author value */
  value: string;
  /** Callback when value changes */
  onChange: (author: string) => void;
  /** Optional label override */
  label?: string;
  /** Whether field is required */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Optional placeholder */
  placeholder?: string;
}

export function AuthorPicker({
  userId,
  value,
  onChange,
  label = 'Author',
  required = false,
  disabled = false,
  placeholder = 'Search or enter author...',
}: AuthorPickerProps) {
  // State
  const [authors, setAuthors] = useState<AuthorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync searchQuery with external value changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Load authors from user's books on mount
  useEffect(() => {
    async function loadAuthors() {
      if (!userId) return;
      try {
        setIsLoading(true);
        const books = await getBooks(userId);
        const authorData = extractAuthorsFromBooks(books);
        setAuthors(authorData);
      } catch (error) {
        console.error('Failed to load authors:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuthors();
  }, [userId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Extract unique authors with counts from books
   */
  function extractAuthorsFromBooks(books: Book[]): AuthorData[] {
    const authorCounts: Record<string, AuthorData> = {};

    books.forEach((book) => {
      if (book.author && !book.deletedAt) {
        const normalized = normalizeAuthor(book.author);
        if (!authorCounts[normalized]) {
          authorCounts[normalized] = {
            name: book.author,
            normalizedName: normalized,
            count: 0,
          };
        }
        authorCounts[normalized].count++;
      }
    });

    // Sort by count descending, then alphabetically
    return Object.values(authorCounts).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }

  // Get filtered authors based on search query
  const filteredAuthors = useMemo(() => {
    if (!searchQuery) return authors.slice(0, 20);
    const queryNorm = normalizeAuthor(searchQuery);
    return authors.filter((a) => a.normalizedName.includes(queryNorm)).slice(0, 20);
  }, [authors, searchQuery]);

  // Check if we should show "Use typed value" option
  const showUseTyped = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 1) return false;
    const queryNorm = normalizeAuthor(searchQuery);
    const exactMatch = authors.some((a) => a.normalizedName === queryNorm);
    return !exactMatch;
  }, [searchQuery, authors]);

  // Calculate total items for keyboard navigation
  const totalItems = useMemo(() => {
    let count = 0;
    if (showUseTyped) count += 1;
    count += filteredAuthors.length;
    return count;
  }, [filteredAuthors, showUseTyped]);

  // Debounced onChange
  const debouncedOnChange = useMemo(
    () =>
      debounce((val: string) => {
        onChange(val);
      }, 150),
    [onChange]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchQuery(val);
      setIsOpen(true);
      setFocusedIndex(-1);
      debouncedOnChange(val);
    },
    [debouncedOnChange]
  );

  // Handle selecting an author
  const handleSelectAuthor = useCallback(
    (author: string) => {
      setSearchQuery(author);
      setIsOpen(false);
      setFocusedIndex(-1);
      onChange(author);
      inputRef.current?.focus();
    },
    [onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) {
            // Find and click the focused item
            const items = containerRef.current?.querySelectorAll('[data-picker-item]');
            if (items && items[focusedIndex]) {
              (items[focusedIndex] as HTMLElement).click();
            }
          } else if (searchQuery) {
            // Use typed value
            handleSelectAuthor(searchQuery);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'Tab':
          // Commit value and close on Tab
          setIsOpen(false);
          onChange(searchQuery);
          break;
      }
    },
    [focusedIndex, totalItems, searchQuery, handleSelectAuthor, onChange]
  );

  // Render dropdown content
  const renderDropdownContent = () => {
    const sections: React.ReactNode[] = [];
    let currentIndex = 0;

    // "Use typed value" option
    if (showUseTyped) {
      const isFocused = focusedIndex === currentIndex;
      sections.push(
        <button
          key="use-typed"
          type="button"
          data-picker-item
          className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
            isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          onClick={() => handleSelectAuthor(searchQuery)}
        >
          <Plus className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
          <span>Use &quot;{searchQuery}&quot;</span>
        </button>
      );
      currentIndex++;
    }

    // Your authors section
    if (filteredAuthors.length > 0) {
      if (sections.length > 0) {
        sections.push(<div key="divider" className="border-t border-gray-100 dark:border-gray-700" />);
      }
      sections.push(
        <div key="authors-header" className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
          Your authors
        </div>
      );

      filteredAuthors.forEach((author, i) => {
        const index = currentIndex + i;
        const isFocused = focusedIndex === index;

        sections.push(
          <button
            key={author.name}
            type="button"
            data-picker-item
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            onClick={() => handleSelectAuthor(author.name)}
          >
            <User className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1">{author.name}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {author.count} {author.count === 1 ? 'book' : 'books'}
            </span>
          </button>
        );
      });
    }

    // Empty state
    if (sections.length === 0) {
      if (authors.length === 0) {
        sections.push(
          <div key="empty" className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
            No authors in your library yet
          </div>
        );
      } else {
        sections.push(
          <div key="no-matches" className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
            No matches found
          </div>
        );
      }
    }

    return sections;
  };

  return (
    <div ref={containerRef} className="author-picker">
      <label id="author-picker-label" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="author"
          role="combobox"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder={isLoading ? 'Loading...' : placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="author-picker-listbox"
          aria-labelledby="author-picker-label"
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Dropdown */}
        {isOpen && (
          <div
            id="author-picker-listbox"
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            role="listbox"
            aria-label="Author options"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Select author</span>
              <button
                type="button"
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                onClick={() => {
                  setIsOpen(false);
                  setFocusedIndex(-1);
                }}
                aria-label="Close dropdown"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            {renderDropdownContent()}
          </div>
        )}
      </div>
    </div>
  );
}
