/**
 * Toast Notification System
 * Context-based toast notifications with queue support
 */
'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// Types
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
  clearAllToasts: () => void;
}

// Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Constants
const DEFAULT_DURATION = 3000;
const MAX_VISIBLE_TOASTS = 3;

/**
 * Generate unique ID for toasts
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Single Toast Item Component
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(toast.duration);

  // Auto-dismiss timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 150);
    }, remainingTime);

    const startTime = Date.now();

    return () => {
      clearTimeout(timer);
      if (!isPaused) {
        setRemainingTime((prev) => prev - (Date.now() - startTime));
      }
    };
  }, [isPaused, remainingTime, toast.id, onDismiss]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 150);
  }, [toast.id, onDismiss]);

  // Icon and colours based on type
  const config = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-600 text-white',
    },
    error: {
      icon: XCircle,
      className: 'bg-red-600 text-white',
    },
    info: {
      icon: Info,
      className: 'bg-gray-800 text-white',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 cursor-pointer pointer-events-auto
        ${config.className}
        ${isExiting ? 'toast-exit' : 'toast-enter'}
      `}
      onClick={handleDismiss}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role={toast.type === 'error' ? 'alert' : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Toast Container Component
 */
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 flex flex-col-reverse gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.slice(0, MAX_VISIBLE_TOASTS).map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const { type = 'info', duration = DEFAULT_DURATION } = options;

    const newToast: Toast = {
      id: generateId(),
      message,
      type,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
