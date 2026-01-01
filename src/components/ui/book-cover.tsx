/**
 * BookCover Component
 * Displays a book cover with loading spinner and placeholder
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2 } from 'lucide-react';

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
 */
export function BookCover({
  src,
  alt = '',
  width,
  height,
  priority = false,
  className = '',
}: BookCoverProps) {
  const [loading, setLoading] = useState(!!src);
  const [error, setError] = useState(false);

  // No source or error - show placeholder
  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark ${className}`}
        style={{ width, height }}
      >
        <BookOpen
          className="text-white/80"
          style={{ width: width * 0.35, height: height * 0.35 }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
          <Loader2
            className="text-white/80 animate-spin"
            style={{ width: width * 0.3, height: height * 0.3 }}
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
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        priority={priority}
      />
    </div>
  );
}
