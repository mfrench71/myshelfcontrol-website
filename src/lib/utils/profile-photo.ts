/**
 * Profile Photo Upload Utilities
 * Firebase Storage upload and compression for profile photos
 */

import { storage, db } from '@/lib/firebase/client';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/** Profile data stored in Firestore */
export type ProfileData = {
  photoUrl?: string | null;
  photoStoragePath?: string | null;
  updatedAt?: number;
};

// Configuration
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB for profile photos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 256; // Profile photos are small
const QUALITY = 0.85;

/**
 * Get user profile data from Firestore
 */
export async function getProfileData(userId: string): Promise<ProfileData | null> {
  try {
    const profileRef = doc(db, 'users', userId, 'settings', 'profile');
    const snapshot = await getDoc(profileRef);
    return snapshot.exists() ? (snapshot.data() as ProfileData) : null;
  } catch (err) {
    console.error('Failed to get profile data:', err);
    return null;
  }
}

/**
 * Save profile data to Firestore
 */
export async function saveProfileData(userId: string, data: ProfileData): Promise<void> {
  const profileRef = doc(db, 'users', userId, 'settings', 'profile');
  const existingDoc = await getDoc(profileRef);

  if (existingDoc.exists()) {
    await updateDoc(profileRef, {
      ...data,
      updatedAt: Date.now(),
    });
  } else {
    await setDoc(profileRef, {
      ...data,
      updatedAt: Date.now(),
    });
  }
}

/**
 * Validate profile photo file
 */
export function validateProfilePhoto(file: File | null | undefined): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please use JPG, PNG, or WebP.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File too large (${sizeMB}MB). Maximum size is 2MB.` };
  }

  return { valid: true };
}

/**
 * Check WebP support
 */
function checkWebPSupport(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Compress and resize profile photo
 */
export async function compressProfilePhoto(file: File): Promise<{ blob: Blob; extension: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions (square crop)
      let { naturalWidth: width, naturalHeight: height } = img;

      // Determine crop dimensions (center square)
      const size = Math.min(width, height);
      const sx = (width - size) / 2;
      const sy = (height - size) / 2;

      // Scale down if needed
      const outputSize = Math.min(size, MAX_WIDTH);

      // Create canvas and draw cropped/resized image
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw center-cropped square
      ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize);

      // Use WebP for better compression, fallback to JPEG
      const supportsWebP = checkWebPSupport();
      const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
      const extension = supportsWebP ? 'webp' : 'jpg';

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve({ blob, extension, mimeType });
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Upload profile photo to Firebase Storage
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; storagePath: string }> {
  // Validate
  const validation = validateProfilePhoto(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Get existing profile data to delete old photo
  const existingProfile = await getProfileData(userId);

  // Compress image
  const { blob: compressedBlob, extension, mimeType } = await compressProfilePhoto(file);

  // Generate storage path
  const storagePath = `users/${userId}/profile/photo.${extension}`;
  const storageRef = ref(storage, storagePath);

  // Upload with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
      contentType: mimeType,
    });

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(progress);
      },
      error => {
        console.error('Upload error:', error);
        reject(new Error('Failed to upload photo. Please try again.'));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          // Delete old photo if exists and different path
          if (existingProfile?.photoStoragePath && existingProfile.photoStoragePath !== storagePath) {
            try {
              const oldRef = ref(storage, existingProfile.photoStoragePath);
              await deleteObject(oldRef);
            } catch {
              // Ignore errors deleting old photo
            }
          }

          // Save to profile data
          await saveProfileData(userId, {
            photoUrl: url,
            photoStoragePath: storagePath,
          });

          resolve({ url, storagePath });
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(new Error('Failed to get photo URL. Please try again.'));
        }
      }
    );
  });
}

/**
 * Remove profile photo
 */
export async function removeProfilePhoto(userId: string): Promise<void> {
  const profile = await getProfileData(userId);

  if (profile?.photoStoragePath) {
    try {
      const storageRef = ref(storage, profile.photoStoragePath);
      await deleteObject(storageRef);
    } catch {
      // Ignore errors if file doesn't exist
    }
  }

  // Update profile data
  await saveProfileData(userId, {
    photoUrl: null,
    photoStoragePath: null,
  });
}
