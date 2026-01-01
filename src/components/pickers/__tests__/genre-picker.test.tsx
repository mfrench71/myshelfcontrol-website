/**
 * Unit Tests for components/pickers/genre-picker.tsx
 * Tests for GenrePicker component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenrePicker } from '../genre-picker';

// Mock repositories
const mockGetGenres = vi.fn();
const mockCreateGenre = vi.fn();

vi.mock('@/lib/repositories/genres', () => ({
  getGenres: (...args: unknown[]) => mockGetGenres(...args),
  createGenre: (...args: unknown[]) => mockCreateGenre(...args),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  getContrastColor: () => '#ffffff',
  normalizeGenreName: (name: string) => name.toLowerCase().trim(),
  getNextAvailableColor: () => '#3b82f6',
}));

const mockGenres = [
  { id: 'genre1', name: 'Fiction', color: '#3b82f6' },
  { id: 'genre2', name: 'Fantasy', color: '#10b981' },
  { id: 'genre3', name: 'Science Fiction', color: '#f59e0b' },
];

describe('GenrePicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGenres.mockResolvedValue(mockGenres);
    mockCreateGenre.mockResolvedValue('new-genre-id');
  });

  describe('rendering', () => {
    it('renders label', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Genres')).toBeInTheDocument();
    });

    it('renders custom label', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
          label="Book Categories"
        />
      );

      expect(screen.getByText('Book Categories')).toBeInTheDocument();
    });

    it('shows loading placeholder while loading', () => {
      mockGetGenres.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('Loading genres...')).toBeInTheDocument();
    });

    it('shows input placeholder after loading', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });
    });

    it('displays selected genres as badges', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={['genre1', 'genre2']}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Fiction')).toBeInTheDocument();
        expect(screen.getByText('Fantasy')).toBeInTheDocument();
      });
    });
  });

  describe('dropdown', () => {
    it('opens dropdown on focus', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Add genre...'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows user genres in dropdown', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Add genre...'));

      expect(screen.getByText('Your genres')).toBeInTheDocument();
      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
    });

    it('closes dropdown on Escape', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add genre...');
      fireEvent.focus(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('adds genre to selection when clicked', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Add genre...'));
      fireEvent.click(screen.getByText('Fiction'));

      expect(mockOnChange).toHaveBeenCalledWith(['genre1']);
    });

    it('removes genre from selection when clicked again', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={['genre1']}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Add genre...'));
      // Use getAllByRole since there may be multiple matching elements
      const options = screen.getAllByRole('option', { name: /Fiction/i });
      fireEvent.click(options[0]);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('removes genre when X button clicked on badge', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={['genre1']}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Fiction')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Remove Fiction'));

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('search', () => {
    it('filters genres based on search query', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add genre...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'fic' } });

      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Science Fiction')).toBeInTheDocument();
      expect(screen.queryByText('Fantasy')).not.toBeInTheDocument();
    });

    it('shows create option for new genre name', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add genre...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Horror' } });

      expect(screen.getByText('Create "Horror"')).toBeInTheDocument();
    });
  });

  describe('suggestions', () => {
    it('shows API suggestions', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
          suggestions={['Mystery', 'Thriller']}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Add genre...'));

      expect(screen.getByText('Suggested from book')).toBeInTheDocument();
      expect(screen.getByText('Mystery')).toBeInTheDocument();
      expect(screen.getByText('Thriller')).toBeInTheDocument();
    });
  });

  describe('create genre', () => {
    it('creates new genre when create option clicked', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add genre...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Horror' } });
      fireEvent.click(screen.getByText('Create "Horror"'));

      await waitFor(() => {
        expect(mockCreateGenre).toHaveBeenCalledWith('user1', 'Horror', '#3b82f6');
      });
    });
  });

  describe('disabled state', () => {
    it('disables input when disabled prop is true', async () => {
      render(
        <GenrePicker
          userId="user1"
          selected={[]}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add genre...')).toBeDisabled();
      });
    });
  });
});
