/**
 * useBodyScrollLock hook
 * Locks body scroll when a modal/bottom sheet is open
 */
import { useEffect } from 'react';

/**
 * Lock body scroll when isLocked is true
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // Lock body scroll
    document.body.classList.add('scroll-locked');

    // Cleanup
    return () => {
      document.body.classList.remove('scroll-locked');
    };
  }, [isLocked]);
}
