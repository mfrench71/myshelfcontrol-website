/**
 * GenrePicker Component
 * Multi-select genre picker with typeahead, suggestions, and create-new option
 */
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { getGenres, createGenre } from '@/lib/repositories/genres';
import { getContrastColor, normalizeGenreName, getNextAvailableColor } from '@/lib/utils';
import type { Genre } from '@/lib/types';

export interface GenrePickerProps {
  /** Current user's ID */
  userId: string;
  /** Currently selected genre IDs */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** API suggestions (genre names from book lookup) */
  suggestions?: string[];
  /** Whether to show API suggestions first (default: false = user genres first) */
  suggestionsFirst?: boolean;
  /** Optional label override */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function GenrePicker({
  userId,
  selected,
  onChange,
  suggestions = [],
  suggestionsFirst = false,
  label = 'Genres',
  disabled = false,
}: GenrePickerProps) {
  // State
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load genres on mount
  useEffect(() => {
    async function loadGenres() {
      if (!userId) return;
      try {
        setIsLoading(true);
        const userGenres = await getGenres(userId);
        setGenres(userGenres);
      } catch (error) {
        console.error('Failed to load genres:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadGenres();
  }, [userId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected genre objects
  const selectedGenres = useMemo(() => {
    return selected
      .map((id) => genres.find((g) => g.id === id))
      .filter((g): g is Genre => Boolean(g))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selected, genres]);

  // Get filtered genres based on search
  const filteredGenres = useMemo(() => {
    if (!searchQuery) return genres;
    const query = normalizeGenreName(searchQuery);
    return genres.filter((g) => normalizeGenreName(g.name).includes(query));
  }, [genres, searchQuery]);

  // Get filtered suggestions (exclude selected and existing)
  const filteredSuggestions = useMemo(() => {
    const selectedNames = new Set(selectedGenres.map((g) => normalizeGenreName(g.name)));
    const existingNames = new Set(genres.map((g) => normalizeGenreName(g.name)));

    return suggestions.filter((name) => {
      const normalized = normalizeGenreName(name);
      if (selectedNames.has(normalized)) return false;
      if (existingNames.has(normalized)) return false;
      if (searchQuery) {
        return normalized.includes(normalizeGenreName(searchQuery));
      }
      return true;
    });
  }, [suggestions, selectedGenres, genres, searchQuery]);

  // Check if create option should show
  const showCreateOption = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 1) return false;
    const query = normalizeGenreName(searchQuery);
    const exists = genres.some((g) => normalizeGenreName(g.name) === query);
    const inSuggestions = suggestions.some((s) => normalizeGenreName(s) === query);
    return !exists && !inSuggestions;
  }, [searchQuery, genres, suggestions]);

  // Calculate total items for keyboard navigation
  const totalItems = useMemo(() => {
    let count = 0;
    if (suggestionsFirst) {
      count += filteredSuggestions.length;
      count += filteredGenres.length;
    } else {
      count += filteredGenres.length;
      count += filteredSuggestions.length;
    }
    if (showCreateOption) count += 1;
    return count;
  }, [filteredGenres, filteredSuggestions, showCreateOption, suggestionsFirst]);

  // Handle genre toggle
  const handleToggleGenre = useCallback(
    (genreId: string) => {
      const newSelected = selected.includes(genreId)
        ? selected.filter((id) => id !== genreId)
        : [...selected, genreId];
      onChange(newSelected);
      setSearchQuery('');
      setFocusedIndex(-1);
      inputRef.current?.focus();
    },
    [selected, onChange]
  );

  // Handle remove genre
  const handleRemoveGenre = useCallback(
    (genreId: string) => {
      onChange(selected.filter((id) => id !== genreId));
    },
    [selected, onChange]
  );

  // Handle suggestion click (create genre and select)
  const handleAddSuggestion = useCallback(
    async (name: string) => {
      try {
        const usedColors = genres.map((g) => g.color);
        const color = getNextAvailableColor(usedColors);
        const newGenreId = await createGenre(userId, name, color);

        // Refresh genres list
        const updatedGenres = await getGenres(userId);
        setGenres(updatedGenres);

        // Select the new genre
        onChange([...selected, newGenreId]);
        setSearchQuery('');
        setFocusedIndex(-1);
        inputRef.current?.focus();
      } catch (error) {
        console.error('Failed to create genre:', error);
      }
    },
    [userId, genres, selected, onChange]
  );

  // Handle create new genre
  const handleCreateGenre = useCallback(async () => {
    if (!searchQuery.trim()) return;
    await handleAddSuggestion(searchQuery.trim());
  }, [searchQuery, handleAddSuggestion]);

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
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          setFocusedIndex(-1);
          break;
      }
    },
    [focusedIndex, totalItems]
  );

  // Render dropdown content sections
  const renderUserGenres = (startIndex: number) => {
    if (filteredGenres.length === 0) return { jsx: null, nextIndex: startIndex };

    const items = filteredGenres.map((genre, i) => {
      const index = startIndex + i;
      const isSelected = selected.includes(genre.id);
      const isFocused = focusedIndex === index;
      const safeColor = /^#[0-9A-Fa-f]{6}$/.test(genre.color) ? genre.color : '#6b7280';

      return (
        <button
          key={genre.id}
          type="button"
          role="option"
          aria-selected={isSelected}
          data-picker-item
          className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
            isFocused ? 'bg-gray-100' : ''
          }`}
          onClick={() => handleToggleGenre(genre.id)}
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: safeColor }}
          />
          <span className="flex-1">{genre.name}</span>
          {isSelected && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
        </button>
      );
    });

    return {
      jsx: (
        <div key="user-genres">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">Your genres</div>
          {items}
        </div>
      ),
      nextIndex: startIndex + filteredGenres.length,
    };
  };

  const renderSuggestions = (startIndex: number) => {
    if (filteredSuggestions.length === 0) return { jsx: null, nextIndex: startIndex };

    const items = filteredSuggestions.map((name, i) => {
      const index = startIndex + i;
      const isFocused = focusedIndex === index;

      return (
        <button
          key={name}
          type="button"
          role="option"
          aria-selected={false}
          data-picker-item
          className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
            isFocused ? 'bg-gray-100' : ''
          }`}
          onClick={() => handleAddSuggestion(name)}
        >
          <Plus className="w-4 h-4 text-green-500" aria-hidden="true" />
          <span>{name}</span>
        </button>
      );
    });

    return {
      jsx: (
        <div key="suggestions">
          <div className="border-t border-gray-100" />
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
            Suggested from book
          </div>
          {items}
        </div>
      ),
      nextIndex: startIndex + filteredSuggestions.length,
    };
  };

  return (
    <div ref={containerRef} className="genre-picker">
      <label id="genre-picker-label" className="block font-semibold text-gray-700 mb-1">
        {label}
      </label>

      {/* Selected genres */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedGenres.map((genre) => (
          <span
            key={genre.id}
            className="inline-flex items-center py-1 px-2.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: genre.color,
              color: getContrastColor(genre.color),
            }}
          >
            {genre.name}
            <button
              type="button"
              className="ml-1.5 -mr-1 hover:opacity-75"
              onClick={() => handleRemoveGenre(genre.id)}
              aria-label={`Remove ${genre.name}`}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder={isLoading ? 'Loading genres...' : 'Add genre...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="genre-picker-listbox"
          aria-labelledby="genre-picker-label"
          aria-autocomplete="list"
        />

        {/* Dropdown */}
        {isOpen && (
          <div
            id="genre-picker-listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            role="listbox"
            aria-label="Genre options"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Select genres</span>
              <button
                type="button"
                className="p-1 hover:bg-gray-200 rounded"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                  setFocusedIndex(-1);
                }}
                aria-label="Close dropdown"
              >
                <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            {(() => {
              let currentIndex = 0;
              const sections: React.ReactNode[] = [];

              if (suggestionsFirst) {
                const suggestionsResult = renderSuggestions(currentIndex);
                if (suggestionsResult.jsx) sections.push(suggestionsResult.jsx);
                currentIndex = suggestionsResult.nextIndex;

                const genresResult = renderUserGenres(currentIndex);
                if (genresResult.jsx) sections.push(genresResult.jsx);
                currentIndex = genresResult.nextIndex;
              } else {
                const genresResult = renderUserGenres(currentIndex);
                if (genresResult.jsx) sections.push(genresResult.jsx);
                currentIndex = genresResult.nextIndex;

                const suggestionsResult = renderSuggestions(currentIndex);
                if (suggestionsResult.jsx) sections.push(suggestionsResult.jsx);
                currentIndex = suggestionsResult.nextIndex;
              }

              // Create new option
              if (showCreateOption) {
                const isFocused = focusedIndex === currentIndex;
                sections.push(
                  <div key="create">
                    <div className="border-t border-gray-100" />
                    <button
                      type="button"
                      data-picker-item
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-primary ${
                        isFocused ? 'bg-gray-100' : ''
                      }`}
                      onClick={handleCreateGenre}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Create &quot;{searchQuery}&quot;</span>
                    </button>
                  </div>
                );
              }

              // Hint if no search query
              if (!searchQuery && sections.length > 0) {
                sections.push(
                  <div key="hint" className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
                    Type a name to create a new genre
                  </div>
                );
              }

              // Empty state
              if (sections.length === 0 && !showCreateOption) {
                sections.push(
                  <div key="empty" className="px-3 py-4 text-center text-gray-500">
                    Type to search or create a genre
                  </div>
                );
              }

              return sections;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
