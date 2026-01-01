/**
 * Unit Tests for components/image-gallery.tsx
 * Tests for ImageGallery component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageGallery, type GalleryImage } from '../image-gallery';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    ...props
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  ),
}));

// Mock image-upload utils
const mockUploadImage = vi.fn();
const mockDeleteImage = vi.fn();
const mockValidateImage = vi.fn();

vi.mock('@/lib/utils/image-upload', () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage(...args),
  deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
  validateImage: (...args: unknown[]) => mockValidateImage(...args),
}));

const mockImages: GalleryImage[] = [
  {
    id: 'img1',
    url: 'https://example.com/image1.jpg',
    storagePath: 'users/user1/books/book1/img1.jpg',
    isPrimary: true,
    uploadedAt: Date.now(),
  },
  {
    id: 'img2',
    url: 'https://example.com/image2.jpg',
    storagePath: 'users/user1/books/book1/img2.jpg',
    isPrimary: false,
    uploadedAt: Date.now(),
  },
];

describe('ImageGallery', () => {
  const mockOnChange = vi.fn();
  const mockOnPrimaryChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateImage.mockReturnValue({ valid: true });
    mockUploadImage.mockResolvedValue({
      id: 'new-img',
      url: 'https://example.com/new.jpg',
      storagePath: 'users/user1/books/book1/new.jpg',
      sizeBytes: 1000,
    });
    mockDeleteImage.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders header with image count', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Book Images')).toBeInTheDocument();
      expect(screen.getByText('(2/10)')).toBeInTheDocument();
    });

    it('renders all images', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByAltText('Book image 1')).toBeInTheDocument();
      expect(screen.getByAltText('Book image 2')).toBeInTheDocument();
    });

    it('shows primary badge on primary image', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Cover')).toBeInTheDocument();
    });

    it('renders add button when under max', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          maxImages={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Add image')).toBeInTheDocument();
    });

    it('hides add button when at max', () => {
      const maxImages = Array.from({ length: 10 }, (_, i) => ({
        ...mockImages[0],
        id: `img${i}`,
        isPrimary: i === 0,
      }));

      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={maxImages}
          maxImages={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Add image')).not.toBeInTheDocument();
    });

    it('shows help text for multiple images', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/Drag to reorder/)).toBeInTheDocument();
    });

    it('shows simplified help text for single image', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={[mockImages[0]]}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/Drag to reorder/)).not.toBeInTheDocument();
      expect(screen.getByText(/Tap to set as cover/)).toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('shows delete confirmation when delete button clicked', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete image');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Delete Image')).toBeInTheDocument();
      expect(screen.getByText('This is your cover image. Delete it anyway?')).toBeInTheDocument();
    });

    it('shows different message for non-primary image', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete image');
      fireEvent.click(deleteButtons[1]); // Click on second (non-primary) image

      expect(screen.getByText('Are you sure you want to delete this image?')).toBeInTheDocument();
    });

    it('cancels delete when cancel clicked', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete image');
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Delete Image')).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('deletes image when confirmed', async () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete image');
      fireEvent.click(deleteButtons[1]); // Delete non-primary
      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([mockImages[0]]);
      });
    });

    it('makes first remaining image primary when primary is deleted', async () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete image');
      fireEvent.click(deleteButtons[0]); // Delete primary
      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          { ...mockImages[1], isPrimary: true },
        ]);
      });
    });
  });

  describe('set primary functionality', () => {
    it('sets image as primary when clicked', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
          onPrimaryChange={mockOnPrimaryChange}
        />
      );

      // Hover to show set as cover button, then click
      const setAsCoverButtons = screen.getAllByLabelText('Set as cover');
      fireEvent.click(setAsCoverButtons[0]); // Only non-primary images have this

      expect(mockOnChange).toHaveBeenCalledWith([
        { ...mockImages[0], isPrimary: false },
        { ...mockImages[1], isPrimary: true },
      ]);
      expect(mockOnPrimaryChange).toHaveBeenCalledWith(mockImages[1].url, true);
    });
  });

  describe('upload functionality', () => {
    it('validates file before upload', async () => {
      mockValidateImage.mockReturnValue({ valid: false, error: 'File too large' });

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      expect(alertSpy).toHaveBeenCalledWith('File too large');
      alertSpy.mockRestore();
    });

    it('uploads valid file', async () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockUploadImage).toHaveBeenCalled();
      });
    });

    it('shows alert when too many files selected', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={mockImages}
          maxImages={3}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      Object.defineProperty(input, 'files', {
        value: files,
      });

      fireEvent.change(input);

      expect(alertSpy).toHaveBeenCalledWith('Can only add 1 more image');
      alertSpy.mockRestore();
    });
  });

  describe('empty state', () => {
    it('renders correctly with no images', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId="book1"
          images={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('(0/10)')).toBeInTheDocument();
      expect(screen.getByText('Add image')).toBeInTheDocument();
      expect(screen.queryByText(/Tap to set/)).not.toBeInTheDocument();
    });
  });

  describe('new book handling', () => {
    it('works with null bookId for new books', () => {
      render(
        <ImageGallery
          userId="user1"
          bookId={null}
          images={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Book Images')).toBeInTheDocument();
      expect(screen.getByText('Add image')).toBeInTheDocument();
    });
  });
});
