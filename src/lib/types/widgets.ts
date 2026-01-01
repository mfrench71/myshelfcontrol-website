/**
 * Widget System Types
 * Configuration types for the dashboard widget system
 */

/** Widget identifiers */
export type WidgetId =
  | 'welcome'
  | 'currentlyReading'
  | 'recentlyAdded'
  | 'topRated'
  | 'recentlyFinished'
  | 'wishlist'
  | 'seriesProgress';

/** Widget size options (column span in a 12-column grid) */
export type WidgetSize = 6 | 12;

/** Widget-specific settings */
export type WidgetSettings = {
  count?: number;
  sortBy?: string;
};

/** Single widget configuration */
export type WidgetConfig = {
  id: WidgetId;
  enabled: boolean;
  order: number;
  size: WidgetSize;
  settings: WidgetSettings;
};

/** Full widget settings document */
export type WidgetSettingsDocument = {
  version: number;
  widgets: WidgetConfig[];
  updatedAt?: number;
};

/** Widget metadata for UI */
export type WidgetMeta = {
  id: WidgetId;
  name: string;
  icon: string;
  defaultSize: WidgetSize;
  defaultSettings: WidgetSettings;
  description: string;
};

/** Default widget configurations */
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
  { id: 'currentlyReading', enabled: true, order: 1, size: 6, settings: { count: 3 } },
  { id: 'recentlyAdded', enabled: true, order: 2, size: 6, settings: { count: 3 } },
  { id: 'topRated', enabled: true, order: 3, size: 6, settings: { count: 3 } },
  { id: 'wishlist', enabled: true, order: 4, size: 6, settings: { count: 3 } },
  { id: 'recentlyFinished', enabled: true, order: 5, size: 6, settings: { count: 3 } },
  { id: 'seriesProgress', enabled: true, order: 6, size: 12, settings: { count: 4 } },
];

/** Widget metadata registry */
export const WIDGET_REGISTRY: Record<WidgetId, WidgetMeta> = {
  welcome: {
    id: 'welcome',
    name: 'Library Stats',
    icon: 'library',
    defaultSize: 12,
    defaultSettings: {},
    description: 'Shows your total books, currently reading, and finished this year.',
  },
  currentlyReading: {
    id: 'currentlyReading',
    name: 'Currently Reading',
    icon: 'book-open',
    defaultSize: 6,
    defaultSettings: { count: 3 },
    description: 'Books you are currently reading.',
  },
  recentlyAdded: {
    id: 'recentlyAdded',
    name: 'Recently Added',
    icon: 'plus',
    defaultSize: 6,
    defaultSettings: { count: 3 },
    description: 'Most recently added books.',
  },
  topRated: {
    id: 'topRated',
    name: 'Top Rated',
    icon: 'star',
    defaultSize: 6,
    defaultSettings: { count: 3 },
    description: 'Your highest rated books (4+ stars).',
  },
  recentlyFinished: {
    id: 'recentlyFinished',
    name: 'Recently Finished',
    icon: 'check-circle',
    defaultSize: 6,
    defaultSettings: { count: 3 },
    description: 'Books you have recently finished.',
  },
  wishlist: {
    id: 'wishlist',
    name: 'Wishlist',
    icon: 'heart',
    defaultSize: 6,
    defaultSettings: { count: 3 },
    description: 'Books on your wishlist.',
  },
  seriesProgress: {
    id: 'seriesProgress',
    name: 'Series Progress',
    icon: 'library',
    defaultSize: 12,
    defaultSettings: { count: 4 },
    description: 'Progress on book series you are collecting.',
  },
};
