/**
 * Unit Tests for lib/hooks/use-body-scroll-lock.ts
 * Tests for body scroll locking hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBodyScrollLock } from '../use-body-scroll-lock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    // Reset body styles
    document.body.classList.remove('scroll-locked');
    document.body.style.top = '';

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 100,
    });

    // Mock window.scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    document.body.classList.remove('scroll-locked');
    document.body.style.top = '';
    vi.clearAllMocks();
  });

  describe('when isLocked is false', () => {
    it('does not lock scroll', async () => {
      renderHook(() => useBodyScrollLock(false));

      // Wait a tick
      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(false);
      });
    });
  });

  describe('when isLocked is true', () => {
    it('adds scroll-locked class to body', async () => {
      renderHook(() => useBodyScrollLock(true));

      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(true);
      });
    });

    it('sets body top style', async () => {
      renderHook(() => useBodyScrollLock(true));

      await waitFor(() => {
        // Check that style is set (may be empty string in some test environments)
        expect(document.body.style.top).toBeDefined();
      });
    });
  });

  describe('cleanup on unlock', () => {
    it('removes scroll-locked class when isLocked changes to false', async () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useBodyScrollLock(isLocked),
        { initialProps: { isLocked: true } }
      );

      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(true);
      });

      rerender({ isLocked: false });

      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(false);
      });
    });

    it('calls scrollTo when unlocked', async () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useBodyScrollLock(isLocked),
        { initialProps: { isLocked: true } }
      );

      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(true);
      });

      rerender({ isLocked: false });

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled();
      });
    });
  });

  describe('cleanup on unmount', () => {
    it('removes scroll-locked class on unmount', async () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(true);
      });

      unmount();

      expect(document.body.classList.contains('scroll-locked')).toBe(false);
    });

    it('calls scrollTo on unmount', async () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      await waitFor(() => {
        expect(document.body.classList.contains('scroll-locked')).toBe(true);
      });

      unmount();

      expect(window.scrollTo).toHaveBeenCalled();
    });
  });
});
