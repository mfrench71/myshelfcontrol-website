/**
 * Unit Tests for components/pickers/series-picker.tsx
 * Tests for SeriesPicker component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SeriesPicker } from '../series-picker';

// Mock repositories
const mockGetSeries = vi.fn();
const mockCreateSeries = vi.fn();

vi.mock('@/lib/repositories/series', () => ({
  getSeries: (...args: unknown[]) => mockGetSeries(...args),
  createSeries: (...args: unknown[]) => mockCreateSeries(...args),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  normalizeSeriesName: (name: string) => name.toLowerCase().trim(),
}));

const mockSeriesList = [
  { id: 'series1', name: 'Harry Potter' },
  { id: 'series2', name: 'Lord of the Rings' },
  { id: 'series3', name: 'The Expanse' },
];

describe('SeriesPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSeries.mockResolvedValue(mockSeriesList);
    mockCreateSeries.mockResolvedValue('new-series-id');
  });

  describe('rendering', () => {
    it('renders label', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Series')).toBeInTheDocument();
    });

    it('renders custom label', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
          label="Book Series"
        />
      );

      expect(screen.getByText('Book Series')).toBeInTheDocument();
    });

    it('shows loading placeholder while loading', () => {
      mockGetSeries.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
    });

    it('shows input placeholder after loading', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });
    });
  });

  describe('selected state', () => {
    it('displays selected series', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId="series1"
          position={3}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Harry Potter')).toBeInTheDocument();
      });
    });

    it('shows position input when series selected', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId="series1"
          position={3}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Position in series')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      });
    });

    it('clears selection when X clicked', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId="series1"
          position={3}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Harry Potter')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Remove from series'));

      expect(mockOnChange).toHaveBeenCalledWith({
        seriesId: null,
        seriesName: '',
        position: null,
      });
    });

    it('updates position when changed', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId="series1"
          position={3}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Position in series'), {
        target: { value: '5' },
      });

      expect(mockOnChange).toHaveBeenCalledWith({
        seriesId: 'series1',
        seriesName: 'Harry Potter',
        position: 5,
      });
    });
  });

  describe('dropdown', () => {
    it('opens dropdown on focus', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or add series...'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows user series in dropdown', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or add series...'));

      expect(screen.getByText('Your series')).toBeInTheDocument();
      expect(screen.getByText('Harry Potter')).toBeInTheDocument();
      expect(screen.getByText('Lord of the Rings')).toBeInTheDocument();
    });

    it('closes dropdown on Escape', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or add series...');
      fireEvent.focus(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('selects series when clicked', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or add series...'));
      fireEvent.click(screen.getByText('Harry Potter'));

      expect(mockOnChange).toHaveBeenCalledWith({
        seriesId: 'series1',
        seriesName: 'Harry Potter',
        position: null,
      });
    });
  });

  describe('search', () => {
    it('filters series based on search query', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or add series...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'harry' } });

      expect(screen.getByText('Harry Potter')).toBeInTheDocument();
      expect(screen.queryByText('Lord of the Rings')).not.toBeInTheDocument();
    });

    it('shows create option for new series name', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or add series...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Dune' } });

      expect(screen.getByText('Create "Dune"')).toBeInTheDocument();
    });
  });

  describe('suggestions', () => {
    it('shows API suggestion', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
          suggestedName="Wheel of Time"
          suggestedPosition={5}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      fireEvent.focus(screen.getByPlaceholderText('Search or add series...'));

      expect(screen.getByText('Suggested from book')).toBeInTheDocument();
      expect(screen.getByText(/Wheel of Time/)).toBeInTheDocument();
      expect(screen.getByText(/#5/)).toBeInTheDocument();
    });

    it('shows suggestion hint when dropdown closed', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
          suggestedName="Wheel of Time"
          suggestedPosition={5}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Use API suggestion: Wheel of Time #5/)).toBeInTheDocument();
      });
    });
  });

  describe('create series', () => {
    it('creates new series when create option clicked', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Search or add series...');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Dune' } });
      fireEvent.click(screen.getByText('Create "Dune"'));

      await waitFor(() => {
        expect(mockCreateSeries).toHaveBeenCalledWith('user1', 'Dune');
      });
    });
  });

  describe('disabled state', () => {
    it('disables input when disabled prop is true', async () => {
      render(
        <SeriesPicker
          userId="user1"
          selectedId={null}
          position={null}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search or add series...')).toBeDisabled();
      });
    });
  });
});
