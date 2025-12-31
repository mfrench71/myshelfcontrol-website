/**
 * Library Settings Page
 * Manage genres, series, and backup/restore
 */
'use client';

import Link from 'next/link';
import { Library, Tag, Layers, Download, Upload } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

export default function LibrarySettingsPage() {
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
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
              <li className="text-gray-900 font-medium">Library</li>
            </ol>
          </nav>
        </div>
      </div>

      <div id="library-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Library</h1>

        <div className="space-y-6">
          {/* Genres Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Tag className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Genres</h2>
            </div>
            <p className="text-gray-500 mb-4">Manage your custom genres and colours</p>
            <p className="text-sm text-gray-400 italic">Genre management coming soon</p>
          </div>

          {/* Series Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Series</h2>
            </div>
            <p className="text-gray-500 mb-4">Manage your book series</p>
            <p className="text-sm text-gray-400 italic">Series management coming soon</p>
          </div>

          {/* Backup Section */}
          <div id="backup" className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Library className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Backup & Restore</h2>
            </div>
            <p className="text-gray-500 mb-4">Export or import your library data</p>
            <div className="flex flex-wrap gap-3">
              <button
                id="export-btn"
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export Data</span>
              </button>
              <button
                id="import-btn"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors min-h-[44px]"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Import Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
