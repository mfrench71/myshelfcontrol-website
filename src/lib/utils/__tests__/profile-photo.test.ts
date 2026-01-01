/**
 * Unit Tests for lib/utils/profile-photo.ts
 * Tests for profile photo validation and upload utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateProfilePhoto,
  getProfileData,
  saveProfileData,
  compressProfilePhoto,
  uploadProfilePhoto,
  removeProfilePhoto,
} from '../profile-photo';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'profile' })),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ photoUrl: 'https://example.com/photo.jpg', photoStoragePath: 'users/123/profile/photo.jpg' }),
    })
  ),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({ fullPath: 'mock/path' })),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((event, onProgress, onError, onComplete) => {
      setTimeout(() => {
        onProgress({ bytesTransferred: 50, totalBytes: 100 });
        onComplete();
      }, 0);
    }),
    snapshot: { ref: { fullPath: 'mock/path' } },
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/new-photo.jpg')),
  deleteObject: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  storage: {},
}));

// Mock Image
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  naturalWidth = 400;
  naturalHeight = 400;

  constructor() {
    setTimeout(() => this.onload?.(), 0);
  }
}

describe('profile-photo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.Image = MockImage as unknown as typeof Image;
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('validateProfilePhoto', () => {
    it('rejects null file', () => {
      const result = validateProfilePhoto(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('rejects undefined file', () => {
      const result = validateProfilePhoto(undefined);
      expect(result.valid).toBe(false);
    });

    it('accepts valid JPEG file', () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      const result = validateProfilePhoto(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid PNG file', () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      const result = validateProfilePhoto(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid WebP file', () => {
      const file = new File(['test'], 'photo.webp', { type: 'image/webp' });
      const result = validateProfilePhoto(file);
      expect(result.valid).toBe(true);
    });

    it('rejects GIF file (not allowed for profile)', () => {
      const file = new File(['test'], 'photo.gif', { type: 'image/gif' });
      const result = validateProfilePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('rejects file over 2MB', () => {
      const largeContent = new Array(3 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validateProfilePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
      expect(result.error).toContain('2MB');
    });

    it('accepts file exactly 2MB', () => {
      const content = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'exact.jpg', { type: 'image/jpeg' });
      const result = validateProfilePhoto(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('getProfileData', () => {
    it('returns profile data when exists', async () => {
      const result = await getProfileData('user-123');

      expect(result).not.toBe(null);
      expect(result?.photoUrl).toBe('https://example.com/photo.jpg');
    });

    it('returns null when profile does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      });

      const result = await getProfileData('user-123');

      expect(result).toBe(null);
    });

    it('returns null on error', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Firestore error'));

      const result = await getProfileData('user-123');

      expect(result).toBe(null);
    });
  });

  describe('saveProfileData', () => {
    it('updates existing profile', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await saveProfileData('user-123', { photoUrl: 'https://new.com/photo.jpg' });

      expect(updateDoc).toHaveBeenCalled();
    });

    it('creates new profile if not exists', async () => {
      const { getDoc, setDoc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => false,
      });

      await saveProfileData('user-123', { photoUrl: 'https://new.com/photo.jpg' });

      expect(setDoc).toHaveBeenCalled();
    });

    it('includes updatedAt timestamp', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await saveProfileData('user-123', { photoUrl: 'test' });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ updatedAt: expect.any(Number) })
      );
    });
  });

  describe('compressProfilePhoto', () => {
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

    it('compresses image', async () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await compressProfilePhoto(file);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toMatch(/image\/(webp|jpeg)/);
    });

    it('creates square output', async () => {
      // Non-square image
      class WideImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';
        naturalWidth = 800;
        naturalHeight = 400;

        constructor() {
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = WideImage as unknown as typeof Image;

      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      await compressProfilePhoto(file);

      // Canvas should be square
      expect(mockCanvas.width).toBe(mockCanvas.height);
    });

    it('limits output to 256px', async () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      await compressProfilePhoto(file);

      expect(mockCanvas.width).toBeLessThanOrEqual(256);
      expect(mockCanvas.height).toBeLessThanOrEqual(256);
    });

    it('handles canvas context error', async () => {
      mockCanvas.getContext = vi.fn(() => null);

      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(compressProfilePhoto(file)).rejects.toThrow('Failed to get canvas context');
    });
  });

  describe('removeProfilePhoto', () => {
    it('deletes photo from storage', async () => {
      const { deleteObject } = await import('firebase/storage');

      await removeProfilePhoto('user-123');

      expect(deleteObject).toHaveBeenCalled();
    });

    it('updates profile data to null', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await removeProfilePhoto('user-123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          photoUrl: null,
          photoStoragePath: null,
        })
      );
    });

    it('handles missing photo gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ photoUrl: null, photoStoragePath: null }),
      });

      // Should not throw
      await expect(removeProfilePhoto('user-123')).resolves.toBeUndefined();
    });
  });
});
