/**
 * Unit Tests for components/books/book-card.tsx
 * Tests for book card component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookCard, BookCardSkeleton } from '../book-card';
import type { Book, Genre, Series } from '@/lib/types';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  Timestamp: class {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

// Helper to create mock book
function createMockBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'Test Book',
    author: 'Test Author',
    ...overrides,
  };
}

// Mock genres
const mockGenres: Record<string, Genre> = {
  'genre-1': { id: 'genre-1', name: 'Fiction', color: '#ff0000' },
  'genre-2': { id: 'genre-2', name: 'Fantasy', color: '#00ff00' },
  'genre-3': { id: 'genre-3', name: 'Sci-Fi', color: '#0000ff' },
  'genre-4': { id: 'genre-4', name: 'Romance', color: '#ff00ff' },
};

// Mock series
const mockSeries: Record<string, Series> = {
  'series-1': { id: 'series-1', name: 'Harry Potter' },
  'series-2': { id: 'series-2', name: 'A Very Long Series Name That Should Be Truncated' },
};

describe('BookCard', () => {
  describe('basic rendering', () => {
    it('renders book title', () => {
      render(<BookCard book={createMockBook({ title: 'My Book Title' })} />);

      expect(screen.getByText('My Book Title')).toBeInTheDocument();
    });

    it('renders book author', () => {
      render(<BookCard book={createMockBook({ author: 'Jane Doe' })} />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('shows "Unknown author" when author is empty', () => {
      render(<BookCard book={createMockBook({ author: '' })} />);

      expect(screen.getByText('Unknown author')).toBeInTheDocument();
    });

    it('links to book detail page', () => {
      render(<BookCard book={createMockBook({ id: 'book-123' })} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/books/book-123');
    });
  });

  describe('reading status', () => {
    it('shows no badge for want-to-read books', () => {
      render(<BookCard book={createMockBook({ reads: [] })} />);

      expect(screen.queryByText('Reading')).not.toBeInTheDocument();
      expect(screen.queryByText('Finished')).not.toBeInTheDocument();
    });

    it('shows Reading badge for in-progress books', () => {
      render(
        <BookCard
          book={createMockBook({
            reads: [{ startedAt: '2024-01-01' }],
          })}
        />
      );

      expect(screen.getByText('Reading')).toBeInTheDocument();
    });

    it('shows Finished badge for completed books', () => {
      render(
        <BookCard
          book={createMockBook({
            reads: [{ startedAt: '2024-01-01', finishedAt: '2024-02-01' }],
          })}
        />
      );

      expect(screen.getByText('Finished')).toBeInTheDocument();
    });
  });

  describe('series display', () => {
    it('shows series badge when book has series', () => {
      render(
        <BookCard
          book={createMockBook({ seriesId: 'series-1' })}
          series={mockSeries}
        />
      );

      expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    });

    it('shows series position', () => {
      render(
        <BookCard
          book={createMockBook({ seriesId: 'series-1', seriesPosition: 3 })}
          series={mockSeries}
        />
      );

      expect(screen.getByText(/Harry Potter/)).toBeInTheDocument();
      expect(screen.getByText(/#3/)).toBeInTheDocument();
    });

    it('truncates long series names', () => {
      render(
        <BookCard
          book={createMockBook({ seriesId: 'series-2' })}
          series={mockSeries}
        />
      );

      // Should be truncated with ellipsis
      const badge = screen.getByText(/A Very Long Series/);
      expect(badge.textContent).toContain('…');
    });
  });

  describe('rating display', () => {
    it('shows star rating when present', () => {
      render(<BookCard book={createMockBook({ rating: 4 })} />);

      expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument();
    });

    it('does not show rating when null', () => {
      render(<BookCard book={createMockBook({ rating: null })} />);

      expect(screen.queryByLabelText(/stars/)).not.toBeInTheDocument();
    });

    it('does not show rating when 0', () => {
      render(<BookCard book={createMockBook({ rating: 0 })} />);

      expect(screen.queryByLabelText(/stars/)).not.toBeInTheDocument();
    });
  });

  describe('genre display', () => {
    it('shows genre badges', () => {
      render(
        <BookCard
          book={createMockBook({ genres: ['genre-1', 'genre-2'] })}
          genres={mockGenres}
        />
      );

      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
    });

    it('limits to 3 genre badges', () => {
      render(
        <BookCard
          book={createMockBook({
            genres: ['genre-1', 'genre-2', 'genre-3', 'genre-4'],
          })}
          genres={mockGenres}
        />
      );

      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
      expect(screen.queryByText('Romance')).not.toBeInTheDocument();
    });

    it('shows +N badge for additional genres', () => {
      render(
        <BookCard
          book={createMockBook({
            genres: ['genre-1', 'genre-2', 'genre-3', 'genre-4'],
          })}
          genres={mockGenres}
        />
      );

      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('genre badge styling', () => {
    it('applies genre color as background', () => {
      render(
        <BookCard
          book={createMockBook({ genres: ['genre-1'] })}
          genres={mockGenres}
        />
      );

      const badge = screen.getByText('Fiction');
      expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });
});

describe('BookCardSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<BookCardSkeleton />);

    expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-cover')).toBeInTheDocument();
  });

  it('has multiple skeleton lines', () => {
    const { container } = render(<BookCardSkeleton />);

    const skeletonLines = container.querySelectorAll('.skeleton');
    expect(skeletonLines.length).toBeGreaterThan(1);
  });
});
