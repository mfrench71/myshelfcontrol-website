/**
 * Unit Tests for components/ui/error-boundary.tsx
 * Tests for error boundary component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('renders default error UI when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });

    it('shows try again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows reload page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('logs error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('resets error state when try again is clicked', () => {
      let shouldThrow = true;

      function ConditionalError() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered content</div>;
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Stop throwing
      shouldThrow = false;

      // Click try again
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // Re-render to pick up the new state
      rerender(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });
  });

  describe('reload functionality', () => {
    it('calls window.location.reload when reload button is clicked', () => {
      const reloadMock = vi.fn();
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: /reload page/i }));

      expect(reloadMock).toHaveBeenCalled();

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('accessibility', () => {
    it('has accessible button labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload page/i });

      expect(tryAgainButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();
    });

    it('icons have aria-hidden attribute', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('buttons have minimum touch target height', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload page/i });

      expect(tryAgainButton.classList.contains('min-h-[44px]')).toBe(true);
      expect(reloadButton.classList.contains('min-h-[44px]')).toBe(true);
    });
  });

  describe('styling', () => {
    it('renders error icon', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // AlertTriangle icon should be in the error UI
      const iconContainer = container.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies proper layout classes', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('min-h-[200px]')).toBe(true);
      expect(wrapper.classList.contains('flex')).toBe(true);
    });
  });

  describe('getDerivedStateFromError', () => {
    it('updates state with error', () => {
      const testError = new Error('Specific test error');

      function ThrowSpecificError() {
        throw testError;
      }

      // The error state is internal, but we can verify behavior through console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowSpecificError />
        </ErrorBoundary>
      );

      // Verify the error was caught
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        testError,
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });
});
