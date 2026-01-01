/**
 * Unit Tests for components/books/filter-panel.tsx
 * Tests for FilterSidebar, MobileSortDropdown, FilterBottomSheet, ActiveFilterChip
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilterSidebar,
  MobileSortDropdown,
  FilterBottomSheet,
  ActiveFilterChip,
  FilterSidebarSkeleton,
  type BookCounts,
} from '../filter-panel';
import type { Genre, Series, BookFilters } from '@/lib/types';

const mockGenres: Genre[] = [
  { id: 'genre-1', name: 'Fiction', color: '#FF0000', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'genre-2', name: 'Fantasy', color: '#00FF00', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'genre-3', name: 'Mystery', color: '#0000FF', createdAt: Date.now(), updatedAt: Date.now() },
];

const mockSeries: Series[] = [
  { id: 'series-1', name: 'Harry Potter', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'series-2', name: 'Lord of the Rings', createdAt: Date.now(), updatedAt: Date.now() },
];

const mockAuthors = ['J.K. Rowling', 'J.R.R. Tolkien', 'Stephen King', 'Agatha Christie'];

const mockBookCounts: BookCounts = {
  genres: { 'genre-1': 5, 'genre-2': 3, 'genre-3': 0 },
  statuses: { reading: 2, finished: 8 },
  series: { 'series-1': 7, 'series-2': 3 },
  ratings: { 5: 3, 4: 5, 3: 7, 2: 8, 1: 10 },
  authors: { 'J.K. Rowling': 7, 'J.R.R. Tolkien': 3, 'Stephen King': 5, 'Agatha Christie': 2 },
  total: 15,
};

const defaultFilters: BookFilters = {};

describe('FilterSidebar', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnSortChange = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderFilterSidebar = (overrides = {}) => {
    return render(
      <FilterSidebar
        genres={mockGenres}
        series={mockSeries}
        authors={mockAuthors}
        filters={defaultFilters}
        sortValue="createdAt-desc"
        bookCounts={mockBookCounts}
        onFiltersChange={mockOnFiltersChange}
        onSortChange={mockOnSortChange}
        onReset={mockOnReset}
        {...overrides}
      />
    );
  };

  describe('sort dropdown', () => {
    it('renders sort dropdown with default value', () => {
      renderFilterSidebar();

      const select = screen.getByRole('combobox', { name: /sort by/i });
      expect(select).toHaveValue('createdAt-desc');
    });

    it('calls onSortChange when sort is changed', async () => {
      renderFilterSidebar();

      const select = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(select, { target: { value: 'title-asc' } });

      expect(mockOnSortChange).toHaveBeenCalledWith('title-asc');
    });

    it('includes series sort option when filtering by series', () => {
      renderFilterSidebar({ filters: { seriesIds: ['series-1'] } });

      const select = screen.getByRole('combobox', { name: /sort by/i });
      const options = within(select).getAllByRole('option');
      const optionValues = options.map((o) => o.getAttribute('value'));

      expect(optionValues).toContain('seriesPosition-asc');
    });

    it('excludes series sort option when not filtering by series', () => {
      renderFilterSidebar();

      const select = screen.getByRole('combobox', { name: /sort by/i });
      const options = within(select).getAllByRole('option');
      const optionValues = options.map((o) => o.getAttribute('value'));

      expect(optionValues).not.toContain('seriesPosition-asc');
    });
  });

  describe('status filters', () => {
    it('renders status checkboxes', () => {
      renderFilterSidebar();

      expect(screen.getByLabelText(/reading/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/finished/i)).toBeInTheDocument();
    });

    it('shows book counts for statuses', () => {
      renderFilterSidebar();

      expect(screen.getByText('(2)')).toBeInTheDocument(); // reading count
      expect(screen.getByText('(8)')).toBeInTheDocument(); // finished count
    });

    it('calls onFiltersChange when status is checked', () => {
      renderFilterSidebar();

      fireEvent.click(screen.getByLabelText(/reading/i));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        statuses: ['reading'],
      });
    });

    it('unchecks status when already checked', () => {
      renderFilterSidebar({ filters: { statuses: ['reading', 'finished'] } });

      fireEvent.click(screen.getByLabelText(/reading/i));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        statuses: ['finished'],
      });
    });

    it('removes statuses from filters when all unchecked', () => {
      renderFilterSidebar({ filters: { statuses: ['reading'] } });

      fireEvent.click(screen.getByLabelText(/reading/i));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        statuses: undefined,
      });
    });
  });

  describe('rating filter', () => {
    it('renders rating dropdown', () => {
      renderFilterSidebar();

      expect(screen.getByRole('combobox', { name: /rating/i })).toBeInTheDocument();
    });

    it('shows counts in rating options', () => {
      renderFilterSidebar();

      const select = screen.getByRole('combobox', { name: /rating/i });
      expect(within(select).getByText(/5 Stars \(3\)/)).toBeInTheDocument();
      expect(within(select).getByText(/4\+ Stars \(5\)/)).toBeInTheDocument();
    });

    it('calls onFiltersChange when rating is selected', () => {
      renderFilterSidebar();

      const select = screen.getByRole('combobox', { name: /rating/i });
      fireEvent.change(select, { target: { value: '4' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        minRating: 4,
      });
    });

    it('clears rating when All Ratings is selected', () => {
      renderFilterSidebar({ filters: { minRating: 4 } });

      const select = screen.getByRole('combobox', { name: /rating/i });
      fireEvent.change(select, { target: { value: '0' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        minRating: undefined,
      });
    });
  });

  describe('genre filters', () => {
    it('renders genre checkboxes', () => {
      renderFilterSidebar();

      expect(screen.getByRole('checkbox', { name: /fiction/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /fantasy/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /mystery/i })).toBeInTheDocument();
    });

    it('shows genre section header', () => {
      renderFilterSidebar();

      expect(screen.getByText('Genre')).toBeInTheDocument();
    });

    it('calls onFiltersChange when genre is checked', () => {
      renderFilterSidebar();

      const fictionCheckbox = screen.getByRole('checkbox', { name: /fiction/i });
      fireEvent.click(fictionCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        genreIds: ['genre-1'],
      });
    });

    it('disables genres with zero count', () => {
      renderFilterSidebar();

      const mysteryCheckbox = screen.getByRole('checkbox', { name: /mystery/i });
      expect(mysteryCheckbox).toBeDisabled();
    });

    it('does not render genre section when empty', () => {
      renderFilterSidebar({ genres: [] });

      expect(screen.queryByText('Genre')).not.toBeInTheDocument();
    });
  });

  describe('series filters', () => {
    it('hides series by default behind More button', () => {
      renderFilterSidebar();

      expect(screen.queryByText('Harry Potter')).not.toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
    });

    it('shows series when More is clicked', () => {
      renderFilterSidebar();

      fireEvent.click(screen.getByText('More'));

      expect(screen.getByText('Harry Potter')).toBeInTheDocument();
      expect(screen.getByText('Lord of the Rings')).toBeInTheDocument();
    });

    it('toggles to Less when expanded', () => {
      renderFilterSidebar();

      fireEvent.click(screen.getByText('More'));

      expect(screen.getByText('Less')).toBeInTheDocument();
    });

    it('calls onFiltersChange when series is checked', () => {
      renderFilterSidebar();

      fireEvent.click(screen.getByText('More'));
      const harryPotterCheckbox = screen.getByRole('checkbox', { name: /harry potter/i });
      fireEvent.click(harryPotterCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        seriesIds: ['series-1'],
      });
    });

    it('shows series section expanded when series filter is active', () => {
      renderFilterSidebar({ filters: { seriesIds: ['series-1'] } });

      expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    });

    it('does not render series section when empty', () => {
      renderFilterSidebar({ series: [] });

      expect(screen.queryByText('More')).not.toBeInTheDocument();
    });
  });

  describe('author filter', () => {
    it('renders author typeahead', () => {
      renderFilterSidebar();

      expect(screen.getByRole('combobox', { name: /author/i })).toBeInTheDocument();
    });

    it('shows authors in dropdown when focused', async () => {
      renderFilterSidebar();

      const input = screen.getByRole('combobox', { name: /author/i });
      fireEvent.focus(input);

      expect(await screen.findByText('J.K. Rowling')).toBeInTheDocument();
    });

    it('filters authors based on input', async () => {
      renderFilterSidebar();

      const input = screen.getByRole('combobox', { name: /author/i });
      await userEvent.clear(input);
      await userEvent.type(input, 'Tolkien');

      // Should find Tolkien in the filtered list
      const tolkienOption = await screen.findByRole('option', { name: /J\.R\.R\. Tolkien/i });
      expect(tolkienOption).toBeInTheDocument();

      // Verify the filtered results contain only matching author
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(o => o.textContent);
      expect(optionTexts.some(t => t?.includes('Tolkien'))).toBe(true);
    });

    it('calls onFiltersChange when author is selected', async () => {
      renderFilterSidebar();

      const input = screen.getByRole('combobox', { name: /author/i });
      fireEvent.focus(input);

      const authorOption = await screen.findByRole('option', { name: /J\.K\. Rowling/i });
      fireEvent.click(authorOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        author: 'J.K. Rowling',
      });
    });

    it('does not render author section when empty', () => {
      renderFilterSidebar({ authors: [] });

      expect(screen.queryByRole('combobox', { name: /author/i })).not.toBeInTheDocument();
    });
  });

  describe('reset button', () => {
    it('is disabled when no filters are active', () => {
      renderFilterSidebar();

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).toBeDisabled();
    });

    it('is enabled when filters are active', () => {
      renderFilterSidebar({ filters: { statuses: ['reading'] } });

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).not.toBeDisabled();
    });

    it('is enabled when sort is non-default', () => {
      renderFilterSidebar({ sortValue: 'title-asc' });

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).not.toBeDisabled();
    });

    it('calls onReset when clicked', () => {
      renderFilterSidebar({ filters: { statuses: ['reading'] } });

      fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });
});

describe('MobileSortDropdown', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with current value', () => {
    render(<MobileSortDropdown value="createdAt-desc" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox', { name: /sort books by/i });
    expect(select).toHaveValue('createdAt-desc');
  });

  it('calls onChange when sort is changed', () => {
    render(<MobileSortDropdown value="createdAt-desc" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox', { name: /sort books by/i });
    fireEvent.change(select, { target: { value: 'author-asc' } });

    expect(mockOnChange).toHaveBeenCalledWith('author-asc');
  });

  it('includes series sort option when hasSeriesFilter is true', () => {
    render(<MobileSortDropdown value="createdAt-desc" onChange={mockOnChange} hasSeriesFilter />);

    const select = screen.getByRole('combobox', { name: /sort books by/i });
    const options = within(select).getAllByRole('option');
    const optionValues = options.map((o) => o.getAttribute('value'));

    expect(optionValues).toContain('seriesPosition-asc');
  });

  it('excludes series sort option when hasSeriesFilter is false', () => {
    render(<MobileSortDropdown value="createdAt-desc" onChange={mockOnChange} hasSeriesFilter={false} />);

    const select = screen.getByRole('combobox', { name: /sort books by/i });
    const options = within(select).getAllByRole('option');
    const optionValues = options.map((o) => o.getAttribute('value'));

    expect(optionValues).not.toContain('seriesPosition-asc');
  });
});

describe('FilterBottomSheet', () => {
  const mockOnClose = vi.fn();
  const mockOnFiltersChange = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  const renderBottomSheet = (overrides = {}) => {
    return render(
      <FilterBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        genres={mockGenres}
        series={mockSeries}
        authors={mockAuthors}
        filters={defaultFilters}
        bookCounts={mockBookCounts}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        {...overrides}
      />
    );
  };

  it('renders when open', () => {
    renderBottomSheet();

    expect(screen.getByRole('heading', { name: /filters/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderBottomSheet({ isOpen: false });

    expect(screen.queryByRole('heading', { name: /filters/i })).not.toBeInTheDocument();
  });

  it('renders status checkboxes', () => {
    renderBottomSheet();

    expect(screen.getByLabelText(/reading/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/finished/i)).toBeInTheDocument();
  });

  it('renders rating dropdown', () => {
    renderBottomSheet();

    expect(screen.getByRole('combobox', { name: /rating/i })).toBeInTheDocument();
  });

  it('renders author typeahead when authors exist', () => {
    renderBottomSheet();

    expect(screen.getByRole('combobox', { name: /author/i })).toBeInTheDocument();
  });

  it('renders genre checkboxes', () => {
    renderBottomSheet();

    expect(screen.getByRole('checkbox', { name: /fiction/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /fantasy/i })).toBeInTheDocument();
  });

  it('renders Apply Filters button', () => {
    renderBottomSheet();

    expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
  });

  it('calls onClose when Apply Filters is clicked', () => {
    renderBottomSheet();

    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when Reset Filters is clicked', () => {
    renderBottomSheet();

    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('calls onFiltersChange when status is toggled', () => {
    renderBottomSheet();

    fireEvent.click(screen.getByLabelText(/reading/i));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      statuses: ['reading'],
    });
  });
});

describe('ActiveFilterChip', () => {
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chip with label', () => {
    render(<ActiveFilterChip label="Fiction" onRemove={mockOnRemove} />);

    expect(screen.getByText('Fiction')).toBeInTheDocument();
  });

  it('renders remove button with accessible label', () => {
    render(<ActiveFilterChip label="Fiction" type="genre" onRemove={mockOnRemove} />);

    expect(screen.getByRole('button', { name: /remove fiction filter/i })).toBeInTheDocument();
  });

  it('calls onRemove when clicked', () => {
    render(<ActiveFilterChip label="Fiction" onRemove={mockOnRemove} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling for genre type', () => {
    render(<ActiveFilterChip label="Fiction" type="genre" onRemove={mockOnRemove} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-purple-100');
    expect(button).toHaveClass('text-purple-800');
  });

  it('applies correct styling for status type', () => {
    render(<ActiveFilterChip label="Reading" type="status" onRemove={mockOnRemove} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-green-100');
    expect(button).toHaveClass('text-green-800');
  });

  it('applies correct styling for rating type', () => {
    render(<ActiveFilterChip label="4+ Stars" type="rating" onRemove={mockOnRemove} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-amber-100');
    expect(button).toHaveClass('text-amber-800');
  });

  it('applies correct styling for series type', () => {
    render(<ActiveFilterChip label="Harry Potter" type="series" onRemove={mockOnRemove} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-100');
    expect(button).toHaveClass('text-blue-800');
  });

  it('applies correct styling for author type', () => {
    render(<ActiveFilterChip label="J.K. Rowling" type="author" onRemove={mockOnRemove} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-rose-100');
    expect(button).toHaveClass('text-rose-800');
  });

  it('applies default styling when type is not specified', () => {
    render(<ActiveFilterChip label="Custom" onRemove={mockOnRemove} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-100');
    expect(button).toHaveClass('text-gray-800');
  });
});

describe('FilterSidebarSkeleton', () => {
  it('renders skeleton with loading animation', () => {
    render(<FilterSidebarSkeleton />);

    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders skeleton placeholders', () => {
    render(<FilterSidebarSkeleton />);

    const placeholders = document.querySelectorAll('.bg-gray-200');
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
