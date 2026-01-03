/**
 * Settings Hub Card Component
 * Card for the settings hub page with icon, title, description, and optional badge
 */
'use client';

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

type BadgeVariant = 'danger' | 'warning';

type SettingsHubCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  badge?: number;
  badgeVariant?: BadgeVariant;
  isActive?: boolean;
};

/**
 * Hub card for settings navigation
 */
export function SettingsHubCard({
  icon: Icon,
  title,
  description,
  href,
  badge,
  badgeVariant = 'danger',
  isActive = false,
}: SettingsHubCardProps) {
  const badgeClasses = badgeVariant === 'warning'
    ? 'bg-amber-500 text-white'
    : 'bg-red-500 text-white';

  return (
    <Link
      href={href}
      className={`settings-hub-card group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border transition-all ${
        isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md'
      }`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary dark:group-hover:text-blue-400'
      }`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className={`min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full flex items-center justify-center ${badgeClasses}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{description}</p>
      </div>

      {/* Chevron */}
      <ChevronRight
        className={`flex-shrink-0 w-5 h-5 transition-transform ${
          isActive ? 'text-primary dark:text-blue-400' : 'text-gray-400 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-blue-400 group-hover:translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </Link>
  );
}

type SubLink = {
  label: string;
  href: string;
};

type SettingsSidebarLinkProps = Omit<SettingsHubCardProps, 'description'> & {
  subLinks?: SubLink[];
};

/**
 * Sidebar link for desktop settings navigation
 */
export function SettingsSidebarLink({
  icon: Icon,
  title,
  href,
  badge,
  badgeVariant = 'danger',
  isActive = false,
  subLinks,
}: SettingsSidebarLinkProps) {
  const badgeClasses = badgeVariant === 'warning'
    ? 'bg-amber-500 text-white'
    : 'bg-red-500 text-white';

  return (
    <div>
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary dark:text-blue-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <span className="flex-1">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className={`min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full flex items-center justify-center ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </Link>
      {/* Sub-links shown only when section is active */}
      {isActive && subLinks && subLinks.length > 0 && (
        <nav className="ml-8 mt-1 space-y-0.5" aria-label={`${title} sections`}>
          {subLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 rounded transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
