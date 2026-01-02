/**
 * Filter Panel Component
 * Desktop sidebar and mobile bottom sheet for book filtering
 */

'use client';

import { useState, useId, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { Genre, Series, BookFilters } from '@/lib/types';
import { BottomSheet } from '@/components/ui/modal';

export type SortOption = 'createdAt-desc' | 'createdAt-asc' | 'title-asc' | 'title-desc' | 'author-asc' | 'author-desc' | 'rating-desc' | 'rating-asc' | 'seriesPosition-asc';

/** Book counts for filter options (faceted filtering) */
export type BookCounts = {
  genres: Record<string, number>;
  statuses: { reading: number; finished: number };
  series: Record<string, number>;
  ratings: Record<number, number>; // minRating -> count of books with that rating or higher
  authors: Record<string, number>; // author name -> book count
  total: number;
};

type FilterPanelProps = {
  genres: Genre[];
  series: Series[];
  authors: string[];
  filters: BookFilters;
  sortValue: SortOption;
  bookCounts?: BookCounts;
  onFiltersChange: (filters: BookFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
};

const BASE_SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'createdAt-desc', label: 'Date Added (Newest)' },
  { value: 'createdAt-asc', label: 'Date Added (Oldest)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'author-asc', label: 'Author (A-Z)' },
  { value: 'author-desc', label: 'Author (Z-A)' },
  { value: 'rating-desc', label: 'Rating (High-Low)' },
  { value: 'rating-asc', label: 'Rating (Low-High)' },
];

const SERIES_SORT_OPTION: { value: SortOption; label: string } = {
  value: 'seriesPosition-asc',
  label: 'Series Order',
};

const STATUS_OPTIONS = [
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'All Ratings' },
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' },
];

/**
 * Author Typeahead Input
 */
function AuthorTypeahead({
  id,
  authors,
  value,
  authorCounts,
  onChange,
}: {
  id: string;
  authors: string[];
  value: string;
  authorCounts?: Record<string, number>;
  onChange: (author: string) => void;
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter authors based on query
  const filteredAuthors = query
    ? authors.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
    : authors;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync input with external value changes (controlled component pattern)
  useEffect(() => {
    const newValue = value || '';
    if (newValue !== query) {
      setQuery(newValue);
    }
  }, [value, query]);

  const handleSelect = (author: string) => {
    setQuery(author);
    setIsOpen(false);
    setFocusedIndex(-1);
    onChange(author);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true);
      setFocusedIndex(0);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredAuthors.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredAuthors.length) {
          handleSelect(filteredAuthors[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search authors..."
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
        />
        {(query || value) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            aria-label="Clear author filter"
          >
            <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && filteredAuthors.length > 0 && (
        <div
          ref={dropdownRef}
          id={`${id}-listbox`}
          className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto dropdown-enter"
          role="listbox"
        >
          {filteredAuthors.map((author, index) => {
            const count = authorCounts?.[author] ?? 0;
            return (
              <button
                key={author}
                type="button"
                onClick={() => handleSelect(author)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 min-h-[44px] flex items-center justify-between ${
                  index === focusedIndex ? 'bg-gray-100' : ''
                } ${value === author ? 'text-primary font-medium' : 'text-gray-900'}`}
                role="option"
                aria-selected={value === author}
              >
                <span>{author}</span>
                <span className="text-gray-400 text-xs">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query && filteredAuthors.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dropdown-enter"
        >
          <div className="px-3 py-2 text-sm text-gray-500 italic">No authors found</div>
        </div>
      )}
    </div>
  );
}

/**
 * Desktop Filter Sidebar
 */
export function FilterSidebar({
  genres,
  series,
  authors,
  filters,
  sortValue,
  bookCounts,
  onFiltersChange,
  onSortChange,
  onReset,
}: FilterPanelProps) {
  const id = useId();
  const [showMoreFilters, setShowMoreFilters] = useState(
    !!(filters.seriesIds && filters.seriesIds.length > 0)
  );

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = checked
      ? [...currentStatuses, status as 'reading' | 'finished' | 'want-to-read']
      : currentStatuses.filter((s) => s !== status);

    onFiltersChange({
      ...filters,
      statuses: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleGenreChange = (genreId: string, checked: boolean) => {
    const currentGenres = filters.genreIds || [];
    const newGenres = checked
      ? [...currentGenres, genreId]
      : currentGenres.filter((g) => g !== genreId);

    onFiltersChange({
      ...filters,
      genreIds: newGenres.length > 0 ? newGenres : undefined,
    });
  };

  const handleSeriesChange = (seriesId: string, checked: boolean) => {
    const currentSeries = filters.seriesIds || [];
    const newSeries = checked
      ? [...currentSeries, seriesId]
      : currentSeries.filter((s) => s !== seriesId);

    onFiltersChange({
      ...filters,
      seriesIds: newSeries.length > 0 ? newSeries : undefined,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: rating || undefined,
    });
  };

  const handleAuthorChange = (author: string) => {
    onFiltersChange({
      ...filters,
      author: author || undefined,
    });
  };

  const hasActiveFilters =
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.genreIds && filters.genreIds.length > 0) ||
    (filters.seriesIds && filters.seriesIds.length > 0) ||
    filters.minRating ||
    filters.author ||
    sortValue !== 'createdAt-desc'; // Also reset if sort is non-default

  // Include series sort option only when filtering by a series
  const sortOptions = filters.seriesIds && filters.seriesIds.length > 0
    ? [SERIES_SORT_OPTION, ...BASE_SORT_OPTIONS]
    : BASE_SORT_OPTIONS;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Sort */}
      <div>
        <label htmlFor={`${id}-sort`} className="block text-sm font-semibold text-gray-900 mb-2">
          Sort By
        </label>
        <select
          id={`${id}-sort`}
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <span className="block text-sm font-semibold text-gray-900 mb-2">Status</span>
        <div className="space-y-3">
          {STATUS_OPTIONS.map((option) => {
            const count = bookCounts?.statuses?.[option.value as 'reading' | 'finished'] ?? 0;
            return (
              <label
                key={option.value}
                htmlFor={`${id}-status-${option.value}`}
                className={`flex items-center justify-between cursor-pointer ${count === 0 ? 'opacity-50' : ''}`}
              >
                <span className="text-sm text-gray-900">{option.label}</span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">({count})</span>
                  <input
                    type="checkbox"
                    id={`${id}-status-${option.value}`}
                    checked={filters.statuses?.includes(option.value as 'reading' | 'finished' | 'want-to-read') || false}
                    onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                    disabled={count === 0 && !filters.statuses?.includes(option.value as 'reading' | 'finished' | 'want-to-read')}
                  />
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label htmlFor={`${id}-rating`} className="block text-sm font-semibold text-gray-900 mb-2">
          Rating
        </label>
        <select
          id={`${id}-rating`}
          value={filters.minRating || 0}
          onChange={(e) => handleRatingChange(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm cursor-pointer"
        >
          {RATING_OPTIONS.map((option) => {
            const count = option.value === 0 ? bookCounts?.total ?? 0 : bookCounts?.ratings?.[option.value] ?? 0;
            const isSelected = (filters.minRating || 0) === option.value;
            return (
              <option
                key={option.value}
                value={option.value}
                disabled={count === 0 && !isSelected && option.value !== 0}
              >
                {option.label} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Author */}
      {authors.length > 0 && (
        <div>
          <label htmlFor={`${id}-author`} className="block text-sm font-semibold text-gray-900 mb-2">
            Author
          </label>
          <AuthorTypeahead
            id={`${id}-author`}
            authors={authors}
            value={filters.author || ''}
            authorCounts={bookCounts?.authors}
            onChange={handleAuthorChange}
          />
        </div>
      )}

      {/* Genre */}
      {genres.length > 0 && (
        <div>
          <span className="block text-sm font-semibold text-gray-900 mb-2">Genre</span>
          <div className="scroll-fade-container">
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 pb-4">
              {genres.map((genre) => {
              const count = bookCounts?.genres?.[genre.id] ?? 0;
              const isSelected = filters.genreIds?.includes(genre.id) || false;
              return (
                <label
                  key={genre.id}
                  htmlFor={`${id}-genre-${genre.id}`}
                  className={`flex items-center justify-between cursor-pointer ${count === 0 && !isSelected ? 'opacity-50' : ''}`}
                >
                  <span className="text-sm text-gray-900">{genre.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">({count})</span>
                    <input
                      type="checkbox"
                      id={`${id}-genre-${genre.id}`}
                      checked={isSelected}
                      onChange={(e) => handleGenreChange(genre.id, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                      disabled={count === 0 && !isSelected}
                    />
                  </span>
                </label>
              );
              })}
            </div>
          </div>
        </div>
      )}

      {/* More Filters Toggle (Series) */}
      {series.length > 0 && (
        <>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1 min-h-[44px]"
          >
            <ChevronDown
              className={`w-4 h-4 accordion-icon ${showMoreFilters ? 'open' : ''}`}
              aria-hidden="true"
            />
            <span>{showMoreFilters ? 'Less' : 'More'}</span>
          </button>

          {showMoreFilters && (
            <div>
              <span className="block text-sm font-semibold text-gray-900 mb-2">Series</span>
              <div className="scroll-fade-container">
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 pb-4">
                {series.map((s) => {
                  const count = bookCounts?.series?.[s.id] ?? 0;
                  const isSelected = filters.seriesIds?.includes(s.id) || false;
                  return (
                    <label
                      key={s.id}
                      htmlFor={`${id}-series-${s.id}`}
                      className={`flex items-center justify-between cursor-pointer ${count === 0 && !isSelected ? 'opacity-50' : ''}`}
                    >
                      <span className="text-sm text-gray-900">{s.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">({count})</span>
                        <input
                          type="checkbox"
                          id={`${id}-series-${s.id}`}
                          checked={isSelected}
                          onChange={(e) => handleSeriesChange(s.id, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                          disabled={count === 0 && !isSelected}
                        />
                      </span>
                    </label>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reset Button */}
      <button
        onClick={onReset}
        disabled={!hasActiveFilters}
        className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reset Filters
      </button>
    </div>
  );
}

/**
 * Mobile Sort Dropdown (always visible on mobile)
 */
export function MobileSortDropdown({
  value,
  onChange,
  hasSeriesFilter,
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
  hasSeriesFilter?: boolean;
}) {
  // Include series sort option only when filtering by a series
  const sortOptions = hasSeriesFilter
    ? [SERIES_SORT_OPTION, ...BASE_SORT_OPTIONS]
    : BASE_SORT_OPTIONS;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
      aria-label="Sort books by"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Mobile Filter Bottom Sheet
 */
export function FilterBottomSheet({
  isOpen,
  onClose,
  genres,
  series,
  authors,
  filters,
  bookCounts,
  onFiltersChange,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  genres: Genre[];
  series: Series[];
  authors: string[];
  filters: BookFilters;
  bookCounts?: BookCounts;
  onFiltersChange: (filters: BookFilters) => void;
  onReset: () => void;
}) {
  const id = useId();
  const [showMoreFilters, setShowMoreFilters] = useState(
    !!(filters.seriesIds && filters.seriesIds.length > 0)
  );

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = checked
      ? [...currentStatuses, status as 'reading' | 'finished' | 'want-to-read']
      : currentStatuses.filter((s) => s !== status);

    onFiltersChange({
      ...filters,
      statuses: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleGenreChange = (genreId: string, checked: boolean) => {
    const currentGenres = filters.genreIds || [];
    const newGenres = checked
      ? [...currentGenres, genreId]
      : currentGenres.filter((g) => g !== genreId);

    onFiltersChange({
      ...filters,
      genreIds: newGenres.length > 0 ? newGenres : undefined,
    });
  };

  const handleSeriesChange = (seriesId: string, checked: boolean) => {
    const currentSeries = filters.seriesIds || [];
    const newSeries = checked
      ? [...currentSeries, seriesId]
      : currentSeries.filter((s) => s !== seriesId);

    onFiltersChange({
      ...filters,
      seriesIds: newSeries.length > 0 ? newSeries : undefined,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: rating || undefined,
    });
  };

  const handleAuthorChange = (author: string) => {
    onFiltersChange({
      ...filters,
      author: author || undefined,
    });
  };

  const hasActiveFilters =
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.genreIds && filters.genreIds.length > 0) ||
    (filters.seriesIds && filters.seriesIds.length > 0) ||
    filters.minRating ||
    filters.author;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      className="md:hidden !overflow-hidden flex flex-col"
      showCloseButton={false}
    >
      {/* Header - sticky */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 id="filter-sheet-title" className="text-lg font-semibold">
          Filters
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
        </button>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div>
            <span className="block text-sm font-semibold text-gray-900 mb-2">Status</span>
            <div className="space-y-3">
              {STATUS_OPTIONS.map((option) => {
                const count = bookCounts?.statuses?.[option.value as 'reading' | 'finished'] ?? 0;
                return (
                  <label
                    key={option.value}
                    htmlFor={`${id}-mobile-status-${option.value}`}
                    className={`flex items-center justify-between cursor-pointer ${count === 0 ? 'opacity-50' : ''}`}
                  >
                    <span className="text-sm text-gray-900">{option.label}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">({count})</span>
                      <input
                        type="checkbox"
                        id={`${id}-mobile-status-${option.value}`}
                        checked={filters.statuses?.includes(option.value as 'reading' | 'finished' | 'want-to-read') || false}
                        onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                        disabled={count === 0 && !filters.statuses?.includes(option.value as 'reading' | 'finished' | 'want-to-read')}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label
              htmlFor={`${id}-mobile-rating`}
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Rating
            </label>
            <select
              id={`${id}-mobile-rating`}
              value={filters.minRating || 0}
              onChange={(e) => handleRatingChange(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            >
              {RATING_OPTIONS.map((option) => {
                const count = option.value === 0 ? bookCounts?.total ?? 0 : bookCounts?.ratings?.[option.value] ?? 0;
                const isSelected = (filters.minRating || 0) === option.value;
                return (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={count === 0 && !isSelected && option.value !== 0}
                  >
                    {option.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Author */}
          {authors.length > 0 && (
            <div>
              <label htmlFor={`${id}-mobile-author`} className="block text-sm font-semibold text-gray-900 mb-2">
                Author
              </label>
              <AuthorTypeahead
                id={`${id}-mobile-author`}
                authors={authors}
                value={filters.author || ''}
                authorCounts={bookCounts?.authors}
                onChange={handleAuthorChange}
              />
            </div>
          )}

          {/* Genre */}
          {genres.length > 0 && (
            <div>
              <span className="block text-sm font-semibold text-gray-900 mb-2">Genre</span>
              <div className="scroll-fade-container">
                <div className="space-y-3 max-h-48 overflow-y-auto pr-3 pb-4">
                {genres.map((genre) => {
                  const count = bookCounts?.genres?.[genre.id] ?? 0;
                  const isSelected = filters.genreIds?.includes(genre.id) || false;
                  return (
                    <label
                      key={genre.id}
                      htmlFor={`${id}-mobile-genre-${genre.id}`}
                      className={`flex items-center justify-between cursor-pointer ${count === 0 && !isSelected ? 'opacity-50' : ''}`}
                    >
                      <span className="text-sm text-gray-900">{genre.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">({count})</span>
                        <input
                          type="checkbox"
                          id={`${id}-mobile-genre-${genre.id}`}
                          checked={isSelected}
                          onChange={(e) => handleGenreChange(genre.id, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                          disabled={count === 0 && !isSelected}
                        />
                      </span>
                    </label>
                  );
                })}
                </div>
              </div>
            </div>
          )}

          {/* More Filters (Series) */}
          {series.length > 0 && (
            <>
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <ChevronDown
                  className={`w-4 h-4 accordion-icon ${showMoreFilters ? 'open' : ''}`}
                  aria-hidden="true"
                />
                <span>{showMoreFilters ? 'Less' : 'More'}</span>
              </button>

              {showMoreFilters && (
                <div>
                  <span className="block text-sm font-semibold text-gray-900 mb-2">Series</span>
                  <div className="scroll-fade-container">
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-3 pb-4">
                    {series.map((s) => {
                      const count = bookCounts?.series?.[s.id] ?? 0;
                      const isSelected = filters.seriesIds?.includes(s.id) || false;
                      return (
                        <label
                          key={s.id}
                          htmlFor={`${id}-mobile-series-${s.id}`}
                          className={`flex items-center justify-between cursor-pointer ${count === 0 && !isSelected ? 'opacity-50' : ''}`}
                        >
                          <span className="text-sm text-gray-900">{s.name}</span>
                          <span className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">({count})</span>
                            <input
                              type="checkbox"
                              id={`${id}-mobile-series-${s.id}`}
                              checked={isSelected}
                              onChange={(e) => handleSeriesChange(s.id, e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                              disabled={count === 0 && !isSelected}
                            />
                          </span>
                        </label>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      {/* Footer - sticky */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="flex-1 py-3 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          disabled={!hasActiveFilters}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
}

/** Chip colour styles by filter type */
const CHIP_COLOURS: Record<string, string> = {
  rating: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  genre: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  status: 'bg-green-100 text-green-800 hover:bg-green-200',
  series: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  author: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
};

/**
 * Active filter chip - clickable button to remove filter
 * Entire chip is tappable for better mobile UX (44px min touch target)
 */
export function ActiveFilterChip({
  label,
  type,
  onRemove,
}: {
  label: string;
  type?: 'status' | 'genre' | 'series' | 'rating' | 'author';
  onRemove: () => void;
}) {
  const colours = type ? CHIP_COLOURS[type] : 'bg-gray-100 text-gray-800 hover:bg-gray-200';

  return (
    <button
      onClick={onRemove}
      className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] ${colours} rounded-full text-sm font-medium filter-chip chip-enter`}
      aria-label={`Remove ${label} filter`}
    >
      <span>{label}</span>
      <X className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Filter sidebar skeleton for loading state
 */
export function FilterSidebarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-14 mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-12 mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-14 mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  );
}
