/**
 * About Page
 * App version info and changelog
 */
'use client';

import Link from 'next/link';
import { Info, BookOpen, ExternalLink } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

// Changelog entries
const CHANGELOG = [
  {
    version: '0.1.0',
    date: 'December 2024',
    changes: [
      'Initial Next.js migration',
      'Book list with filtering and sorting',
      'Add and edit book forms',
      'Settings pages',
    ],
  },
];

export default function AboutPage() {
  const { loading: authLoading } = useAuthContext();

  if (authLoading) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                  Settings
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium">About</li>
            </ol>
          </nav>
        </div>
      </div>

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
              <p className="text-gray-500">Version 0.1.0</p>
            </div>
          </div>
          <p className="text-gray-600">
            A personal book tracking app to manage your reading collection.
            Track books, series, reading progress, and more.
          </p>
        </div>

        {/* Links */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <Link
            href="/privacy"
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">Privacy Policy</span>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </Link>
        </div>

        {/* Changelog */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Changelog</h2>
          <div className="space-y-6">
            {CHANGELOG.map((release) => (
              <div key={release.version}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">v{release.version}</span>
                  <span className="text-sm text-gray-500">{release.date}</span>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {release.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
