/**
 * Modal and BottomSheet Components
 * Responsive dialog components with animations
 */
'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';

// ============================================================================
// Modal Component
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Title for aria-labelledby (optional) */
  title?: string;
  /** Close on backdrop click (default: true) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Additional class for modal content */
  className?: string;
}

/**
 * Modal - Centered dialog component
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === modalRef.current) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? 'modal-exit' : 'modal-backdrop'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`modal-content bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// BottomSheet Component
// ============================================================================

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Title for aria-labelledby (optional) */
  title?: string;
  /** Close on backdrop click (default: true) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Enable swipe to dismiss on mobile (default: true) */
  swipeToDismiss?: boolean;
  /** Additional class for content */
  className?: string;
}

/**
 * Find a scrollable ancestor element between target and stopAt
 */
function findScrollableAncestor(target: HTMLElement, stopAt: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = target;
  while (el && el !== stopAt) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    if (isScrollable) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * BottomSheet - Mobile-first sheet that slides up from bottom
 * On desktop (md+), displays as centered modal
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  closeOnBackdrop = true,
  closeOnEscape = true,
  swipeToDismiss = true,
  className = '',
}: BottomSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === containerRef.current) {
      handleClose();
    }
  };

  // Setup swipe gesture on touch devices
  useEffect(() => {
    if (!isOpen || !swipeToDismiss || !containerRef.current) return;

    // Only enable on touch devices
    if (!('ontouchstart' in window)) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      const content = contentRef.current;
      const handle = handleRef.current;
      if (!content) return;

      const target = e.target as HTMLElement;

      // Check for nested scrollable ancestor
      const nestedScrollable = findScrollableAncestor(target, content);
      if (nestedScrollable && nestedScrollable.scrollTop < nestedScrollable.scrollHeight - nestedScrollable.clientHeight) {
        // Inner scrollable can still scroll down, don't start dismiss
        return;
      }

      // Allow drag from handle or if content is scrolled to top
      const isHandle = handle && handle.contains(target);
      const isScrolledToTop = content.scrollTop === 0;

      if (isHandle || isScrolledToTop) {
        isDragging.current = true;
        hasMoved.current = false;
        startY.current = e.touches[0].clientY;
        currentY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !contentRef.current) return;

      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY > 0) {
        // Only start visual drag after moving at least 5px (distinguishes tap from drag)
        if (!hasMoved.current && deltaY > 5) {
          hasMoved.current = true;
          contentRef.current.style.transition = 'none';
        }
        if (hasMoved.current) {
          currentY.current = deltaY;
          contentRef.current.style.transform = `translateY(${deltaY}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current || !contentRef.current) return;

      isDragging.current = false;

      // Only handle drag end if actual movement occurred
      if (!hasMoved.current) {
        return;
      }

      hasMoved.current = false;
      contentRef.current.style.transition = '';

      // If dragged more than 100px, close; otherwise snap back
      if (currentY.current > 100) {
        handleClose();
      } else {
        contentRef.current.style.transform = '';
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, swipeToDismiss, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4 ${
        isClosing ? 'modal-exit' : 'bottom-sheet-backdrop'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
    >
      <div
        ref={contentRef}
        className={`bottom-sheet-content bg-white w-full md:max-w-md md:rounded-xl md:shadow-xl max-h-[90vh] overflow-y-auto ${className}`}
      >
        {/* Swipe handle (mobile only) */}
        <div ref={handleRef} className="bottom-sheet-handle md:hidden" />
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// ConfirmModal Component
// ============================================================================

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Button variant for confirm action */
  variant?: 'primary' | 'danger';
  /** Show loading state during async confirm */
  isLoading?: boolean;
}

/**
 * ConfirmModal - Confirmation dialog with cancel/confirm buttons
 * Uses BottomSheet on mobile for better UX
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-primary hover:bg-primary-dark';

  const content = (
    <div className="p-6">
      <h3 id="sheet-title" className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2 ${confirmButtonClass}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Loading...
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      {content}
    </BottomSheet>
  );
}

// ============================================================================
// useConfirmModal Hook
// ============================================================================

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

/**
 * Hook for imperative confirmation dialogs
 * Returns [ConfirmModalComponent, confirm function]
 */
export function useConfirmModal(): [
  () => ReactNode,
  (options: ConfirmOptions) => Promise<boolean>
] {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  // Use ref to store the resolve function to avoid dependency issues
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState({ isOpen: false, options: null });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState({ isOpen: false, options: null });
  }, []);

  const ConfirmModalComponent = useCallback(() => {
    if (!state.options) return null;

    return (
      <ConfirmModal
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={state.options.title}
        message={state.options.message}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        variant={state.options.variant}
      />
    );
  }, [state, handleClose, handleConfirm]);

  return [ConfirmModalComponent, confirm];
}
