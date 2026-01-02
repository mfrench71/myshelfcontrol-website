/**
 * Profile Settings Page
 * Manage account details, password, and privacy settings
 */
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Key,
  FileText,
  Download,
  Trash2,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  MailCheck,
  MailWarning,
  Send,
  Loader2,
  Camera,
  Upload,
} from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { BottomSheet } from '@/components/ui/modal';
import { checkPasswordStrength, getGravatarUrl } from '@/lib/utils';
import {
  getProfileData,
  uploadProfilePhoto,
  removeProfilePhoto,
  type ProfileData,
} from '@/lib/utils/profile-photo';

/**
 * Delete all user data from Firestore
 */
async function deleteUserData(userId: string): Promise<void> {
  // This would be implemented with a server-side function
  // For now, we'll just log it
  console.log('Deleting user data for:', userId);
}

/**
 * Delete session cookie
 */
async function deleteSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    return response.ok;
  } catch {
    console.error('Failed to delete session');
    return false;
  }
}

/**
 * Password change modal
 */
function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!newPassword) return null;
    return checkPasswordStrength(newPassword);
  }, [newPassword]);

  // Clear form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Strength bar colours and labels
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthTextColors = ['text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      const errorCode = (err as { code?: string }).code;
      if (errorCode === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (errorCode === 'auth/weak-password') {
        setError('New password is too weak');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      className="md:max-w-xl"
    >
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h3>

        {success ? (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400 py-4">
            <CheckCircle className="w-6 h-6" />
            <span>Password changed successfully!</span>
          </div>
        ) : (
          <form id="password-form" onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="current-password" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="current-password"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="new-password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full ${
                          index < passwordStrength.score
                            ? strengthColors[Math.min(passwordStrength.score - 1, 3)]
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.score > 0 && (
                    <p className={`text-xs ${strengthTextColors[Math.min(passwordStrength.score - 1, 3)]}`}>
                      {strengthLabels[Math.min(passwordStrength.score - 1, 3)]}
                    </p>
                  )}
                </div>
              )}
              {/* Password Requirements */}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className={passwordStrength?.checks.length ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                  8+ chars
                </span>
                <span className={passwordStrength?.checks.uppercase ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                  1 uppercase
                </span>
                <span className={passwordStrength?.checks.number ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                  1 number
                </span>
              </div>
              {/* Same password validation */}
              {newPassword && currentPassword && newPassword === currentPassword && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">New password must be different from current password</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              {/* Inline validation feedback */}
              {confirmPassword && newPassword && confirmPassword !== newPassword && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8 ||
                  newPassword === currentPassword
                }
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark min-h-[44px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * Photo upload modal
 */
function PhotoModal({
  isOpen,
  onClose,
  userId,
  currentPhotoUrl,
  gravatarUrl,
  onPhotoChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentPhotoUrl: string | null;
  gravatarUrl: string | null;
  onPhotoChange: (url: string | null) => void;
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadProfilePhoto(file, userId, (progress) => {
        setUploadProgress(progress);
      });
      onPhotoChange(result.url);
      showToast('Photo uploaded', { type: 'success' });
      onClose();
    } catch (err) {
      console.error('Failed to upload photo:', err);
      showToast('Failed to upload photo', { type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeProfilePhoto(userId);
      onPhotoChange(null);
      showToast('Photo removed', { type: 'success' });
      onClose();
    } catch (err) {
      console.error('Failed to remove photo:', err);
      showToast('Failed to remove photo', { type: 'error' });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Photo"
      closeOnBackdrop={!uploading && !removing}
      closeOnEscape={!uploading && !removing}
      className="md:max-w-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Photo</h3>

        {/* Current photo preview */}
        {(currentPhotoUrl || gravatarUrl) && (
          <div className="flex justify-center mb-4">
            <Image
              src={currentPhotoUrl || gravatarUrl!}
              alt="Current profile photo"
              width={128}
              height={128}
              className="w-32 h-32 rounded-full object-cover"
            />
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" aria-hidden="true" />
                <span>Upload Photo</span>
              </>
            )}
          </button>

          {/* Remove button (if photo exists) */}
          {currentPhotoUrl && (
            <button
              onClick={handleRemove}
              disabled={uploading || removing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
            >
              {removing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" aria-hidden="true" />
                  <span>Remove Photo</span>
                </>
              )}
            </button>
          )}

          {/* Cancel button */}
          <button
            onClick={onClose}
            disabled={uploading || removing}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          JPG, PNG or WebP. Max 2MB. Photos are cropped to a square.
        </p>

        {/* Gravatar fallback note */}
        {!currentPhotoUrl && gravatarUrl && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            Using your Gravatar as fallback. Upload a photo to override.
          </p>
        )}
        {!currentPhotoUrl && !gravatarUrl && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            No photo set. You can also use{' '}
            <a
              href="https://gravatar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-blue-400 hover:underline"
            >
              Gravatar
            </a>{' '}
            as a fallback.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * Delete account modal
 */
function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  loading: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Clear form state when modal opens (legitimate modal initialization pattern)
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate confirm text
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      await onConfirm(password);
    } catch {
      setError('Failed to delete account. Please check your password.');
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    setError(null);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Account"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          This action is permanent and cannot be undone. All your books, genres, series, and settings will be deleted.
        </p>

        <form id="delete-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="delete-password" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="delete-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="delete-confirm-text" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Type &quot;DELETE&quot; to confirm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="delete-confirm-text"
              name="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password || confirmText !== 'DELETE'}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);

  // Lock body scroll when any modal is open
  useBodyScrollLock(showPasswordModal || showDeleteModal || showPhotoModal);

  // Load profile data
  useEffect(() => {
    if (!user) return;

    getProfileData(user.uid).then(setProfileData).catch(console.error);
  }, [user]);

  // Check for Gravatar
  useEffect(() => {
    if (!user?.email || profileData?.photoUrl) {
      setGravatarUrl(null);
      return;
    }

    const email = user.email.toLowerCase().trim();
    const url = getGravatarUrl(email, 160);
    const img = new window.Image();

    img.onload = () => setGravatarUrl(url);
    img.onerror = () => setGravatarUrl(null);
    img.src = url;
  }, [user?.email, profileData?.photoUrl]);

  // Handle photo change
  const handlePhotoChange = useCallback((url: string | null) => {
    setProfileData((prev) => ({ ...prev, photoUrl: url }));
  }, []);

  /**
   * Resend email verification
   */
  const handleResendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSendingVerification(true);
    try {
      await sendEmailVerification(currentUser);
      setVerificationSent(true);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;

    setDeleting(true);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Delete user data first
      await deleteUserData(currentUser.uid);

      // Delete the user account
      await deleteUser(currentUser);

      // Delete session
      await deleteSession();

      // Redirect to login
      router.push('/login');
    } catch (err) {
      setDeleting(false);
      throw err;
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="profile-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Profile</h1>

        {/* Mobile Section Navigation (Pills) */}
        <nav className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar" aria-label="Jump to section">
          <div className="flex gap-2">
            <a
              href="#email-verification"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Email
            </a>
            <a
              href="#password"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Password
            </a>
            <a
              href="#privacy"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Privacy
            </a>
            <a
              href="#delete-account"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Delete
            </a>
          </div>
        </nav>

        {/* User Info */}
        {user && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Avatar with edit button */}
              <div className="relative">
                {profileData?.photoUrl ? (
                  <Image
                    src={profileData.photoUrl}
                    alt="Profile photo"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : gravatarUrl ? (
                  <Image
                    src={gravatarUrl}
                    alt="Profile photo"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                  aria-label="Edit profile photo"
                >
                  <Camera className="w-4 h-4 text-gray-600" aria-hidden="true" />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px] sm:max-w-full">{user.email}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Member since{' '}
                  <span>
                    {user.metadata.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Unknown'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email Verification Status */}
          {user && (
            <section id="email-verification" className="scroll-mt-36 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {user.emailVerified ? (
                    <MailCheck className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <MailWarning className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Email Verification</h3>
                    <p className={`text-sm mt-0.5 ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                      {user.emailVerified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                </div>
                {!user.emailVerified && (
                  <button
                    onClick={handleResendVerification}
                    disabled={sendingVerification || verificationSent}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingVerification ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Sending...</span>
                      </>
                    ) : verificationSent ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
                        <span>Sent!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>Resend</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Change Password */}
          <section id="password" className="scroll-mt-36 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Password</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update your account password</p>
              </div>
              <button
                id="change-password-btn"
                onClick={() => setShowPasswordModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors min-h-[44px] whitespace-nowrap"
              >
                <Key className="w-4 h-4" aria-hidden="true" />
                <span>Change</span>
              </button>
            </div>
          </section>

          {/* Privacy & Data */}
          <section id="privacy" className="scroll-mt-36 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Privacy & Data</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your data and privacy preferences</p>
            </div>

            <Link
              href="/privacy"
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Privacy Policy</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Learn how your data is collected and used</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Link>

            <Link
              href="/settings/library#backup"
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Export My Data</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Download all your books, genres, and settings</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Link>
          </section>

          {/* Delete Account */}
          <section id="delete-account" className="scroll-mt-36 bg-red-50 dark:bg-red-950 rounded-xl border border-red-200 dark:border-red-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-red-900 dark:text-red-200">Delete Account</h3>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">Permanently delete your account and all data</p>
              </div>
              <button
                id="delete-account-btn"
                onClick={() => setShowDeleteModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
      />

      {user && (
        <PhotoModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          userId={user.uid}
          currentPhotoUrl={profileData?.photoUrl || null}
          gravatarUrl={gravatarUrl}
          onPhotoChange={handlePhotoChange}
        />
      )}
    </>
  );
}
