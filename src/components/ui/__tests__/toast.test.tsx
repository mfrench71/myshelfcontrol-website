/**
 * Unit Tests for components/ui/toast.tsx
 * Tests for toast notification system
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../toast';

// Test component to access toast functions
function TestComponent() {
  const { showToast, clearAllToasts } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', { type: 'success' })}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', { type: 'error' })}>
        Show Error
      </button>
      <button onClick={() => showToast('Info message', { type: 'info' })}>
        Show Info
      </button>
      <button onClick={() => showToast('Default message')}>
        Show Default
      </button>
      <button onClick={() => clearAllToasts()}>
        Clear All
      </button>
    </div>
  );
}

describe('Toast System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('useToast hook', () => {
    it('throws error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleError.mockRestore();
    });
  });

  describe('showToast', () => {
    it('shows success toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('shows error toast with alert role', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows info toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('defaults to info type', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Default'));

      expect(screen.getByText('Default message')).toBeInTheDocument();
    });
  });

  describe('toast auto-dismiss', () => {
    it('auto-dismisses after default duration', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));
      expect(screen.getByText('Info message')).toBeInTheDocument();

      // Fast-forward past default duration (3000ms) + exit animation (150ms)
      act(() => {
        vi.advanceTimersByTime(3200);
      });

      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  describe('toast dismissal', () => {
    it('dismisses on dismiss button click', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));
      expect(screen.getByText('Info message')).toBeInTheDocument();

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  describe('clearAllToasts', () => {
    it('clears all visible toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Show multiple toasts
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Clear All'));

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  describe('toast limit', () => {
    it('limits visible toasts to 3', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Show 4 toasts
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Info'));
      fireEvent.click(screen.getByText('Show Default'));

      // Only 3 should be visible (MAX_VISIBLE_TOASTS = 3)
      const notifications = screen.getByLabelText('Notifications');
      const toasts = notifications.querySelectorAll('[class*="rounded-lg"]');
      expect(toasts.length).toBeLessThanOrEqual(3);
    });
  });

  describe('toast accessibility', () => {
    it('has aria-live region', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));

      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('has dismiss button with aria-label', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));

      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
    });
  });
});
