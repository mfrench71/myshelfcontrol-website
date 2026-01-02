/**
 * ImageGallery Component
 * Upload, display, reorder, and manage book images
 */
'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import Image from 'next/image';
import { X, ImagePlus, ImageOff, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage, validateImage } from '@/lib/utils/image-upload';

/** Image data structure */
export interface GalleryImage {
  id: string;
  url: string;
  storagePath: string;
  isPrimary: boolean;
  uploadedAt: number;
  sizeBytes?: number;
  width?: number;
  height?: number;
  caption?: string;
}

interface ImageGalleryProps {
  userId: string;
  bookId: string | null;
  images: GalleryImage[];
  maxImages?: number;
  onChange: (images: GalleryImage[]) => void;
  onPrimaryChange?: (url: string | null, userInitiated?: boolean) => void;
}

/**
 * Get primary image from array
 */
function getPrimaryImage(images: GalleryImage[]): GalleryImage | null {
  const primary = images.find(img => img.isPrimary);
  return primary || (images.length > 0 ? images[0] : null);
}

/**
 * Set primary image in array
 */
function setPrimaryImage(images: GalleryImage[], imageId: string): GalleryImage[] {
  return images.map(img => ({
    ...img,
    isPrimary: img.id === imageId,
  }));
}

export function ImageGallery({
  userId,
  bookId,
  images,
  maxImages = 10,
  onChange,
  onPrimaryChange,
}: ImageGalleryProps) {
  const [uploading, setUploading] = useState<Map<string, number>>(new Map());
  const [newlyUploaded, setNewlyUploaded] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Generate a stable temp ID for new books
  const tempId = useId();

  // Effective book ID (use temp ID for new books)
  const effectiveBookId = bookId || `temp-${tempId}`;

  // Calculate remaining slots
  const total = images.length + uploading.size;
  const canAdd = total < maxImages;

  // Initialize image load states for new images (prop synchronization pattern)
  useEffect(() => {
    const newStates: Record<string, 'loading' | 'loaded' | 'error'> = {};
    images.forEach(img => {
      if (!imageLoadStates[img.id]) {
        newStates[img.id] = 'loading';
      } else {
        newStates[img.id] = imageLoadStates[img.id];
      }
    });
    if (Object.keys(newStates).length > 0) {
      setImageLoadStates(prev => ({ ...prev, ...newStates }));
    }
  }, [images]);

  // Handle image load complete
  const handleImageLoad = useCallback((imageId: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'loaded' }));
  }, []);

  // Handle image load error
  const handleImageError = useCallback((imageId: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'error' }));
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const availableSlots = maxImages - images.length - uploading.size;

    if (fileArray.length > availableSlots) {
      alert(`Can only add ${availableSlots} more image${availableSlots !== 1 ? 's' : ''}`);
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const validation = validateImage(file);
      if (!validation.valid) {
        alert(validation.error || 'Invalid image');
        return;
      }
    }

    // Upload each file
    for (const file of fileArray) {
      const tempId = `uploading-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      setUploading(prev => new Map(prev).set(tempId, 0));

      try {
        const result = await uploadImage(file, userId, effectiveBookId, (progress) => {
          setUploading(prev => new Map(prev).set(tempId, progress));
        });

        // Create image object
        const newImage: GalleryImage = {
          id: result.id,
          url: result.url,
          storagePath: result.storagePath,
          isPrimary: false,
          uploadedAt: Date.now(),
          sizeBytes: result.sizeBytes,
          width: result.width,
          height: result.height,
        };

        // Add to images
        const newImages = [...images, newImage];
        onChange(newImages);

        // Track for cleanup
        setNewlyUploaded(prev => new Set(prev).add(newImage.id));

        // Notify primary change
        if (onPrimaryChange) {
          const primary = getPrimaryImage(newImages);
          onPrimaryChange(primary?.url || null, false);
        }

        setUploading(prev => {
          const next = new Map(prev);
          next.delete(tempId);
          return next;
        });

        setImageLoadStates(prev => ({ ...prev, [result.id]: 'loading' }));
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image. Please try again.');
        setUploading(prev => {
          const next = new Map(prev);
          next.delete(tempId);
          return next;
        });
      }
    }
  }, [userId, effectiveBookId, images, maxImages, uploading.size, onChange, onPrimaryChange]);

  // Handle delete
  const handleDelete = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const wasPrimary = image.isPrimary;

    // Remove from array
    let newImages = images.filter(img => img.id !== imageId);

    // If deleted image was primary and there are still images, make first one primary
    if (wasPrimary && newImages.length > 0) {
      newImages = [{ ...newImages[0], isPrimary: true }, ...newImages.slice(1)];
    }

    onChange(newImages);
    setNewlyUploaded(prev => {
      const next = new Set(prev);
      next.delete(imageId);
      return next;
    });
    setConfirmDelete(null);

    // Notify primary change
    if (onPrimaryChange) {
      const primary = getPrimaryImage(newImages);
      onPrimaryChange(primary?.url || null, false);
    }

    // Try to delete from storage (best effort)
    try {
      await deleteImage(image.storagePath);
    } catch (error) {
      console.warn('Storage delete failed:', error);
    }
  }, [images, onChange, onPrimaryChange]);

  // Handle set primary
  const handleSetPrimary = useCallback((imageId: string) => {
    const newImages = setPrimaryImage(images, imageId);
    onChange(newImages);

    if (onPrimaryChange) {
      const primary = getPrimaryImage(newImages);
      onPrimaryChange(primary?.url || null, true);
    }
  }, [images, onChange, onPrimaryChange]);

  // Handle drag start
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder images
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onChange(newImages);
  }, [draggedIndex, images, onChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Cleanup unsaved uploads (call on cancel)
  const cleanupUnsavedUploads = useCallback(async () => {
    if (newlyUploaded.size === 0) return 0;

    const imagesToDelete = images.filter(img => newlyUploaded.has(img.id));
    let deletedCount = 0;

    for (const image of imagesToDelete) {
      try {
        await deleteImage(image.storagePath);
        deletedCount++;
      } catch (error) {
        console.error('Failed to cleanup image:', image.storagePath, error);
      }
    }

    setNewlyUploaded(new Set());
    onChange(images.filter(img => !newlyUploaded.has(img.id)));

    return deletedCount;
  }, [images, newlyUploaded, onChange]);

  // Mark as saved (call after successful save)
  const markAsSaved = useCallback(() => {
    setNewlyUploaded(new Set());
  }, []);

  // Expose cleanup methods via ref
  useEffect(() => {
    // Store cleanup function on window for access from parent
    (window as unknown as { __imageGalleryCleanup?: () => Promise<number> }).__imageGalleryCleanup = cleanupUnsavedUploads;
    (window as unknown as { __imageGalleryMarkSaved?: () => void }).__imageGalleryMarkSaved = markAsSaved;

    return () => {
      delete (window as unknown as { __imageGalleryCleanup?: () => Promise<number> }).__imageGalleryCleanup;
      delete (window as unknown as { __imageGalleryMarkSaved?: () => void }).__imageGalleryMarkSaved;
    };
  }, [cleanupUnsavedUploads, markAsSaved]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-gray-700">
          Book Images{' '}
          <span className="font-normal text-gray-500">
            ({images.length}/{maxImages})
          </span>
        </label>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {/* Existing Images */}
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable={images.length > 1}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(index, e)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square bg-gray-100 rounded-lg border-2 ${
              img.isPrimary ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
            } ${draggedIndex === index ? 'opacity-50' : ''}`}
          >
            {/* Loading skeleton */}
            {imageLoadStates[img.id] === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" aria-hidden="true" />
              </div>
            )}

            {/* Error state */}
            {imageLoadStates[img.id] === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <ImageOff className="w-8 h-8 text-gray-400" aria-hidden="true" />
              </div>
            )}

            {/* Image */}
            <Image
              src={img.url}
              alt={`Book image ${index + 1}`}
              fill
              className={`object-cover rounded-lg ${
                imageLoadStates[img.id] === 'loaded' ? '' : 'opacity-0'
              }`}
              onLoad={() => handleImageLoad(img.id)}
              onError={() => handleImageError(img.id)}
              unoptimized
            />

            {/* Primary badge */}
            {img.isPrimary && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded font-medium z-10">
                Cover
              </div>
            )}

            {/* Delete button */}
            <button
              type="button"
              onClick={() => setConfirmDelete(img.id)}
              className="absolute p-2 bg-white hover:bg-red-50 rounded-full shadow-md transition-colors z-20"
              style={{ top: '-8px', right: '-8px' }}
              aria-label="Delete image"
            >
              <X className="w-4 h-4 text-gray-600" aria-hidden="true" />
            </button>

            {/* Set as cover overlay */}
            {!img.isPrimary && (
              <button
                type="button"
                onClick={() => handleSetPrimary(img.id)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 cursor-pointer rounded-lg"
                aria-label="Set as cover"
              >
                <span className="text-white text-xs font-medium text-center px-2">
                  Set as cover
                </span>
              </button>
            )}
          </div>
        ))}

        {/* Uploading tiles */}
        {Array.from(uploading.entries()).map(([id, progress]) => (
          <div
            key={id}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden="true" />
              <span className="mt-2 text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <label className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center">
            <ImagePlus className="w-8 h-8 text-gray-400" aria-hidden="true" />
            <span className="mt-1 text-xs text-gray-500">Add image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </label>
        )}
      </div>

      {/* Help text */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500">
          {images.length > 1 ? 'Drag to reorder. ' : ''}Tap to set as cover image.
        </p>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Image</h3>
            <p className="text-gray-600 mb-4">
              {images.find(img => img.id === confirmDelete)?.isPrimary
                ? 'This is your cover image. Delete it anyway?'
                : 'Are you sure you want to delete this image?'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
