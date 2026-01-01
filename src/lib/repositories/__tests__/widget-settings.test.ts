/**
 * Unit Tests for lib/repositories/widget-settings.ts
 * Tests for widget settings repository
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadWidgetSettings,
  saveWidgetSettings,
  updateWidgetConfig,
  reorderWidgets,
  resetWidgetSettings,
  getEnabledWidgets,
} from '../widget-settings';
import { DEFAULT_WIDGETS, type WidgetConfig } from '@/lib/types/widgets';

// Mock Firebase
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'widgets' })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
}));

// Mock localStorage at module level
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    get store() {
      return store;
    },
    reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('widget-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.reset();

    // Default mock implementations
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
    mockSetDoc.mockResolvedValue(undefined);
  });

  describe('loadWidgetSettings', () => {
    it('returns Firestore data when exists', async () => {
      const storedWidgets: WidgetConfig[] = [
        { id: 'welcome', enabled: false, order: 0, size: 12, settings: {} },
        { id: 'currentlyReading', enabled: true, order: 1, size: 6, settings: { count: 5 } },
      ];

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ widgets: storedWidgets, version: 1 }),
      });

      const result = await loadWidgetSettings('user-123');

      // Should include stored widgets plus any new defaults
      expect(result.find((w) => w.id === 'welcome')?.enabled).toBe(false);
      expect(result.find((w) => w.id === 'currentlyReading')?.settings.count).toBe(5);
    });

    it('returns defaults when no Firestore or localStorage data', async () => {
      const result = await loadWidgetSettings('user-123');

      expect(result).toEqual(DEFAULT_WIDGETS);
    });

    it('falls back to localStorage when Firestore fails', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      const localWidgets: WidgetConfig[] = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
      ];
      localStorageMock.setItem(
        'widgetSettings',
        JSON.stringify({
          version: 1,
          widgets: localWidgets,
          updatedAt: Date.now(),
        })
      );

      const result = await loadWidgetSettings('user-123');

      // Should have welcome widget from localStorage
      expect(result.find((w) => w.id === 'welcome')).toBeDefined();
    });

    it('migrates localStorage data to Firestore', async () => {
      const localWidgets: WidgetConfig[] = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
      ];
      localStorageMock.setItem(
        'widgetSettings',
        JSON.stringify({
          version: 1,
          widgets: localWidgets,
          updatedAt: Date.now(),
        })
      );

      await loadWidgetSettings('user-123');

      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('merges new default widgets with saved widgets', async () => {
      // Simulate saved data missing some default widgets
      const oldWidgets: WidgetConfig[] = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
      ];

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ widgets: oldWidgets, version: 1 }),
      });

      const result = await loadWidgetSettings('user-123');

      // Should have all default widgets, not just saved ones
      expect(result.length).toBeGreaterThan(1);
      expect(result.find((w) => w.id === 'currentlyReading')).toBeDefined();
    });
  });

  describe('saveWidgetSettings', () => {
    it('saves to Firestore', async () => {
      const widgets: WidgetConfig[] = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
      ];

      await saveWidgetSettings('user-123', widgets);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          version: 1,
          widgets,
          updatedAt: expect.any(Number),
        })
      );
    });

    it('saves to localStorage as backup', async () => {
      const widgets: WidgetConfig[] = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
      ];

      await saveWidgetSettings('user-123', widgets);

      const stored = localStorageMock.getItem('widgetSettings');
      expect(stored).not.toBe(null);
      expect(JSON.parse(stored!).widgets).toEqual(widgets);
    });

    it('throws on Firestore error', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Save failed'));

      await expect(
        saveWidgetSettings('user-123', [{ id: 'welcome', enabled: true, order: 0, size: 12, settings: {} }])
      ).rejects.toThrow('Save failed');
    });
  });

  describe('updateWidgetConfig', () => {
    it('updates a single widget', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ widgets: DEFAULT_WIDGETS, version: 1 }),
      });

      await updateWidgetConfig('user-123', 'welcome', { enabled: false });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ id: 'welcome', enabled: false }),
          ]),
        })
      );
    });

    it('throws for non-existent widget', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ widgets: DEFAULT_WIDGETS, version: 1 }),
      });

      await expect(
        updateWidgetConfig('user-123', 'nonexistent' as WidgetConfig['id'], { enabled: false })
      ).rejects.toThrow('Widget not found');
    });
  });

  describe('reorderWidgets', () => {
    it('updates widget order', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ widgets: DEFAULT_WIDGETS, version: 1 }),
      });

      await reorderWidgets('user-123', ['currentlyReading', 'welcome']);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ id: 'currentlyReading', order: 0 }),
            expect.objectContaining({ id: 'welcome', order: 1 }),
          ]),
        })
      );
    });

    it('preserves order for widgets not in list', async () => {
      const widgets = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
        { id: 'currentlyReading', enabled: true, order: 1, size: 6, settings: { count: 3 } },
        { id: 'topRated', enabled: true, order: 2, size: 6, settings: { count: 3 } },
      ];

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ widgets, version: 1 }),
      });

      // Only reorder first two
      await reorderWidgets('user-123', ['currentlyReading', 'welcome']);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ id: 'topRated', order: 2 }), // Unchanged
          ]),
        })
      );
    });
  });

  describe('resetWidgetSettings', () => {
    it('resets to defaults', async () => {
      await resetWidgetSettings('user-123');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          widgets: DEFAULT_WIDGETS,
        })
      );
    });
  });

  describe('getEnabledWidgets', () => {
    it('returns only enabled widgets', () => {
      const widgets: WidgetConfig[] = [
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
        { id: 'currentlyReading', enabled: false, order: 1, size: 6, settings: {} },
        { id: 'topRated', enabled: true, order: 2, size: 6, settings: {} },
      ];

      const result = getEnabledWidgets(widgets);

      expect(result).toHaveLength(2);
      expect(result.find((w) => w.id === 'currentlyReading')).toBeUndefined();
    });

    it('sorts by order', () => {
      const widgets: WidgetConfig[] = [
        { id: 'topRated', enabled: true, order: 2, size: 6, settings: {} },
        { id: 'welcome', enabled: true, order: 0, size: 12, settings: {} },
        { id: 'currentlyReading', enabled: true, order: 1, size: 6, settings: {} },
      ];

      const result = getEnabledWidgets(widgets);

      expect(result[0].id).toBe('welcome');
      expect(result[1].id).toBe('currentlyReading');
      expect(result[2].id).toBe('topRated');
    });

    it('handles empty array', () => {
      const result = getEnabledWidgets([]);
      expect(result).toEqual([]);
    });

    it('handles all disabled', () => {
      const widgets: WidgetConfig[] = [
        { id: 'welcome', enabled: false, order: 0, size: 12, settings: {} },
        { id: 'currentlyReading', enabled: false, order: 1, size: 6, settings: {} },
      ];

      const result = getEnabledWidgets(widgets);

      expect(result).toEqual([]);
    });
  });
});
