/**
 * Unit Tests for components/lightbox.tsx
 * Tests for Lightbox component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Lightbox } from '../lightbox';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockImages = [
  { url: 'https://example.com/image1.jpg', caption: 'Image 1' },
  { url: 'https://example.com/image2.jpg', caption: 'Image 2' },
  { url: 'https://example.com/image3.jpg' },
];

describe('Lightbox', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(
        <Lightbox images={mockImages} isOpen={false} onClose={mockOnClose} />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders nothing when no images', () => {
      render(<Lightbox images={[]} isOpen={true} onClose={mockOnClose} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open with images', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders first image by default', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    });

    it('renders specified initial image', () => {
      render(
        <Lightbox
          images={mockImages}
          initialIndex={1}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByLabelText('Close image viewer')).toBeInTheDocument();
    });

    it('renders navigation buttons for multiple images', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('does not render navigation for single image', () => {
      render(
        <Lightbox
          images={[mockImages[0]]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });

    it('renders image counter', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('renders image caption when available', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Image 1')).toBeInTheDocument();
    });

    it('renders zoom controls', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders rotate button', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByLabelText('Rotate image')).toBeInTheDocument();
    });

    it('renders thumbnail strip for multiple images', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      // Should have thumbnails for all images
      mockImages.forEach((_, index) => {
        expect(screen.getByLabelText(`View image ${index + 1}`)).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to next image when next button clicked', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByLabelText('Next image'));

      expect(screen.getByAltText('Image 2')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('navigates to previous image when previous button clicked', () => {
      render(
        <Lightbox
          images={mockImages}
          initialIndex={1}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('Previous image'));

      expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    });

    it('wraps to last image when previous from first', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByLabelText('Previous image'));

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('wraps to first image when next from last', () => {
      render(
        <Lightbox
          images={mockImages}
          initialIndex={2}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('Next image'));

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('navigates via thumbnail click', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByLabelText('View image 3'));

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });

  describe('zoom controls', () => {
    it('increases zoom when zoom in clicked', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByLabelText('Zoom in'));

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('decreases zoom when zoom out clicked', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByLabelText('Zoom in'));
      fireEvent.click(screen.getByLabelText('Zoom out'));

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('disables zoom out at minimum zoom', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByLabelText('Zoom out')).toBeDisabled();
    });

    it('disables zoom in at maximum zoom', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      // Zoom in to max (4x = 8 clicks of 0.5)
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByLabelText('Zoom in'));
      }

      expect(screen.getByLabelText('Zoom in')).toBeDisabled();
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button clicked', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByLabelText('Close image viewer'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key pressed', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation', () => {
    it('navigates with ArrowRight key', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('navigates with ArrowLeft key', () => {
      render(
        <Lightbox
          images={mockImages}
          initialIndex={1}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('zooms with + key', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.keyDown(document, { key: '+' });

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('zooms with - key', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.keyDown(document, { key: '+' });
      fireEvent.keyDown(document, { key: '-' });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('rotates with r key', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      // Just verify it doesn't throw - rotation is applied via transform
      fireEvent.keyDown(document, { key: 'r' });
    });
  });

  describe('body scroll lock', () => {
    it('locks body scroll when open', () => {
      render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Lightbox images={mockImages} isOpen={true} onClose={mockOnClose} />
      );

      rerender(
        <Lightbox images={mockImages} isOpen={false} onClose={mockOnClose} />
      );

      expect(document.body.style.overflow).toBe('');
    });
  });
});
