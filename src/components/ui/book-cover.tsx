/**
 * BookCover Component
 * Displays a book cover with loading spinner and placeholder
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface BookCoverProps {
  src?: string | null;
  alt?: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

/**
 * Book cover with loading spinner and gradient placeholder
 * Only shows spinner if image takes longer than 50ms to load (avoids flash for cached images)
 */
export function BookCover({
  src,
  alt = '',
  width,
  height,
  priority = false,
  className = '',
}: BookCoverProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const spinnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Only show spinner if image takes longer than 50ms to load
  // This prevents spinner flash for cached images
  useEffect(() => {
    if (!src) return;

    // Reset state when src changes
    setLoaded(false);
    setShowSpinner(false);
    setError(false);

    // Start timer to show spinner after delay
    spinnerTimeoutRef.current = setTimeout(() => {
      // Before showing spinner, check if image is already complete
      // (handles bfcache restoration on iOS where onLoad doesn't fire)
      const img = containerRef.current?.querySelector('img');
      if (img?.complete && img.naturalWidth > 0) {
        setLoaded(true);
      } else {
        setShowSpinner(true);
      }
    }, 50);

    return () => {
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
      }
    };
  }, [src]);

  // Check if className contains full sizing classes (let container control size)
  const hasFullSizing = className.includes('w-full') || className.includes('h-full');
  const containerStyle = hasFullSizing ? undefined : { width, height };

  // No source or error - show placeholder
  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark ${className}`}
        style={containerStyle}
      >
        <Image
          src="/branding/logo-icon.svg"
          alt=""
          width={width}
          height={height}
          className="w-[50%] h-[50%] opacity-80"
          aria-hidden="true"
          unoptimized
        />
      </div>
    );
  }

  // Handle image load - clear spinner timeout and mark as loaded
  const handleLoad = () => {
    if (spinnerTimeoutRef.current) {
      clearTimeout(spinnerTimeoutRef.current);
    }
    setShowSpinner(false);
    setLoaded(true);
  };

  const handleError = () => {
    if (spinnerTimeoutRef.current) {
      clearTimeout(spinnerTimeoutRef.current);
    }
    setShowSpinner(false);
    setError(true);
  };

  // Show spinner only if: not loaded, not errored, and delay has passed
  const isLoading = !loaded && !error && showSpinner;

  return (
    <div ref={containerRef} className={`relative ${className}`} style={containerStyle}>
      {/* Loading spinner - only shown after 50ms delay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
          <Loader2
            className="text-white/80 animate-spin w-[30%] h-[30%]"
            aria-hidden="true"
          />
        </div>
      )}
      {/* Cover image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
      />
    </div>
  );
}
