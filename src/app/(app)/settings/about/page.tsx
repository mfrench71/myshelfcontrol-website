/**
 * About Page
 * App version info and changelog
 * Server Component that reads CHANGELOG.md at build time
 */

import Image from 'next/image';
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
          <Image
            src="/branding/logo-icon.svg"
            alt=""
            width={64}
            height={64}
            className="w-16 h-16"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-2xl">
              <span className="font-bold text-slate-800 dark:text-slate-200">book</span>
              <span className="font-normal text-blue-500">assembly</span>
            </h2>
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
