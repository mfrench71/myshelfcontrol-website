/**
 * About Page
 * App version info and changelog
 */
'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, History } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { APP_VERSION } from '@/lib/constants';

// Changelog entries - newest first
const CHANGELOG = [
  {
    date: '31 December 2024',
    changes: [
      'Add Gravatar support for profile avatars',
      'Add email verification status with resend option',
      'Fix bottom sheet consistency across mobile/tablet',
      'Add password strength indicator to change password modal',
      'Add floating action button for quick book addition',
      'Add dirty state tracking for form save buttons',
      'Add double confirmation for account deletion',
    ],
  },
  {
    date: '30 December 2024',
    changes: [
      'Add widget system for home dashboard',
      'Add series progress tracking widget',
      'Add recently finished books widget',
      'Add top rated books widget',
      'Add infinite scroll pagination to books list',
      'Add multi-select filters (genre, status, series)',
      'Add faceted filter counts',
      'Add URL state for shareable filtered views',
    ],
  },
  {
    date: '29 December 2024',
    changes: [
      'Initial Next.js migration from 11ty',
      'Book list with filtering and sorting',
      'Add and edit book forms with validation',
      'ISBN barcode scanner for quick book entry',
      'Settings pages (Profile, Library, Preferences, Maintenance)',
      'PWA support with service worker',
    ],
  },
];

export default function AboutPage() {
  const { loading: authLoading } = useAuthContext();
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

  if (authLoading) {
    return (
      <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div id="about-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">About</h1>

        {/* App Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">MyShelfControl</h2>
              <p className="text-gray-500">Version {APP_VERSION}</p>
            </div>
          </div>
          <p className="text-gray-600">
            A personal book tracking app to manage your reading collection.
            Track books, series, reading progress, and more.
          </p>
        </div>

        {/* Changelog */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" aria-hidden="true" />
            Changelog
          </h3>

          <div className="space-y-2">
            {CHANGELOG.map((release) => {
              const isExpanded = expandedDates.has(release.date);
              return (
                <div key={release.date} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleDate(release.date)}
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 text-left min-h-[44px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium text-gray-900">{release.date}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 text-sm text-gray-600 bg-white">
                      <ul className="space-y-1 pl-4 list-disc">
                        {release.changes.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
