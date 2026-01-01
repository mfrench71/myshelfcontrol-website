/**
 * Widget Settings Repository
 * Manages widget configuration storage and retrieval
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  DEFAULT_WIDGETS,
  type WidgetConfig,
  type WidgetSettingsDocument,
  type WidgetId,
} from '@/lib/types/widgets';

const WIDGET_SETTINGS_VERSION = 1;
const LOCAL_STORAGE_KEY = 'widgetSettings';

/**
 * Get the widget settings document reference
 */
function getWidgetSettingsRef(userId: string) {
  return doc(db, 'users', userId, 'settings', 'widgets');
}

/**
 * Load widget settings from Firestore with local storage fallback
 */
export async function loadWidgetSettings(userId: string): Promise<WidgetConfig[]> {
  try {
    const docRef = getWidgetSettingsRef(userId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const data = snapshot.data() as WidgetSettingsDocument;
      return mergeWithDefaults(data.widgets);
    }

    // No Firestore data, check local storage
    const localData = getLocalSettings();
    if (localData) {
      // Save to Firestore for future use
      await saveWidgetSettings(userId, localData);
      return localData;
    }

    // Return defaults
    return [...DEFAULT_WIDGETS];
  } catch (err) {
    console.error('Failed to load widget settings:', err);

    // Fallback to local storage
    const localData = getLocalSettings();
    if (localData) {
      return localData;
    }

    return [...DEFAULT_WIDGETS];
  }
}

/**
 * Save widget settings to Firestore and local storage
 */
export async function saveWidgetSettings(
  userId: string,
  widgets: WidgetConfig[]
): Promise<void> {
  try {
    const docRef = getWidgetSettingsRef(userId);
    const data: WidgetSettingsDocument = {
      version: WIDGET_SETTINGS_VERSION,
      widgets,
      updatedAt: Date.now(),
    };

    await setDoc(docRef, data);

    // Also save to local storage as backup
    setLocalSettings(widgets);
  } catch (err) {
    console.error('Failed to save widget settings:', err);
    throw err;
  }
}

/**
 * Update a single widget configuration
 */
export async function updateWidgetConfig(
  userId: string,
  widgetId: WidgetId,
  updates: Partial<Omit<WidgetConfig, 'id'>>
): Promise<void> {
  const widgets = await loadWidgetSettings(userId);
  const index = widgets.findIndex((w) => w.id === widgetId);

  if (index === -1) {
    throw new Error(`Widget not found: ${widgetId}`);
  }

  widgets[index] = { ...widgets[index], ...updates };
  await saveWidgetSettings(userId, widgets);
}

/**
 * Reorder widgets
 */
export async function reorderWidgets(
  userId: string,
  orderedIds: WidgetId[]
): Promise<void> {
  const widgets = await loadWidgetSettings(userId);

  // Update order based on array position
  const reordered = widgets.map((widget) => {
    const newOrder = orderedIds.indexOf(widget.id);
    return { ...widget, order: newOrder !== -1 ? newOrder : widget.order };
  });

  await saveWidgetSettings(userId, reordered);
}

/**
 * Reset widget settings to defaults
 */
export async function resetWidgetSettings(userId: string): Promise<void> {
  await saveWidgetSettings(userId, [...DEFAULT_WIDGETS]);
}

/**
 * Get enabled widgets sorted by order
 */
export function getEnabledWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  return widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
}

/**
 * Merge saved widgets with defaults to handle new widgets
 */
function mergeWithDefaults(saved: WidgetConfig[]): WidgetConfig[] {
  const savedMap = new Map(saved.map((w) => [w.id, w]));
  const merged: WidgetConfig[] = [];

  // Add saved widgets in their order
  for (const widget of saved) {
    if (DEFAULT_WIDGETS.some((d) => d.id === widget.id)) {
      merged.push(widget);
    }
  }

  // Add any new default widgets that don't exist in saved
  for (const defaultWidget of DEFAULT_WIDGETS) {
    if (!savedMap.has(defaultWidget.id)) {
      merged.push({
        ...defaultWidget,
        order: merged.length,
      });
    }
  }

  return merged;
}

/**
 * Get settings from local storage
 */
function getLocalSettings(): WidgetConfig[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as WidgetSettingsDocument;
      return mergeWithDefaults(data.widgets);
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

/**
 * Save settings to local storage
 */
function setLocalSettings(widgets: WidgetConfig[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: WidgetSettingsDocument = {
      version: WIDGET_SETTINGS_VERSION,
      widgets,
      updatedAt: Date.now(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}
