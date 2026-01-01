/**
 * Unit Tests for components/ui/search-overlay.tsx
 * Tests for SearchOverlay component and its utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchOverlay } from '../search-overlay';

// Mock modules
vi.mock('@/lib/hooks/use-body-scroll-lock', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@/components/providers/auth-provider', () => ({
  useAuthContext: vi.fn(() => ({ user: { uid: 'test-user-123' } })),
}));

vi.mock('@/lib/repositories/books', () => ({
  getBooks: vi.fn(() =>
    Promise.resolve([
      {
        id: 'book-1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        coverImageUrl: 'https://example.com/gatsby.jpg',
        rating: 5,
        genres: ['genre-1'],
        reads: [{ startedAt: Date.now() - 86400000, finishedAt: Date.now() }],
        createdAt: Date.now() - 172800000,
      },
      {
        id: 'book-2',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverImageUrl: null,
        rating: 4,
        genres: [],
        seriesId: 'series-1',
        seriesPosition: 1,
        reads: [{ startedAt: Date.now() - 86400000 }],
        createdAt: Date.now() - 259200000,
      },
      {
        id: 'book-3',
        title: '1984',
        author: 'George Orwell',
        publisher: 'Penguin Books',
        notes: 'A dystopian classic',
        isbn: '9780451524935',
        rating: null,
        genres: [],
        reads: [],
        createdAt: Date.now() - 345600000,
      },
    ])
  ),
}));

vi.mock('@/lib/repositories/series', () => ({
  getSeries: vi.fn(() =>
    Promise.resolve([
      {
        id: 'series-1',
        name: 'Classic Literature Series',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ])
  ),
}));

vi.mock('@/lib/repositories/genres', () => ({
  getGenres: vi.fn(() =>
    Promise.resolve([
      { id: 'genre-1', name: 'Fiction', color: '#FF0000', createdAt: Date.now(), updatedAt: Date.now() },
    ])
  ),
  createGenreLookup: vi.fn((genres) => {
    const lookup: Record<string, { id: string; name: string; color: string }> = {};
    genres.forEach((g: { id: string; name: string; color: string }) => {
      lookup[g.id] = g;
    });
    return lookup;
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

describe('SearchOverlay', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.reset();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(<SearchOverlay isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByPlaceholderText(/search books/i)).not.toBeInTheDocument();
    });

    it('renders search input when open', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close search/i })).toBeInTheDocument();
      });
    });

    it('shows empty state message initially', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/search your library/i)).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('shows search results when query matches title', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Gatsby');

      // Check for link to the book (text may be split by highlight marks)
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /gatsby/i })).toBeInTheDocument();
      });
    });

    it('shows search results when query matches author', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Harper');

      await waitFor(() => {
        expect(screen.getByText(/To Kill a Mockingbird/)).toBeInTheDocument();
      });
    });

    it('shows search results when query matches publisher', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Penguin');

      await waitFor(() => {
        expect(screen.getByText('1984')).toBeInTheDocument();
      });
    });

    it('shows search results when query matches notes', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'dystopian');

      await waitFor(() => {
        expect(screen.getByText('1984')).toBeInTheDocument();
      });
    });

    it('shows search results when query matches ISBN', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, '9780451524935');

      await waitFor(() => {
        expect(screen.getByText('1984')).toBeInTheDocument();
      });
    });

    it('shows search results when query matches series name', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Classic Literature');

      await waitFor(() => {
        expect(screen.getByText(/To Kill a Mockingbird/)).toBeInTheDocument();
      });
    });

    it('shows no results message when no matches', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'xyz123nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/No books found/)).toBeInTheDocument();
      });
    });

    it('requires at least 2 characters to search', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'G');

      // Should still show empty state, not search results
      expect(screen.getByText(/search your library/i)).toBeInTheDocument();
    });

    it('shows result count', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'the');

      await waitFor(() => {
        expect(screen.getByText(/result/)).toBeInTheDocument();
      });
    });

    it('clears search when clear button is clicked', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Gatsby');

      // Wait for results to appear
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /gatsby/i })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('book status display', () => {
    it('shows Reading badge for books currently being read', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Mockingbird');

      await waitFor(() => {
        expect(screen.getByText('Reading')).toBeInTheDocument();
      });
    });

    it('shows Finished badge for completed books', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Gatsby');

      await waitFor(() => {
        expect(screen.getByText('Finished')).toBeInTheDocument();
      });
    });

    it('shows rating stars for rated books', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Gatsby');

      await waitFor(() => {
        const stars = document.querySelectorAll('.text-yellow-400.fill-yellow-400');
        expect(stars.length).toBe(5); // 5 star rating
      });
    });

    it('shows series badge with position', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Mockingbird');

      // Check for the series name and position
      await waitFor(() => {
        expect(screen.getByText(/Classic Literature/)).toBeInTheDocument();
        expect(screen.getByText(/#1/)).toBeInTheDocument();
      });
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close search/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /close search/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('recent searches', () => {
    it('shows recent searches when available', async () => {
      localStorageMock.setItem('recent_searches', JSON.stringify(['Fantasy', 'Gatsby']));

      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Recent searches')).toBeInTheDocument();
        expect(screen.getByText('Fantasy')).toBeInTheDocument();
        expect(screen.getByText('Gatsby')).toBeInTheDocument();
      });
    });

    it('fills search input when recent search is clicked', async () => {
      localStorageMock.setItem('recent_searches', JSON.stringify(['Fantasy']));

      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Fantasy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fantasy'));

      const input = screen.getByPlaceholderText(/search books/i);
      expect(input).toHaveValue('Fantasy');
    });

    it('clears recent searches when Clear is clicked', async () => {
      localStorageMock.setItem('recent_searches', JSON.stringify(['Fantasy']));

      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Recent searches')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear'));

      await waitFor(() => {
        expect(screen.queryByText('Recent searches')).not.toBeInTheDocument();
      });

      expect(localStorageMock.getItem('recent_searches')).toBeNull();
    });
  });

  describe('result navigation', () => {
    it('navigates to book page when result is clicked', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Gatsby');

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /gatsby/i });
        expect(link).toHaveAttribute('href', '/books/book-1');
      });
    });
  });

  describe('cover image display', () => {
    it('shows book cover when available', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Gatsby');

      await waitFor(() => {
        const img = document.querySelector('img');
        expect(img).toHaveAttribute('src', 'https://example.com/gatsby.jpg');
      });
    });

    it('shows placeholder when no cover', async () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search books/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search books/i);
      await userEvent.type(input, 'Mockingbird');

      await waitFor(() => {
        // Should show the gradient placeholder div
        const placeholder = document.querySelector('.bg-gradient-to-br');
        expect(placeholder).toBeInTheDocument();
      });
    });
  });
});
