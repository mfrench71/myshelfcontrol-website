/**
 * Unit Tests for lib/hooks/use-body-scroll-lock.ts
 * Tests for body scroll locking hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../use-body-scroll-lock';

describe('useBodyScrollLock', () => {
  let originalScrollY: number;

  beforeEach(() => {
    // Store original scroll position
    originalScrollY = window.scrollY;

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
    // Restore original scroll position
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: originalScrollY,
    });

    document.body.classList.remove('scroll-locked');
    document.body.style.top = '';
  });

  describe('when isLocked is false', () => {
    it('does not lock scroll', () => {
      renderHook(() => useBodyScrollLock(false));

      expect(document.body.classList.contains('scroll-locked')).toBe(false);
      expect(document.body.style.top).toBe('');
    });
  });

  describe('when isLocked is true', () => {
    it('adds scroll-locked class to body', () => {
      renderHook(() => useBodyScrollLock(true));

      expect(document.body.classList.contains('scroll-locked')).toBe(true);
    });

    it('sets body top to negative scroll position', () => {
      renderHook(() => useBodyScrollLock(true));

      expect(document.body.style.top).toBe('-100px');
    });
  });

  describe('cleanup on unlock', () => {
    it('removes scroll-locked class when isLocked changes to false', () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useBodyScrollLock(isLocked),
        { initialProps: { isLocked: true } }
      );

      expect(document.body.classList.contains('scroll-locked')).toBe(true);

      rerender({ isLocked: false });

      expect(document.body.classList.contains('scroll-locked')).toBe(false);
    });

    it('clears body top style when unlocked', () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useBodyScrollLock(isLocked),
        { initialProps: { isLocked: true } }
      );

      expect(document.body.style.top).toBe('-100px');

      rerender({ isLocked: false });

      expect(document.body.style.top).toBe('');
    });

    it('restores scroll position when unlocked', () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useBodyScrollLock(isLocked),
        { initialProps: { isLocked: true } }
      );

      rerender({ isLocked: false });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
    });
  });

  describe('cleanup on unmount', () => {
    it('removes scroll-locked class on unmount', () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      expect(document.body.classList.contains('scroll-locked')).toBe(true);

      unmount();

      expect(document.body.classList.contains('scroll-locked')).toBe(false);
    });

    it('restores scroll position on unmount', () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      unmount();

      expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
    });
  });
});
