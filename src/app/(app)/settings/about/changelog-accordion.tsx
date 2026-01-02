/**
 * Changelog Accordion Component
 * Client component for interactive changelog display
 */
'use client';

import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import type { ChangelogEntry } from '@/lib/utils/changelog';

interface ChangelogAccordionProps {
  entries: ChangelogEntry[];
}

export function ChangelogAccordion({ entries }: ChangelogAccordionProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-purple-600" aria-hidden="true" />
          Changelog
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No changelog entries found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-purple-600" aria-hidden="true" />
        Changelog
      </h3>

      <div className="space-y-2">
        {entries.map((entry) => {
          const isExpanded = expandedDates.has(entry.date);
          return (
            <div key={entry.date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDate(entry.date)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{entry.displayDate}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800">
                  <ul className="space-y-1 pl-4 list-disc">
                    {entry.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
