/**
 * Maintenance Settings Page
 * Data cleanup and maintenance tools
 */
'use client';

import Link from 'next/link';
import { Wrench, Image, Database, RefreshCw } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

export default function MaintenanceSettingsPage() {
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
          <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
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
              <li className="text-gray-900 font-medium">Maintenance</li>
            </ol>
          </nav>
        </div>
      </div>

      <div id="maintenance-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Maintenance</h1>

        <div className="space-y-4">
          {/* Fetch Covers */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <h3 className="font-medium text-gray-900">Fetch Missing Covers</h3>
                </div>
                <p className="text-gray-500 text-sm mt-1">Update books with missing cover images</p>
              </div>
              <button
                id="fetch-covers-btn"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Fetch</span>
              </button>
            </div>
          </div>

          {/* Data Cleanup */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <h3 className="font-medium text-gray-900">Data Cleanup</h3>
                </div>
                <p className="text-gray-500 text-sm mt-1">Remove orphaned data and fix inconsistencies</p>
              </div>
              <button
                id="cleanup-btn"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <Wrench className="w-4 h-4" aria-hidden="true" />
                <span>Clean</span>
              </button>
            </div>
          </div>

          {/* Refresh Library */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <h3 className="font-medium text-gray-900">Refresh Library</h3>
                </div>
                <p className="text-gray-500 text-sm mt-1">Force refresh all data from the server</p>
              </div>
              <button
                id="refresh-btn"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
