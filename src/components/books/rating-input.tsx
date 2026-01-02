/**
 * Star rating input component
 * Reusable rating selector with 1-5 stars
 */
'use client';

import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          className={`p-1 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
            star <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
          }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-6 h-6 ${star <= value ? 'fill-yellow-400' : ''}`}
            aria-hidden="true"
          />
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700 min-h-[44px] px-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}
