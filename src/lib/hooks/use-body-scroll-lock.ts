/**
 * useBodyScrollLock hook
 * Locks body scroll when a modal/bottom sheet is open
 * Preserves scroll position when using position: fixed
 */
import { useEffect, useRef } from 'react';

/**
 * Lock body scroll when isLocked is true
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (!isLocked) return;

    // Save current scroll position
    scrollPositionRef.current = window.scrollY;

    // Apply scroll position as negative top to maintain visual position
    document.body.style.top = `-${scrollPositionRef.current}px`;

    // Lock body scroll
    document.body.classList.add('scroll-locked');

    // Cleanup
    return () => {
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';

      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [isLocked]);
}
