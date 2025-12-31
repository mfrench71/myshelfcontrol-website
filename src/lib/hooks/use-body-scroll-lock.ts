/**
 * useBodyScrollLock hook
 * Locks body scroll when a modal/bottom sheet is open
 */
import { useEffect } from 'react';

/**
 * Lock body scroll when isLocked is true
 * Restores scroll position when unlocked
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // Store current scroll position
    const scrollY = window.scrollY;

    // Lock body
    document.body.classList.add('scroll-locked');
    document.body.style.top = `-${scrollY}px`;

    // Cleanup: restore scroll position
    return () => {
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
