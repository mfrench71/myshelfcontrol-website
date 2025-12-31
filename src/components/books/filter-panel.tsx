/**
 * Filter Panel Component
 * Desktop sidebar and mobile bottom sheet for book filtering
 */

'use client';

import { useState, useId } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { Genre, Series, BookFilters } from '@/lib/types';

type SortOption = 'createdAt-desc' | 'createdAt-asc' | 'title-asc' | 'title-desc' | 'author-asc' | 'author-desc' | 'rating-desc' | 'rating-asc';

type FilterPanelProps = {
  genres: Genre[];
  series: Series[];
  filters: BookFilters;
  sortValue: SortOption;
  onFiltersChange: (filters: BookFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'createdAt-desc', label: 'Date Added (Newest)' },
  { value: 'createdAt-asc', label: 'Date Added (Oldest)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'author-asc', label: 'Author (A-Z)' },
  { value: 'author-desc', label: 'Author (Z-A)' },
  { value: 'rating-desc', label: 'Rating (High-Low)' },
  { value: 'rating-asc', label: 'Rating (Low-High)' },
];

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
 * Calculate contrasting text colour for a background
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Desktop Filter Sidebar
 */
export function FilterSidebar({
  genres,
  series,
  filters,
  sortValue,
  onFiltersChange,
  onSortChange,
  onReset,
}: FilterPanelProps) {
  const id = useId();
  const [showMoreFilters, setShowMoreFilters] = useState(!!filters.seriesId);

  const handleStatusChange = (status: string, checked: boolean) => {
    // Single-select for now (matching old behaviour more closely)
    onFiltersChange({
      ...filters,
      status: checked ? (status as BookFilters['status']) : undefined,
    });
  };

  const handleGenreChange = (genreId: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      genreId: checked ? genreId : undefined,
    });
  };

  const handleSeriesChange = (seriesId: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      seriesId: checked ? seriesId : undefined,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: rating || undefined,
    });
  };

  const hasActiveFilters =
    filters.status || filters.genreId || filters.seriesId || filters.minRating;

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
          {SORT_OPTIONS.map((option) => (
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
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`${id}-status-${option.value}`}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm text-gray-900">{option.label}</span>
              <input
                type="checkbox"
                id={`${id}-status-${option.value}`}
                checked={filters.status === option.value}
                onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
              />
            </label>
          ))}
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
          {RATING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Genre */}
      {genres.length > 0 && (
        <div>
          <span className="block text-sm font-semibold text-gray-900 mb-2">Genre</span>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {genres.map((genre) => (
              <label
                key={genre.id}
                htmlFor={`${id}-genre-${genre.id}`}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm text-gray-900">{genre.name}</span>
                <input
                  type="checkbox"
                  id={`${id}-genre-${genre.id}`}
                  checked={filters.genreId === genre.id}
                  onChange={(e) => handleGenreChange(genre.id, e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* More Filters Toggle */}
      {series.length > 0 && (
        <>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1 min-h-[44px]"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            <span>{showMoreFilters ? 'Less' : 'More'}</span>
          </button>

          {/* Series (in More section) */}
          {showMoreFilters && (
            <div>
              <span className="block text-sm font-semibold text-gray-900 mb-2">Series</span>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {series.map((s) => (
                  <label
                    key={s.id}
                    htmlFor={`${id}-series-${s.id}`}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm text-gray-900">{s.name}</span>
                    <input
                      type="checkbox"
                      id={`${id}-series-${s.id}`}
                      checked={filters.seriesId === s.id}
                      onChange={(e) => handleSeriesChange(s.id, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                    />
                  </label>
                ))}
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
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
      aria-label="Sort books by"
    >
      {SORT_OPTIONS.map((option) => (
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
  filters,
  onFiltersChange,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  genres: Genre[];
  series: Series[];
  filters: BookFilters;
  onFiltersChange: (filters: BookFilters) => void;
  onReset: () => void;
}) {
  const id = useId();
  const [showMoreFilters, setShowMoreFilters] = useState(!!filters.seriesId);

  const handleStatusChange = (status: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      status: checked ? (status as BookFilters['status']) : undefined,
    });
  };

  const handleGenreChange = (genreId: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      genreId: checked ? genreId : undefined,
    });
  };

  const handleSeriesChange = (seriesId: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      seriesId: checked ? seriesId : undefined,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: rating || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 md:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-sheet-title"
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-200 flex items-center justify-between">
          <h2 id="filter-sheet-title" className="text-lg font-semibold">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div>
            <span className="block text-sm font-semibold text-gray-900 mb-2">Status</span>
            <div className="space-y-3">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`${id}-mobile-status-${option.value}`}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-gray-900">{option.label}</span>
                  <input
                    type="checkbox"
                    id={`${id}-mobile-status-${option.value}`}
                    checked={filters.status === option.value}
                    onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                </label>
              ))}
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
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre */}
          {genres.length > 0 && (
            <div>
              <span className="block text-sm font-semibold text-gray-900 mb-2">Genre</span>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    htmlFor={`${id}-mobile-genre-${genre.id}`}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm text-gray-900">{genre.name}</span>
                    <input
                      type="checkbox"
                      id={`${id}-mobile-genre-${genre.id}`}
                      checked={filters.genreId === genre.id}
                      onChange={(e) => handleGenreChange(genre.id, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Series */}
          {series.length > 0 && (
            <>
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`}
                />
                <span>{showMoreFilters ? 'Less' : 'More'}</span>
              </button>

              {showMoreFilters && (
                <div>
                  <span className="block text-sm font-semibold text-gray-900 mb-2">Series</span>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {series.map((s) => (
                      <label
                        key={s.id}
                        htmlFor={`${id}-mobile-series-${s.id}`}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span className="text-sm text-gray-900">{s.name}</span>
                        <input
                          type="checkbox"
                          id={`${id}-mobile-series-${s.id}`}
                          checked={filters.seriesId === s.id}
                          onChange={(e) => handleSeriesChange(s.id, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Reset */}
          <button
            onClick={() => {
              onReset();
            }}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Active filter chip for mobile display
 */
export function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
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
