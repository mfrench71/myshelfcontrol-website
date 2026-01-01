/**
 * Unit Tests for lib/utils/image-upload.ts
 * Tests for image validation, compression, and upload utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImage,
  getImageDimensions,
  compressImage,
  uploadImage,
  deleteImage,
  deleteImages,
} from '../image-upload';

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({ fullPath: 'mock/path' })),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((event, onProgress, onError, onComplete) => {
      // Simulate successful upload
      setTimeout(() => {
        onProgress({ bytesTransferred: 50, totalBytes: 100 });
        onComplete();
      }, 0);
    }),
    snapshot: { ref: { fullPath: 'mock/path' } },
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/image.jpg')),
  deleteObject: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/firebase/client', () => ({
  storage: {},
}));

// Mock Image for dimensions
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  naturalWidth = 800;
  naturalHeight = 600;

  constructor() {
    setTimeout(() => this.onload?.(), 0);
  }
}

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

describe('image-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.Image = MockImage as unknown as typeof Image;
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  describe('validateImage', () => {
    it('rejects null file', () => {
      const result = validateImage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('rejects undefined file', () => {
      const result = validateImage(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('accepts valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = validateImage(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid WebP file', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      const result = validateImage(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid GIF file', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = validateImage(file);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid file type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('rejects SVG file', () => {
      const file = new File(['test'], 'test.svg', { type: 'image/svg+xml' });
      const result = validateImage(file);
      expect(result.valid).toBe(false);
    });

    it('rejects file over 5MB', () => {
      // Create a file over 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
      expect(result.error).toContain('5MB');
    });

    it('accepts file exactly 5MB', () => {
      const content = new Array(5 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'exact.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('getImageDimensions', () => {
    it('returns image dimensions', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dimensions = await getImageDimensions(file);

      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it('creates and revokes object URL', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await getImageDimensions(file);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('handles image load error', async () => {
      class FailingImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => this.onerror?.(), 0);
        }
      }
      global.Image = FailingImage as unknown as typeof Image;

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await expect(getImageDimensions(file)).rejects.toThrow('Failed to load image');
    });
  });

  describe('compressImage', () => {
    let mockCanvas: {
      width: number;
      height: number;
      getContext: ReturnType<typeof vi.fn>;
      toBlob: ReturnType<typeof vi.fn>;
      toDataURL: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toBlob: vi.fn((callback) => {
          callback(new Blob(['compressed'], { type: 'image/jpeg' }));
        }),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,...'),
      };
      document.createElement = vi.fn((tag) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return {} as HTMLElement;
      });
    });

    it('skips compression for GIF files', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = await compressImage(file);

      expect(result.blob).toBe(file);
      expect(result.mimeType).toBe('image/gif');
      expect(result.extension).toBe('gif');
    });

    it('compresses JPEG files', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await compressImage(file);

      expect(result.blob).not.toBe(file);
      expect(result.mimeType).toMatch(/image\/(webp|jpeg)/);
    });

    it('respects maxWidth option', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await compressImage(file, { maxWidth: 400 });

      // Canvas should be resized
      expect(mockCanvas.width).toBeLessThanOrEqual(400);
    });

    it('handles canvas context error', async () => {
      mockCanvas.getContext = vi.fn(() => null);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await expect(compressImage(file)).rejects.toThrow('Failed to get canvas context');
    });

    it('handles blob creation failure', async () => {
      mockCanvas.toBlob = vi.fn((callback) => callback(null));

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await expect(compressImage(file)).rejects.toThrow('Failed to compress image');
    });
  });

  describe('deleteImage', () => {
    it('throws error for empty storage path', async () => {
      await expect(deleteImage('')).rejects.toThrow('No storage path provided');
    });

    it('deletes image from storage', async () => {
      const { deleteObject } = await import('firebase/storage');

      await deleteImage('users/123/images/photo.jpg');

      expect(deleteObject).toHaveBeenCalled();
    });

    it('ignores object-not-found errors', async () => {
      const { deleteObject } = await import('firebase/storage');
      (deleteObject as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        code: 'storage/object-not-found',
      });

      // Should not throw
      await expect(deleteImage('path/to/missing.jpg')).resolves.toBeUndefined();
    });

    it('throws for other errors', async () => {
      const { deleteObject } = await import('firebase/storage');
      (deleteObject as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        code: 'storage/unauthorized',
      });

      await expect(deleteImage('path/to/file.jpg')).rejects.toThrow('Failed to delete image');
    });
  });

  describe('deleteImages', () => {
    it('handles null input', async () => {
      await expect(deleteImages(null)).resolves.toBeUndefined();
    });

    it('handles undefined input', async () => {
      await expect(deleteImages(undefined)).resolves.toBeUndefined();
    });

    it('handles empty array', async () => {
      await expect(deleteImages([])).resolves.toBeUndefined();
    });

    it('deletes multiple images', async () => {
      const { deleteObject } = await import('firebase/storage');

      await deleteImages([
        { storagePath: 'path/1.jpg' },
        { storagePath: 'path/2.jpg' },
        { storagePath: 'path/3.jpg' },
      ]);

      expect(deleteObject).toHaveBeenCalledTimes(3);
    });

    it('continues deleting even if one fails', async () => {
      const { deleteObject } = await import('firebase/storage');
      (deleteObject as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce({ code: 'storage/unauthorized' })
        .mockResolvedValueOnce(undefined);

      // Should not throw - uses Promise.allSettled
      await expect(
        deleteImages([
          { storagePath: 'path/1.jpg' },
          { storagePath: 'path/2.jpg' },
          { storagePath: 'path/3.jpg' },
        ])
      ).resolves.toBeUndefined();

      expect(deleteObject).toHaveBeenCalledTimes(3);
    });
  });
});
