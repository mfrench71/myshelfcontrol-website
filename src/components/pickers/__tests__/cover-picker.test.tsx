/**
 * Unit Tests for components/pickers/cover-picker.tsx
 * Tests for cover picker component with multiple source options
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoverPicker, type CoverOptions, type CoverSource } from '../cover-picker';

describe('CoverPicker', () => {
  const mockCovers: CoverOptions = {
    googleBooks: 'https://books.google.com/cover.jpg',
    openLibrary: 'https://covers.openlibrary.org/cover.jpg',
    userUpload: 'https://storage.example.com/upload.jpg',
  };

  describe('rendering', () => {
    it('renders label', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Cover Image')).toBeInTheDocument();
    });

    it('renders custom label', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
          label="Book Cover"
        />
      );

      expect(screen.getByText('Book Cover')).toBeInTheDocument();
    });

    it('renders all available cover sources', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Google Books')).toBeInTheDocument();
      expect(screen.getByText('Open Library')).toBeInTheDocument();
      expect(screen.getByText('Your Upload')).toBeInTheDocument();
    });

    it('renders only available sources', () => {
      const onChange = vi.fn();
      const partialCovers: CoverOptions = {
        googleBooks: 'https://books.google.com/cover.jpg',
      };

      render(
        <CoverPicker
          covers={partialCovers}
          selectedUrl={partialCovers.googleBooks!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Google Books')).toBeInTheDocument();
      expect(screen.queryByText('Open Library')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Upload')).not.toBeInTheDocument();
    });

    it('shows placeholder when no covers available', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker covers={{}} selectedUrl="" onChange={onChange} />
      );

      expect(screen.getByText('No cover available')).toBeInTheDocument();
    });

    it('filters out invalid URLs', () => {
      const onChange = vi.fn();
      const invalidCovers: CoverOptions = {
        googleBooks: '',
        openLibrary: 'https://valid.url/cover.jpg',
        userUpload: undefined,
      };

      render(
        <CoverPicker
          covers={invalidCovers}
          selectedUrl={invalidCovers.openLibrary!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Open Library')).toBeInTheDocument();
      expect(screen.queryByText('Google Books')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Upload')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('shows selected indicator on selected cover', () => {
      const onChange = vi.fn();
      const { container } = render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      // Selected cover should have the check badge
      const checkIcons = container.querySelectorAll('.bg-primary.rounded-full');
      expect(checkIcons.length).toBe(1);
    });

    it('calls onChange when clicking a different cover', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      // Click on Open Library cover
      const openLibraryButton = screen.getByText('Open Library').closest('button');
      fireEvent.click(openLibraryButton!);

      expect(onChange).toHaveBeenCalledWith(
        mockCovers.openLibrary,
        'openLibrary'
      );
    });

    it('calls onChange when clicking userUpload cover', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      const uploadButton = screen.getByText('Your Upload').closest('button');
      fireEvent.click(uploadButton!);

      expect(onChange).toHaveBeenCalledWith(
        mockCovers.userUpload,
        'userUpload'
      );
    });
  });

  describe('disabled state', () => {
    it('does not call onChange when disabled', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
          disabled={true}
        />
      );

      const openLibraryButton = screen.getByText('Open Library').closest('button');
      fireEvent.click(openLibraryButton!);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('auto-selection', () => {
    it('auto-selects first cover if none selected', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl=""
          onChange={onChange}
        />
      );

      // Should auto-select the first available source (googleBooks)
      expect(onChange).toHaveBeenCalledWith(
        mockCovers.googleBooks,
        'googleBooks'
      );
    });

    it('does not auto-select if a cover is already selected', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.openLibrary!}
          onChange={onChange}
        />
      );

      // Should not call onChange for auto-selection
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('image loading', () => {
    it('shows loading spinner initially', () => {
      const onChange = vi.fn();
      const { container } = render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      const spinners = container.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('hides spinner after image loads', () => {
      const onChange = vi.fn();
      const { container } = render(
        <CoverPicker
          covers={{ googleBooks: mockCovers.googleBooks }}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      const img = container.querySelector('img');
      fireEvent.load(img!);

      // After load, image should be visible (opacity-100)
      expect(img?.classList.contains('opacity-100')).toBe(true);
    });

    it('hides cover option on image error', () => {
      const onChange = vi.fn();
      const { container } = render(
        <CoverPicker
          covers={{ googleBooks: mockCovers.googleBooks }}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      // After error, the button should not be rendered (CoverOption returns null)
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('source identification', () => {
    it('identifies userUpload as selected source', () => {
      const onChange = vi.fn();
      const { container } = render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.userUpload!}
          onChange={onChange}
        />
      );

      // The userUpload option should have selected styling
      const userUploadButton = screen.getByText('Your Upload').closest('button');
      expect(userUploadButton?.classList.contains('border-primary')).toBe(true);
    });

    it('identifies googleBooks as selected source', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.googleBooks!}
          onChange={onChange}
        />
      );

      const googleButton = screen.getByText('Google Books').closest('button');
      expect(googleButton?.classList.contains('border-primary')).toBe(true);
    });

    it('identifies openLibrary as selected source', () => {
      const onChange = vi.fn();
      render(
        <CoverPicker
          covers={mockCovers}
          selectedUrl={mockCovers.openLibrary!}
          onChange={onChange}
        />
      );

      const openLibraryButton = screen.getByText('Open Library').closest('button');
      expect(openLibraryButton?.classList.contains('border-primary')).toBe(true);
    });
  });

  describe('URL validation', () => {
    it('accepts http URLs', () => {
      const onChange = vi.fn();
      const httpCovers: CoverOptions = {
        googleBooks: 'http://example.com/cover.jpg',
      };

      render(
        <CoverPicker
          covers={httpCovers}
          selectedUrl={httpCovers.googleBooks!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Google Books')).toBeInTheDocument();
    });

    it('accepts https URLs', () => {
      const onChange = vi.fn();
      const httpsCovers: CoverOptions = {
        googleBooks: 'https://example.com/cover.jpg',
      };

      render(
        <CoverPicker
          covers={httpsCovers}
          selectedUrl={httpsCovers.googleBooks!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Google Books')).toBeInTheDocument();
    });

    it('accepts data: URLs', () => {
      const onChange = vi.fn();
      const dataCovers: CoverOptions = {
        userUpload: 'data:image/png;base64,abc123',
      };

      render(
        <CoverPicker
          covers={dataCovers}
          selectedUrl={dataCovers.userUpload!}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Your Upload')).toBeInTheDocument();
    });

    it('rejects invalid URLs', () => {
      const onChange = vi.fn();
      const invalidCovers: CoverOptions = {
        googleBooks: 'not-a-url',
        openLibrary: 'ftp://example.com/cover.jpg',
      };

      render(
        <CoverPicker
          covers={invalidCovers}
          selectedUrl=""
          onChange={onChange}
        />
      );

      expect(screen.getByText('No cover available')).toBeInTheDocument();
    });
  });
});
