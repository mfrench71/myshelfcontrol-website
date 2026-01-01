/**
 * Preferences Settings Page
 * Sync settings and widget customisation
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  LayoutGrid,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  BookOpen,
  Plus,
  Star,
  CheckCircle,
  Heart,
  Library,
  Loader2,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import {
  loadWidgetSettings,
  saveWidgetSettings,
  resetWidgetSettings,
} from '@/lib/repositories/widget-settings';
import { WIDGET_REGISTRY, type WidgetConfig, type WidgetId } from '@/lib/types/widgets';

/** Icon mapping for widgets */
const WIDGET_ICONS: Record<WidgetId, typeof BookOpen> = {
  welcome: Library,
  currentlyReading: BookOpen,
  recentlyAdded: Plus,
  topRated: Star,
  recentlyFinished: CheckCircle,
  wishlist: Heart,
  seriesProgress: Library,
};

export default function PreferencesSettingsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load widget settings
  const loadSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const settings = await loadWidgetSettings(user.uid);
      setWidgets(settings.sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error('Failed to load widget settings:', err);
      showToast('Failed to load settings', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadSettings();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadSettings]);

  // Save widget settings
  const saveSettings = async (newWidgets: WidgetConfig[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await saveWidgetSettings(user.uid, newWidgets);
      setWidgets(newWidgets);
      showToast('Settings saved', { type: 'success' });
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast('Failed to save settings', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle widget visibility
  const toggleWidget = (widgetId: WidgetId) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    );
    saveSettings(newWidgets);
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await resetWidgetSettings(user.uid);
      await loadSettings();
      showToast('Settings reset to defaults', { type: 'success' });
    } catch (err) {
      console.error('Failed to reset settings:', err);
      showToast('Failed to reset settings', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWidgets = [...widgets];
    const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(index, 0, draggedWidget);

    // Update order values
    newWidgets.forEach((w, i) => {
      w.order = i;
    });

    setWidgets(newWidgets);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Save after drag ends
    saveSettings(widgets);
  };

  if (authLoading || loading) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
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
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li className="flex items-center min-w-0">
                <Link href="/" className="text-gray-500 hover:text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li className="flex items-center min-w-0">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" aria-hidden="true" />
                <Link href="/settings" className="text-gray-500 hover:text-primary hover:underline">
                  Settings
                </Link>
              </li>
              <li className="flex items-center min-w-0">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-900 font-medium" aria-current="page">
                  Preferences
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h1>

        <div className="space-y-6">
          {/* Dashboard Widgets */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-gray-600" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-gray-900">Dashboard Widgets</h2>
              </div>
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Drag to reorder, click eye icon to show/hide widgets on your dashboard.
            </p>

            {/* Widget list */}
            <div className="space-y-2">
              {widgets.map((widget, index) => {
                const meta = WIDGET_REGISTRY[widget.id];
                const IconComponent = WIDGET_ICONS[widget.id];

                return (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                      draggedIndex === index
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    } ${!widget.enabled ? 'opacity-60' : ''}`}
                  >
                    <GripVertical
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <IconComponent className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{meta.name}</p>
                        <p className="text-xs text-gray-500 truncate">{meta.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      disabled={saving}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
                      aria-label={widget.enabled ? 'Hide widget' : 'Show widget'}
                    >
                      {widget.enabled ? (
                        <Eye className="w-5 h-5 text-green-600" aria-hidden="true" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            )}
          </div>

          {/* Sync Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Auto-Refresh</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Your dashboard automatically refreshes when you return to the tab.
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Visibility-based sync is enabled
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
