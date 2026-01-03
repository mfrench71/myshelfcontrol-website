/**
 * useBodyScrollLock hook
 * Locks body scroll when a modal/bottom sheet is open
 * Uses iOS-compatible scroll lock technique
 */
import { useLayoutEffect, useRef } from 'react';

// Track scroll position globally to handle nested modals
let scrollLockCount = 0;
let savedScrollY = 0;

/**
 * Lock body scroll when isLocked is true
 * Uses position:fixed technique with scroll position preservation
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const wasLockedRef = useRef(false);

  // Use useLayoutEffect to apply styles synchronously before paint
  useLayoutEffect(() => {
    if (isLocked && !wasLockedRef.current) {
      // First lock - save scroll position and apply styles
      if (scrollLockCount === 0) {
        // Capture scroll position immediately
        savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

        // Apply all styles in a single batch to prevent flash
        const body = document.body;
        const html = document.documentElement;

        // Set inline styles that work together
        body.style.position = 'fixed';
        body.style.top = `-${savedScrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.overflow = 'hidden';
        body.style.width = '100%';

        // Also lock html element for iOS Safari
        html.style.overflow = 'hidden';
        html.style.height = '100%';
      }
      scrollLockCount++;
      wasLockedRef.current = true;
    }

    return () => {
      if (wasLockedRef.current) {
        scrollLockCount--;
        wasLockedRef.current = false;

        // Last unlock - restore scroll position
        if (scrollLockCount === 0) {
          const body = document.body;
          const html = document.documentElement;

          // Clear all inline styles
          body.style.position = '';
          body.style.top = '';
          body.style.left = '';
          body.style.right = '';
          body.style.overflow = '';
          body.style.width = '';

          html.style.overflow = '';
          html.style.height = '';

          // Restore scroll position
          window.scrollTo(0, savedScrollY);
        }
      }
    };
  }, [isLocked]);
}
