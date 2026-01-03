/**
 * useBodyScrollLock hook
 * Locks body scroll when a modal/bottom sheet is open
 * Uses a synchronous approach to prevent scroll jump on mobile
 */
import { useLayoutEffect, useRef } from 'react';

/**
 * Lock body scroll when isLocked is true
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const scrollPositionRef = useRef(0);

  // Use useLayoutEffect to apply styles synchronously before paint
  // This prevents the flash of scroll-to-top on mobile
  useLayoutEffect(() => {
    if (!isLocked) return;

    // Save current scroll position immediately
    scrollPositionRef.current = window.scrollY;

    // Apply styles synchronously before browser paints
    const scrollY = scrollPositionRef.current;

    // Set top offset BEFORE adding the class to prevent visual jump
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('scroll-locked');

    // Cleanup
    return () => {
      // Remove class and styles
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';

      // Restore scroll position synchronously
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
