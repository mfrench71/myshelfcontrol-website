/**
 * BookCover Component
 * Displays a book cover with loading spinner and placeholder
 */
'use client';

import { useState } from 'react';
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
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={containerStyle}>
      {/* Loading spinner */}
      {loading && (
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
