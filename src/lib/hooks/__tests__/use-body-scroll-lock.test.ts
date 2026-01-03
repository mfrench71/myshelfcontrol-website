/**
 * Unit Tests for lib/hooks/use-body-scroll-lock.ts
 * Tests for body scroll locking hook
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBodyScrollLock } from '../use-body-scroll-lock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    // Reset body and html styles
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
  });

  describe('when isLocked is false', () => {
    it('does not lock scroll', async () => {
      renderHook(() => useBodyScrollLock(false));

      await waitFor(() => {
        expect(document.body.style.position).not.toBe('fixed');
      });
    });
  });

  describe('when isLocked is true', () => {
    it('applies scroll lock styles to body', async () => {
      renderHook(() => useBodyScrollLock(true));

      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.style.overflow).toBe('hidden');
      });
    });
  });

  describe('cleanup on unlock', () => {
    it('removes scroll lock styles when isLocked changes to false', async () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useBodyScrollLock(isLocked),
        { initialProps: { isLocked: true } }
      );

      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
      });

      rerender({ isLocked: false });

      await waitFor(() => {
        expect(document.body.style.position).toBe('');
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('cleanup on unmount', () => {
    it('removes scroll lock styles on unmount', async () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
      });

      unmount();

      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflow).toBe('');
    });
  });
});
