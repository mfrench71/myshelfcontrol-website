/**
 * Unit Tests for components/pickers/author-picker.tsx
 * Tests for AuthorPicker component with typeahead and library suggestions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthorPicker } from '../author-picker';

// Mock repositories
const mockGetBooks = vi.fn();

vi.mock('@/lib/repositories/books', () => ({
  getBooks: (...args: unknown[]) => mockGetBooks(...args),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  normalizeAuthor: (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' '),
  debounce: (fn: (...args: unknown[]) => void) => fn,
}));

const mockBooks = [
  { id: 'book1', author: 'J.K. Rowling', title: 'Harry Potter' },
  { id: 'book2', author: 'J.K. Rowling', title: 'Fantastic Beasts' },
  { id: 'book3', author: 'George Orwell', title: '1984' },
  { id: 'book4', author: 'George Orwell', title: 'Animal Farm' },
  { id: 'book5', author: 'George Orwell', title: 'Homage to Catalonia' },
  { id: 'book6', author: 'Jane Austen', title: 'Pride and Prejudice' },
  { id: 'book7', author: 'Deleted Author', title: 'Deleted Book', deletedAt: new Date() },
];

describe('AuthorPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBooks.mockResolvedValue(mockBooks);
  });

  describe('rendering', () => {
    it('renders label', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Author')).toBeInTheDocument();
    });

    it('renders custom label', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
          label="Book Author"
        />
      );

      expect(screen.getByText('Book Author')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('shows loading placeholder while loading', () => {
      mockGetBooks.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
    });

    it('shows input placeholder after loading', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });
    });

    it('shows custom placeholder', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
          placeholder="Type author name..."
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type author name...')).toBeInTheDocument();
      });
    });

    it('displays current value in input', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value="J.K. Rowling"
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('J.K. Rowling')).toBeInTheDocument();
      });
    });
  });

  describe('dropdown', () => {
    it('opens dropdown on focus', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows authors sorted by book count', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));

      expect(screen.getByText('Your authors')).toBeInTheDocument();
      // George Orwell has 3 books, should appear first
      expect(screen.getByText('George Orwell')).toBeInTheDocument();
      expect(screen.getByText('3 books')).toBeInTheDocument();
      // J.K. Rowling has 2 books
      expect(screen.getByText('J.K. Rowling')).toBeInTheDocument();
      expect(screen.getByText('2 books')).toBeInTheDocument();
      // Jane Austen has 1 book
      expect(screen.getByText('Jane Austen')).toBeInTheDocument();
      expect(screen.getByText('1 book')).toBeInTheDocument();
    });

    it('excludes deleted books from author counts', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));

      // Deleted Author should not appear
      expect(screen.queryByText('Deleted Author')).not.toBeInTheDocument();
    });

    it('closes dropdown on Escape', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown when close button clicked', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Close dropdown'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on click outside', async () => {
      render(
        <div>
          <AuthorPicker
            userId="user1"
            value=""
            onChange={mockOnChange}
          />
          <button>Outside</button>
        </div>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByText('Outside'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('selects author when clicked', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));
      fireEvent.click(screen.getByText('J.K. Rowling'));

      expect(mockOnChange).toHaveBeenCalledWith('J.K. Rowling');
    });

    it('sets isOpen to false after selection (re-opens on focus)', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));
      fireEvent.click(screen.getByText('J.K. Rowling'));

      // Selection triggers onChange and updates value
      // Dropdown re-opens because input.focus() is called which triggers onFocus
      expect(mockOnChange).toHaveBeenCalledWith('J.K. Rowling');
    });

    it('updates input value after selection', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));
      fireEvent.click(screen.getByText('Jane Austen'));

      expect(screen.getByDisplayValue('Jane Austen')).toBeInTheDocument();
    });
  });

  describe('search and filtering', () => {
    it('filters authors based on search query', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'row' } });

      expect(screen.getByText('J.K. Rowling')).toBeInTheDocument();
      expect(screen.queryByText('George Orwell')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Austen')).not.toBeInTheDocument();
    });

    it('shows "Use typed value" option for new author', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Stephen King' } });

      expect(screen.getByText('Use "Stephen King"')).toBeInTheDocument();
    });

    it('does not show "Use typed value" for exact match', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'J.K. Rowling' } });

      expect(screen.queryByText(/Use "J.K. Rowling"/)).not.toBeInTheDocument();
    });

    it('selects typed value when "Use" option clicked', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Author' } });
      fireEvent.click(screen.getByText('Use "New Author"'));

      expect(mockOnChange).toHaveBeenCalledWith('New Author');
    });

    it('calls onChange when typing', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.change(input, { target: { value: 'Test Author' } });

      expect(mockOnChange).toHaveBeenCalledWith('Test Author');
    });
  });

  describe('keyboard navigation', () => {
    it('navigates down with ArrowDown', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // First item should be focused (highlighted with bg-gray-100)
      const items = screen.getAllByRole('button').filter(btn => btn.hasAttribute('data-picker-item'));
      expect(items[0].classList.contains('bg-gray-100')).toBe(true);
    });

    it('navigates up with ArrowUp', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const items = screen.getAllByRole('button').filter(btn => btn.hasAttribute('data-picker-item'));
      expect(items[0].classList.contains('bg-gray-100')).toBe(true);
    });

    it('selects focused item on Enter', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should select the first author (George Orwell - most books)
      expect(mockOnChange).toHaveBeenCalledWith('George Orwell');
    });

    it('uses typed value on Enter when no item focused', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Custom Author' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('Custom Author');
    });

    it('commits value on Tab', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Tab Author' } });
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(mockOnChange).toHaveBeenCalledWith('Tab Author');
    });
  });

  describe('empty state', () => {
    it('shows empty message when no authors in library', async () => {
      mockGetBooks.mockResolvedValue([]);

      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));

      expect(screen.getByText('No authors in your library yet')).toBeInTheDocument();
    });

    it('shows no matches message when search has no results', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or enter author...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'xyz123nonexistent' } });

      // Should show "Use typed value" option but no author matches
      expect(screen.getByText('Use "xyz123nonexistent"')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables input when disabled prop is true', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeDisabled();
      });
    });

    it('disables input while loading', () => {
      mockGetBooks.mockImplementation(() => new Promise(() => {}));

      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has combobox role', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('has aria-expanded attribute', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');

      fireEvent.focus(input);
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-haspopup attribute', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox');
      });
    });

    it('has aria-autocomplete attribute', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'list');
      });
    });

    it('icons have aria-hidden attribute', async () => {
      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or enter author...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or enter author...'));

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('handles API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetBooks.mockRejectedValue(new Error('API Error'));

      render(
        <AuthorPicker
          userId="user1"
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load authors:', expect.any(Error));
      });

      // Should still render and be usable
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('does not load authors when userId is empty', async () => {
      render(
        <AuthorPicker
          userId=""
          value=""
          onChange={mockOnChange}
        />
      );

      // Wait a bit to ensure no API call is made
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGetBooks).not.toHaveBeenCalled();
    });
  });

  describe('value synchronisation', () => {
    it('updates search query when value prop changes', async () => {
      const { rerender } = render(
        <AuthorPicker
          userId="user1"
          value="Initial Author"
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Initial Author')).toBeInTheDocument();
      });

      rerender(
        <AuthorPicker
          userId="user1"
          value="Updated Author"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('Updated Author')).toBeInTheDocument();
    });
  });
});
