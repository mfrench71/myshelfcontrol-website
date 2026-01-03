/**
 * Preferences Settings Page
 * Sync settings, widget customisation, and browser cache management
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  LayoutGrid,
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
  Trash2,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { useToast } from '@/components/ui/toast';
import { BottomSheet } from '@/components/ui/modal';
import {
  loadWidgetSettings,
  saveWidgetSettings,
  resetWidgetSettings,
} from '@/lib/repositories/widget-settings';
import { getBooks } from '@/lib/repositories/books';
import { WIDGET_REGISTRY, type WidgetConfig, type WidgetId } from '@/lib/types/widgets';

/** Sync settings stored in localStorage */
type SyncSettings = {
  autoRefreshEnabled: boolean;
  hiddenThreshold: number; // seconds before auto-refresh triggers
  cooldownPeriod: number; // minimum seconds between refreshes
};

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoRefreshEnabled: true,
  hiddenThreshold: 60, // 1 minute
  cooldownPeriod: 300, // 5 minutes
};

const SYNC_SETTINGS_KEY = 'bookassembly_sync_settings';

/** Load sync settings from localStorage */
function loadSyncSettings(): SyncSettings {
  if (typeof window === 'undefined') return DEFAULT_SYNC_SETTINGS;
  try {
    const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SYNC_SETTINGS;
}

/** Save sync settings to localStorage */
function saveSyncSettings(settings: SyncSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
}

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

/**
 * Clear Cache Confirmation Modal
 */
function ClearCacheModal({
  isOpen,
  onClose,
  onConfirm,
  isClearing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearing: boolean;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Clear Local Cache"
      closeOnBackdrop={!isClearing}
      closeOnEscape={!isClearing}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Clear Local Cache?</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          This will clear all cached data from your browser. Your data in the cloud will not be affected.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Clearing...</span>
              </>
            ) : (
              'Clear Cache'
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default function PreferencesSettingsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync settings state
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS);
  const [refreshing, setRefreshing] = useState(false);

  // Cache modal state
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load sync settings from localStorage
  useEffect(() => {
    setSyncSettings(loadSyncSettings());
  }, []);

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
      // Reload settings without showing loading skeleton (preserves scroll position)
      const settings = await loadWidgetSettings(user.uid);
      setWidgets(settings.sort((a, b) => a.order - b.order));
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

  // Move widget up (for mobile arrow buttons)
  const moveWidgetUp = (index: number) => {
    if (index === 0) return;
    const newWidgets = [...widgets];
    [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
    newWidgets.forEach((w, i) => {
      w.order = i;
    });
    saveSettings(newWidgets);
  };

  // Move widget down (for mobile arrow buttons)
  const moveWidgetDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const newWidgets = [...widgets];
    [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    newWidgets.forEach((w, i) => {
      w.order = i;
    });
    saveSettings(newWidgets);
  };

  // Update widget settings (count, etc.)
  const updateWidgetSettings = (widgetId: WidgetId, settings: { count?: number }) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, settings: { ...w.settings, ...settings } } : w
    );
    saveSettings(newWidgets);
  };

  // Update widget size
  const updateWidgetSize = (widgetId: WidgetId, size: 3 | 6 | 9 | 12) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, size } : w
    );
    saveSettings(newWidgets);
  };

  // Update sync settings
  const updateSyncSetting = <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) => {
    const newSettings = { ...syncSettings, [key]: value };
    setSyncSettings(newSettings);
    saveSyncSettings(newSettings);
    showToast('Setting saved', { type: 'info' });
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      // Force reload books from server
      await getBooks(user.uid);
      showToast('Library refreshed', { type: 'success' });
    } catch (err) {
      console.error('Failed to refresh library:', err);
      showToast('Failed to refresh library', { type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  // Clear local cache
  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // Clear all localStorage items for this app
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('bookassembly_') || key.startsWith('widget_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Reset sync settings to defaults
      setSyncSettings(DEFAULT_SYNC_SETTINGS);
      saveSyncSettings(DEFAULT_SYNC_SETTINGS);

      setShowCacheModal(false);
      showToast('Cache cleared', { type: 'success' });
    } catch (err) {
      console.error('Failed to clear cache:', err);
      showToast('Failed to clear cache', { type: 'error' });
    } finally {
      setIsClearing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Preferences</h1>

        {/* Mobile Section Navigation (Pills) */}
        <nav className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar" aria-label="Jump to section">
          <div className="flex gap-2">
            <a
              href="#appearance"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Appearance
            </a>
            <a
              href="#sync"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Sync
            </a>
            <a
              href="#widgets"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Widgets
            </a>
            <a
              href="#browser"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Browser
            </a>
          </div>
        </nav>

        <div className="space-y-6">
              {/* Appearance Section */}
              <section id="appearance" className="scroll-mt-36 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Choose how Book Assembly looks. Select &quot;System&quot; to automatically match your device settings.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors min-h-[44px] ${
                        theme === 'system'
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Monitor className="w-5 h-5" aria-hidden="true" />
                      <span>System</span>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors min-h-[44px] ${
                        theme === 'light'
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Sun className="w-5 h-5" aria-hidden="true" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors min-h-[44px] ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Moon className="w-5 h-5" aria-hidden="true" />
                      <span>Dark</span>
                    </button>
                  </div>

                  {theme === 'system' && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-300">
                      Currently using {resolvedTheme} mode based on your system settings.
                    </p>
                  )}
                </div>
              </section>

              {/* Sync Section */}
              <section id="sync" className="scroll-mt-36 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sync</h2>

                {/* Auto-Refresh Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Auto-Refresh Settings</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    When you switch back to the app after being away, your library can automatically refresh to sync
                    changes from other devices.
                  </p>

                  <div className="space-y-4">
                    {/* Toggle */}
                    <div className="flex items-center justify-between">
                      <label htmlFor="auto-refresh-toggle" className="text-sm text-gray-700 dark:text-gray-300">
                        Enable auto-refresh on tab focus
                      </label>
                      <input
                        type="checkbox"
                        id="auto-refresh-toggle"
                        checked={syncSettings.autoRefreshEnabled}
                        onChange={(e) => updateSyncSetting('autoRefreshEnabled', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>

                    {/* Options (shown when enabled) */}
                    {syncSettings.autoRefreshEnabled && (
                      <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div>
                          <label htmlFor="hidden-threshold" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                            Refresh after hidden for
                          </label>
                          <select
                            id="hidden-threshold"
                            value={syncSettings.hiddenThreshold}
                            onChange={(e) => updateSyncSetting('hiddenThreshold', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                            <option value={120}>2 minutes</option>
                            <option value={300}>5 minutes</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="cooldown-period" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                            Minimum time between refreshes
                          </label>
                          <select
                            id="cooldown-period"
                            value={syncSettings.cooldownPeriod}
                            onChange={(e) => updateSyncSetting('cooldownPeriod', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value={60}>1 minute</option>
                            <option value={300}>5 minutes</option>
                            <option value={600}>10 minutes</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Refresh */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Manual Refresh</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Force a full refresh of your library from the server to sync the latest changes.
                  </p>
                  <button
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        <span>Refresh Library Now</span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Dashboard Widgets */}
              <section id="widgets" className="scroll-mt-36 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard Widgets</h2>
                  </div>
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-300 text-sm mb-4">
                  <span className="hidden md:inline">Drag to reorder.</span>
                  <span className="md:hidden">Use arrows to reorder.</span>
                  {' '}Configure items to show and width for each widget.
                </p>

                {/* Widget list */}
                <div className="space-y-3">
                  {widgets.map((widget, index) => {
                    const meta = WIDGET_REGISTRY[widget.id];
                    const IconComponent = WIDGET_ICONS[widget.id];
                    const showCountSetting = widget.id !== 'welcome';

                    return (
                      <div
                        key={widget.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 rounded-lg border transition-all md:cursor-grab md:active:cursor-grabbing ${
                          draggedIndex === index
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        } ${!widget.enabled ? 'opacity-60' : ''}`}
                      >
                        {/* Header row */}
                        <div className="flex items-center gap-3">
                          {/* Drag handle - desktop only */}
                          <GripVertical
                            className="hidden md:block w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0"
                            aria-hidden="true"
                          />
                          {/* Arrow buttons - mobile only */}
                          <div className="md:hidden flex flex-col gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => moveWidgetUp(index)}
                              disabled={saving || index === 0}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Move up"
                            >
                              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => moveWidgetDown(index)}
                              disabled={saving || index === widgets.length - 1}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Move down"
                            >
                              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{meta.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleWidget(widget.id)}
                            disabled={saving}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
                            aria-label={widget.enabled ? 'Hide widget' : 'Show widget'}
                          >
                            {widget.enabled ? (
                              <Eye className="w-5 h-5 text-green-600" aria-hidden="true" />
                            ) : (
                              <EyeOff className="w-5 h-5 text-gray-400" aria-hidden="true" />
                            )}
                          </button>
                        </div>

                        {/* Settings row (when enabled) */}
                        {widget.enabled && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-4">
                            {/* Items to show */}
                            {showCountSetting && (
                              <div className="flex items-center gap-2">
                                <label htmlFor={`count-${widget.id}`} className="text-xs text-gray-600 dark:text-gray-300">
                                  Items:
                                </label>
                                <select
                                  id={`count-${widget.id}`}
                                  value={widget.settings?.count || 6}
                                  onChange={(e) => updateWidgetSettings(widget.id, { count: Number(e.target.value) })}
                                  disabled={saving}
                                  className="text-sm border border-gray-300 rounded-md px-2 py-1 min-h-[32px] disabled:opacity-50"
                                >
                                  <option value={3}>3</option>
                                  <option value={6}>6</option>
                                  <option value={9}>9</option>
                                  <option value={12}>12</option>
                                </select>
                              </div>
                            )}

                            {/* Width */}
                            <div className="flex items-center gap-2">
                              <label htmlFor={`size-${widget.id}`} className="text-xs text-gray-600 dark:text-gray-300">
                                Width:
                              </label>
                              <select
                                id={`size-${widget.id}`}
                                value={widget.size || 6}
                                onChange={(e) => updateWidgetSize(widget.id, Number(e.target.value) as 3 | 6 | 9 | 12)}
                                disabled={saving}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 min-h-[32px] disabled:opacity-50"
                              >
                                <option value={3}>Small</option>
                                <option value={6}>Medium</option>
                                <option value={9}>Large</option>
                                <option value={12}>Full</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {saving && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                )}
              </section>

              {/* Browser Section */}
              <section id="browser" className="scroll-mt-36 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Browser</h2>

                {/* Clear Local Cache */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Clear Local Cache</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Clear cached data stored in your browser. This includes genre and series caches, sync settings, and
                    widget preferences. Your data in the cloud will not be affected.
                  </p>
                  <button
                    onClick={() => setShowCacheModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </section>
        </div>
      </div>

      {/* Clear Cache Modal */}
      <ClearCacheModal
        isOpen={showCacheModal}
        onClose={() => setShowCacheModal(false)}
        onConfirm={handleClearCache}
        isClearing={isClearing}
      />
    </>
  );
}
