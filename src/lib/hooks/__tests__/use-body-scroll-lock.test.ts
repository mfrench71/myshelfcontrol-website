/**
 * Unit Tests for lib/hooks/use-body-scroll-lock.ts
 * Tests for body scroll locking hook
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBodyScrollLock } from '../use-body-scroll-lock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    // Reset body class
    document.body.classList.remove('scroll-locked');
  });

  afterEach(() => {
    document.body.classList.remove('scroll-locked');
  });

  describe('when isLocked is false', () => {
    it('does not lock scroll', async () => {
      renderHook(() => useBodyScrollLock(false));

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
  });
});
