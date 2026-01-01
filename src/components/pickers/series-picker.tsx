/**
 * SeriesPicker Component
 * Single-select series picker with typeahead, position input, and create-new option
 */
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Plus, Library } from 'lucide-react';
import { getSeries, createSeries } from '@/lib/repositories/series';
import { normalizeSeriesName } from '@/lib/utils';
import type { Series } from '@/lib/types';

export interface SeriesSelection {
  seriesId: string | null;
  seriesName: string;
  position: number | null;
}

export interface SeriesPickerProps {
  /** Current user's ID */
  userId: string;
  /** Currently selected series ID */
  selectedId: string | null;
  /** Current position in series */
  position: number | null;
  /** Callback when selection changes */
  onChange: (selection: SeriesSelection) => void;
  /** API suggestion (series name from book lookup) */
  suggestedName?: string | null;
  /** API suggested position */
  suggestedPosition?: number | null;
  /** Whether to show API suggestions first (default: false = user series first) */
  suggestionsFirst?: boolean;
  /** Optional label override */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function SeriesPicker({
  userId,
  selectedId,
  position,
  onChange,
  suggestedName = null,
  suggestedPosition = null,
  suggestionsFirst = false,
  label = 'Series',
  disabled = false,
}: SeriesPickerProps) {
  // State
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [localPosition, setLocalPosition] = useState<number | null>(position);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load series on mount
  useEffect(() => {
    async function loadSeries() {
      if (!userId) return;
      try {
        setIsLoading(true);
        const series = await getSeries(userId);
        setSeriesList(series);
      } catch (error) {
        console.error('Failed to load series:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSeries();
  }, [userId]);

  // Sync local position with prop
  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

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

  // Get selected series object
  const selectedSeries = useMemo(() => {
    if (!selectedId) return null;
    return seriesList.find((s) => s.id === selectedId) || null;
  }, [selectedId, seriesList]);

  // Get filtered series based on search
  const filteredSeries = useMemo(() => {
    if (!searchQuery) return seriesList;
    const query = normalizeSeriesName(searchQuery);
    return seriesList.filter((s) => normalizeSeriesName(s.name).includes(query));
  }, [seriesList, searchQuery]);

  // Check if suggestion matches existing series
  const existingMatch = useMemo(() => {
    if (!suggestedName) return null;
    const normalized = normalizeSeriesName(suggestedName);
    return seriesList.find((s) => normalizeSeriesName(s.name) === normalized) || null;
  }, [suggestedName, seriesList]);

  // Check if we should show suggestion in dropdown
  const showSuggestion = useMemo(() => {
    if (!suggestedName || selectedId || existingMatch) return false;
    if (searchQuery) {
      const query = normalizeSeriesName(searchQuery);
      return normalizeSeriesName(suggestedName).includes(query);
    }
    return true;
  }, [suggestedName, selectedId, existingMatch, searchQuery]);

  // Check if create option should show
  const showCreateOption = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 1) return false;
    const query = normalizeSeriesName(searchQuery);
    const exists = seriesList.some((s) => normalizeSeriesName(s.name) === query);
    if (exists) return false;
    if (suggestedName && normalizeSeriesName(suggestedName) === query) return false;
    return true;
  }, [searchQuery, seriesList, suggestedName]);

  // Calculate total items for keyboard navigation
  const totalItems = useMemo(() => {
    let count = 0;
    if (suggestionsFirst && showSuggestion) count += 1;
    count += filteredSeries.length;
    if (!suggestionsFirst && showSuggestion) count += 1;
    if (showCreateOption) count += 1;
    return count;
  }, [filteredSeries, showSuggestion, showCreateOption, suggestionsFirst]);

  // Handle series selection
  const handleSelectSeries = useCallback(
    (series: Series) => {
      const newPosition = suggestedName &&
        normalizeSeriesName(suggestedName) === normalizeSeriesName(series.name)
        ? suggestedPosition
        : localPosition;

      onChange({
        seriesId: series.id,
        seriesName: series.name,
        position: newPosition,
      });
      setLocalPosition(newPosition);
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    },
    [onChange, suggestedName, suggestedPosition, localPosition]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange({
      seriesId: null,
      seriesName: '',
      position: null,
    });
    setLocalPosition(null);
    setSearchQuery('');
  }, [onChange]);

  // Handle position change
  const handlePositionChange = useCallback(
    (newPosition: number | null) => {
      setLocalPosition(newPosition);
      if (selectedId && selectedSeries) {
        onChange({
          seriesId: selectedId,
          seriesName: selectedSeries.name,
          position: newPosition,
        });
      }
    },
    [selectedId, selectedSeries, onChange]
  );

  // Handle suggestion click (create series and select)
  const handleAddSuggestion = useCallback(async () => {
    if (!suggestedName) return;

    // Check if matches existing
    if (existingMatch) {
      handleSelectSeries(existingMatch);
      return;
    }

    try {
      const newSeriesId = await createSeries(userId, suggestedName);
      const updatedSeries = await getSeries(userId);
      setSeriesList(updatedSeries);

      onChange({
        seriesId: newSeriesId,
        seriesName: suggestedName,
        position: suggestedPosition,
      });
      setLocalPosition(suggestedPosition);
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    } catch (error) {
      console.error('Failed to create series:', error);
    }
  }, [userId, suggestedName, suggestedPosition, existingMatch, handleSelectSeries, onChange]);

  // Handle create new series
  const handleCreateSeries = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      const newSeriesId = await createSeries(userId, searchQuery.trim());
      const updatedSeries = await getSeries(userId);
      setSeriesList(updatedSeries);

      onChange({
        seriesId: newSeriesId,
        seriesName: searchQuery.trim(),
        position: null,
      });
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    } catch (error) {
      console.error('Failed to create series:', error);
    }
  }, [userId, searchQuery, onChange]);

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
  const renderSuggestion = (currentIndex: number) => {
    if (!showSuggestion) return { jsx: null, nextIndex: currentIndex };

    const isFocused = focusedIndex === currentIndex;
    return {
      jsx: (
        <div key="suggestion">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
            Suggested from book
          </div>
          <button
            type="button"
            data-picker-item
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
              isFocused ? 'bg-gray-100' : ''
            }`}
            onClick={handleAddSuggestion}
          >
            <Plus className="w-4 h-4 text-green-500" aria-hidden="true" />
            <span>
              {suggestedName}
              {suggestedPosition && (
                <span className="text-gray-400 ml-1">#{suggestedPosition}</span>
              )}
            </span>
          </button>
        </div>
      ),
      nextIndex: currentIndex + 1,
    };
  };

  const renderUserSeries = (startIndex: number) => {
    if (filteredSeries.length === 0) return { jsx: null, nextIndex: startIndex };

    const items = filteredSeries.map((series, i) => {
      const index = startIndex + i;
      const isFocused = focusedIndex === index;

      return (
        <button
          key={series.id}
          type="button"
          data-picker-item
          className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
            isFocused ? 'bg-gray-100' : ''
          }`}
          onClick={() => handleSelectSeries(series)}
        >
          <Library className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span className="flex-1">{series.name}</span>
        </button>
      );
    });

    return {
      jsx: (
        <div key="user-series">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">Your series</div>
          {items}
        </div>
      ),
      nextIndex: startIndex + filteredSeries.length,
    };
  };

  // Render selected state
  if (selectedSeries) {
    return (
      <div ref={containerRef} className="series-picker">
        <label className="block font-semibold text-gray-700 mb-1">{label}</label>

        {/* Selected series display */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <Library className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 font-medium text-gray-900">{selectedSeries.name}</span>
          <button
            type="button"
            className="p-2 hover:bg-gray-200 rounded text-gray-500"
            onClick={handleClear}
            aria-label="Remove from series"
            disabled={disabled}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Position input */}
        <div className="mt-2">
          <label htmlFor="series-position" className="block text-sm text-gray-500 mb-1">
            Position in series
          </label>
          <input
            type="number"
            id="series-position"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="#"
            min={1}
            value={localPosition || ''}
            onChange={(e) => {
              const val = e.target.value;
              handlePositionChange(val ? parseInt(val, 10) : null);
            }}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="series-picker">
      <label id="series-picker-label" className="block font-semibold text-gray-700 mb-1">
        {label}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder={isLoading ? 'Loading...' : 'Search or add series...'}
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
          aria-controls="series-picker-listbox"
          aria-labelledby="series-picker-label"
          aria-autocomplete="list"
        />

        {/* Dropdown */}
        {isOpen && (
          <div
            id="series-picker-listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            role="listbox"
            aria-label="Series options"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Select series</span>
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
                const suggestionResult = renderSuggestion(currentIndex);
                if (suggestionResult.jsx) sections.push(suggestionResult.jsx);
                currentIndex = suggestionResult.nextIndex;

                const seriesResult = renderUserSeries(currentIndex);
                if (seriesResult.jsx) {
                  if (sections.length > 0) {
                    sections.push(<div key="divider-1" className="border-t border-gray-100" />);
                  }
                  sections.push(seriesResult.jsx);
                }
                currentIndex = seriesResult.nextIndex;
              } else {
                const seriesResult = renderUserSeries(currentIndex);
                if (seriesResult.jsx) sections.push(seriesResult.jsx);
                currentIndex = seriesResult.nextIndex;

                const suggestionResult = renderSuggestion(currentIndex);
                if (suggestionResult.jsx) {
                  if (sections.length > 0) {
                    sections.push(<div key="divider-2" className="border-t border-gray-100" />);
                  }
                  sections.push(suggestionResult.jsx);
                }
                currentIndex = suggestionResult.nextIndex;
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
                      onClick={handleCreateSeries}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Create &quot;{searchQuery}&quot;</span>
                    </button>
                  </div>
                );
              }

              // Empty state
              if (sections.length === 0 && !showCreateOption) {
                if (seriesList.length === 0) {
                  sections.push(
                    <div key="empty" className="px-3 py-4 text-center text-gray-500">
                      No series yet. Type to create one.
                    </div>
                  );
                } else {
                  sections.push(
                    <div key="no-match" className="px-3 py-4 text-center text-gray-500">
                      No matches found
                    </div>
                  );
                }
              }

              return sections;
            })()}
          </div>
        )}
      </div>

      {/* Suggestion hint when dropdown is closed */}
      {suggestedName && !selectedId && !isOpen && !existingMatch && (
        <button
          type="button"
          className="text-xs text-primary hover:underline mt-1"
          onClick={handleAddSuggestion}
        >
          Use API suggestion: {suggestedName}
          {suggestedPosition && ` #${suggestedPosition}`}
        </button>
      )}
    </div>
  );
}
