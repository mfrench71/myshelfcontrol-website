/**
 * CollapsibleSection Component
 * Reusable collapsible/accordion section with smooth animations
 */
'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

type CollapsibleSectionProps = {
  /** Section title */
  title: string;
  /** Optional icon to display before title */
  icon?: LucideIcon;
  /** Optional count badge after title */
  count?: number;
  /** Whether section is expanded by default */
  defaultExpanded?: boolean;
  /** Content to render inside the section */
  children: ReactNode;
  /** Optional actions to show in header when expanded */
  actions?: ReactNode;
  /** Optional className for the container */
  className?: string;
};

/**
 * Collapsible section with smooth expand/collapse animation
 * Uses CSS grid technique for height animation
 */
export function CollapsibleSection({
  title,
  icon: Icon,
  count,
  defaultExpanded = false,
  children,
  actions,
  className = '',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`flex items-center py-1 text-left min-h-[44px] ${actions ? 'flex-1' : 'w-full'}`}
        >
          <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-base">
            <ChevronDown
              className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
            {title}
            {count !== undefined && count > 0 && (
              <span className="text-gray-400 dark:text-gray-500 font-normal">({count})</span>
            )}
          </span>
        </button>
        {isExpanded && actions && (
          <div className="flex items-center">
            {actions}
          </div>
        )}
      </div>

      {/* Content with animation */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
