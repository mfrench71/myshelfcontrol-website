/**
 * CoverPicker Component
 * Select book cover from multiple API sources (Google Books, Open Library, user upload)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Check, Loader2, BookOpen } from 'lucide-react';

/** Cover source type */
export type CoverSource = 'googleBooks' | 'openLibrary' | 'userUpload';

/** Available covers object */
export interface CoverOptions {
  googleBooks?: string;
  openLibrary?: string;
  userUpload?: string;
  [key: string]: string | undefined;
}

export interface CoverPickerProps {
  /** Available cover URLs */
  covers: CoverOptions;
  /** Currently selected cover URL */
  selectedUrl: string;
  /** Callback when cover is selected */
  onChange: (url: string, source: CoverSource) => void;
  /** Optional label */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

/** Source label mapping */
const SOURCE_LABELS: Record<CoverSource, string> = {
  googleBooks: 'Google Books',
  openLibrary: 'Open Library',
  userUpload: 'Your Upload',
};

/** Validate if a string is a valid image URL */
function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  // Check for common image URL patterns
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image');
}

/**
 * Single cover option component
 */
function CoverOption({
  source,
  url,
  isSelected,
  onSelect,
  disabled,
}: {
  source: CoverSource;
  url: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset state when URL changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [url]);

  if (error) return null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`cursor-pointer rounded-lg border-2 p-2 transition-colors relative ${
        isSelected
          ? 'border-primary bg-primary/15'
          : 'border-transparent hover:border-primary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="text-xs text-gray-500 text-center mb-1">{SOURCE_LABELS[source]}</div>
      <div className="relative w-16 h-24 mx-auto rounded-lg overflow-hidden shadow-cover">
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
            <Loader2 className="w-5 h-5 text-white/80 animate-spin" aria-hidden="true" />
          </div>
        )}
        {/* Cover image */}
        <Image
          src={url}
          alt={`${SOURCE_LABELS[source]} cover`}
          width={64}
          height={96}
          className={`w-16 h-24 object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          unoptimized // External URLs from APIs
        />
      </div>
      {/* Selected badge */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
          <Check className="w-3 h-3 text-white" aria-hidden="true" />
        </div>
      )}
    </button>
  );
}

export function CoverPicker({
  covers,
  selectedUrl,
  onChange,
  label = 'Cover Image',
  disabled = false,
}: CoverPickerProps) {
  // Get valid cover sources
  const sources = (['googleBooks', 'openLibrary', 'userUpload'] as CoverSource[]).filter(
    (source) => isValidImageUrl(covers[source])
  );

  const hasCovers = sources.length > 0;

  // Auto-select first cover if none selected
  useEffect(() => {
    if (hasCovers && !selectedUrl) {
      const firstSource = sources[0];
      const firstUrl = covers[firstSource];
      if (firstUrl) {
        onChange(firstUrl, firstSource);
      }
    }
  }, [hasCovers, selectedUrl, sources, covers, onChange]);

  // Handle cover selection
  const handleSelect = useCallback(
    (source: CoverSource) => {
      const url = covers[source];
      if (url && !disabled) {
        onChange(url, source);
      }
    },
    [covers, onChange, disabled]
  );

  // Find which source is currently selected
  const getSelectedSource = (): CoverSource | null => {
    if (selectedUrl === covers.userUpload) return 'userUpload';
    if (selectedUrl === covers.googleBooks) return 'googleBooks';
    if (selectedUrl === covers.openLibrary) return 'openLibrary';
    return null;
  };

  const selectedSource = getSelectedSource();

  return (
    <div className="cover-picker">
      <label className="block font-semibold text-gray-700 mb-2">{label}</label>

      {hasCovers ? (
        <div className="flex gap-4 flex-wrap">
          {sources.map((source) => {
            const url = covers[source];
            if (!url) return null;

            return (
              <CoverOption
                key={source}
                source={source}
                url={url}
                isSelected={selectedSource === source}
                onSelect={() => handleSelect(source)}
                disabled={disabled}
              />
            );
          })}
        </div>
      ) : (
        /* No cover placeholder */
        <div className="flex flex-col items-start">
          <div className="w-24 h-36 rounded-lg shadow-cover overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
            <BookOpen className="w-10 h-10 text-white/80" aria-hidden="true" />
          </div>
          <p className="text-xs text-gray-400 mt-1">No cover available</p>
        </div>
      )}
    </div>
  );
}
