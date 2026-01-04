/**
 * Unit Tests for components/ui/book-cover.tsx
 * Tests for book cover component with loading and error states
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BookCover } from '../book-cover';

describe('BookCover', () => {
  describe('placeholder rendering', () => {
    it('shows placeholder when src is null', () => {
      render(<BookCover src={null} width={100} height={150} />);

      // BookOpen icon is rendered with aria-hidden
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('shows placeholder when src is undefined', () => {
      render(<BookCover width={100} height={150} />);

      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('shows placeholder when src is empty string', () => {
      render(<BookCover src="" width={100} height={150} />);

      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not show spinner immediately (waits 50ms)', () => {
      render(<BookCover src="https://example.com/cover.jpg" width={100} height={150} />);

      // Spinner should NOT be visible immediately
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('shows loading spinner after 50ms delay if image not loaded', () => {
      render(<BookCover src="https://example.com/cover.jpg" width={100} height={150} />);

      // Advance timers past the 50ms threshold
      act(() => {
        vi.advanceTimersByTime(60);
      });

      // Loader2 icon should be visible after delay
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides spinner after image loads', () => {
      const { container } = render(
        <BookCover src="https://example.com/cover.jpg" width={100} height={150} />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      fireEvent.load(img!);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('does not show spinner if image loads within 50ms', () => {
      const { container } = render(
        <BookCover src="https://example.com/cover.jpg" width={100} height={150} />
      );

      // Image loads quickly (before 50ms timeout)
      const img = container.querySelector('img');
      fireEvent.load(img!);

      // Advance past timeout
      act(() => {
        vi.advanceTimersByTime(60);
      });

      // Spinner should never have appeared
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows placeholder on image load error', () => {
      const { container } = render(
        <BookCover src="https://example.com/broken.jpg" width={100} height={150} />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      fireEvent.error(img!);

      // After error, should show placeholder icon (BookOpen icon)
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('sizing', () => {
    it('applies width and height from props', () => {
      const { container } = render(<BookCover src={null} width={120} height={180} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBe('120px');
      expect(wrapper.style.height).toBe('180px');
    });

    it('respects w-full className without inline width', () => {
      const { container } = render(
        <BookCover src={null} width={100} height={150} className="w-full" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBeFalsy();
    });

    it('respects h-full className without inline height', () => {
      const { container } = render(
        <BookCover src={null} width={100} height={150} className="h-full" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.height).toBeFalsy();
    });
  });

  describe('accessibility', () => {
    it('applies alt text to image', () => {
      render(
        <BookCover
          src="https://example.com/cover.jpg"
          alt="Book Title Cover"
          width={100}
          height={150}
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Book Title Cover');
    });

    it('uses empty alt text by default', () => {
      const { container } = render(
        <BookCover src="https://example.com/cover.jpg" width={100} height={150} />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('alt', '');
    });
  });

  describe('priority prop', () => {
    it('renders image when priority is true', () => {
      const { container } = render(
        <BookCover
          src="https://example.com/cover.jpg"
          width={100}
          height={150}
          priority={true}
        />
      );

      // Verify the image is rendered
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(
        <BookCover src={null} width={100} height={150} className="rounded-lg shadow" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('rounded-lg');
      expect(wrapper.className).toContain('shadow');
    });
  });
});
