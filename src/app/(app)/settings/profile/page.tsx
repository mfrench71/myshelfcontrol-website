/**
 * Profile Settings Page
 * Manage account details, password, and privacy settings
 */
'use client';

import { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthContext } from '@/components/providers/auth-provider';
import { checkPasswordStrength } from '@/lib/utils';

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
  const prevIsOpen = useRef(isOpen);
  if (isOpen && !prevIsOpen.current) {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  }
  prevIsOpen.current = isOpen;

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Change password"
    >
      <div
        className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:rounded-xl rounded-t-2xl p-6 md:max-w-md md:w-full animate-slide-up md:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <h3 className="text-lg font-semibold mb-4">Change Password</h3>

        {success ? (
          <div className="flex items-center gap-3 text-green-600 py-4">
            <CheckCircle className="w-6 h-6" />
            <span>Password changed successfully!</span>
          </div>
        ) : (
          <form id="password-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="current-password" className="block font-semibold text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="current-password"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block font-semibold text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                            : 'bg-gray-200'
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
                <span className={passwordStrength?.checks.length ? 'text-green-500' : 'text-gray-500'}>
                  8+ chars
                </span>
                <span className={passwordStrength?.checks.uppercase ? 'text-green-500' : 'text-gray-500'}>
                  1 uppercase
                </span>
                <span className={passwordStrength?.checks.number ? 'text-green-500' : 'text-gray-500'}>
                  1 number
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block font-semibold text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark min-h-[44px] disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
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

  // Clear form state when modal opens
  const prevIsOpen = useRef(isOpen);
  if (isOpen && !prevIsOpen.current) {
    setPassword('');
    setConfirmText('');
    setError(null);
  }
  prevIsOpen.current = isOpen;

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
    } catch (err) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Delete account confirmation"
    >
      <div
        className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:rounded-xl rounded-t-2xl p-6 md:max-w-md md:w-full animate-slide-up md:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Account</h3>
        <p className="text-gray-500 mb-4">
          This action is permanent and cannot be undone. All your books, genres, series, and settings will be deleted.
        </p>

        <form id="delete-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="delete-password" className="block font-semibold text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="delete-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="delete-confirm-text" className="block font-semibold text-gray-700 mb-1">
              Type &quot;DELETE&quot; to confirm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="delete-confirm-text"
              name="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password || confirmText !== 'DELETE'}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px] disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      <>
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                  Settings
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Profile</li>
            </ol>
          </nav>
        </div>
      </div>

      <div id="profile-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div
                id="profile-avatar"
                className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold"
              >
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <div>
                <p id="profile-email" className="text-gray-900 font-medium">{user.email}</p>
                <p className="text-gray-500 text-sm">
                  Member since{' '}
                  <span id="profile-created">
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
          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900">Change Password</h3>
                <p className="text-gray-500 text-sm mt-1">Update your account password</p>
              </div>
              <button
                id="change-password-btn"
                onClick={() => setShowPasswordModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <Key className="w-4 h-4" aria-hidden="true" />
                <span>Change</span>
              </button>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Privacy & Data</h3>
              <p className="text-gray-500 text-sm mt-1">Manage your data and privacy preferences</p>
            </div>

            <Link
              href="/privacy"
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-900">Privacy Policy</p>
                  <p className="text-gray-500 text-sm">Learn how your data is collected and used</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Link>

            <Link
              href="/settings/library"
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-900">Export My Data</p>
                  <p className="text-gray-500 text-sm">Download all your books, genres, and settings</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Link>
          </div>

          {/* Delete Account */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="text-red-700 text-sm mt-1">Permanently delete your account and all data</p>
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
          </div>
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
    </>
  );
}
