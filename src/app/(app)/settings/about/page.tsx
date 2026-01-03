/**
 * About Page
 * App version info and changelog
 * Server Component that reads CHANGELOG.md at build time
 */

import { BookOpen } from 'lucide-react';
import { getChangelog, getBuildVersion } from '@/lib/utils/changelog';
import { ChangelogAccordion } from './changelog-accordion';

export default function AboutPage() {
  const changelog = getChangelog();
  const version = getBuildVersion();

  return (
    <div id="about-content" className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">About</h1>

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Book Republic</h2>
            <p className="text-gray-500 dark:text-gray-400">Version {version}</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          A personal book tracking app to manage your reading collection.
          Track books, series, reading progress, and more.
        </p>
      </div>

      {/* Changelog */}
      <ChangelogAccordion entries={changelog} />
    </div>
  );
}
