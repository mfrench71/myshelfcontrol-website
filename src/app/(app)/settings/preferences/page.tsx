/**
 * Preferences Settings Page
 * Sync settings and display preferences
 */
'use client';

import Link from 'next/link';
import { RefreshCw, LayoutGrid } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

export default function PreferencesSettingsPage() {
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
            {[1, 2].map((i) => (
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
              <li className="text-gray-900 font-medium">Preferences</li>
            </ol>
          </nav>
        </div>
      </div>

      <div id="preferences-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h1>

        <div className="space-y-6">
          {/* Sync Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Sync Settings</h2>
            </div>
            <p className="text-gray-500 mb-4">Configure auto-refresh behaviour</p>
            <p className="text-sm text-gray-400 italic">Sync settings coming soon</p>
          </div>

          {/* Widget Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <LayoutGrid className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Dashboard Widgets</h2>
            </div>
            <p className="text-gray-500 mb-4">Customise your home dashboard</p>
            <p className="text-sm text-gray-400 italic">Widget settings coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}
