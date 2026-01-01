/**
 * Unit Tests for lib/utils/auth-errors.ts
 * Tests for Firebase auth error message mapping
 */
import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage } from '../auth-errors';

describe('getAuthErrorMessage', () => {
  describe('sign in errors', () => {
    it('returns message for invalid-email', () => {
      expect(getAuthErrorMessage('auth/invalid-email')).toBe(
        'Please enter a valid email address.'
      );
    });

    it('returns message for user-disabled', () => {
      expect(getAuthErrorMessage('auth/user-disabled')).toBe(
        'This account has been disabled. Please contact support.'
      );
    });

    it('returns message for user-not-found', () => {
      expect(getAuthErrorMessage('auth/user-not-found')).toBe(
        'No account found with this email. Please sign up.'
      );
    });

    it('returns message for wrong-password', () => {
      expect(getAuthErrorMessage('auth/wrong-password')).toBe(
        'Incorrect password. Please try again.'
      );
    });

    it('returns message for invalid-credential', () => {
      expect(getAuthErrorMessage('auth/invalid-credential')).toBe(
        'Invalid email or password. Please try again.'
      );
    });

    it('returns message for too-many-requests', () => {
      expect(getAuthErrorMessage('auth/too-many-requests')).toBe(
        'Too many failed attempts. Please try again later.'
      );
    });
  });

  describe('sign up errors', () => {
    it('returns message for email-already-in-use', () => {
      expect(getAuthErrorMessage('auth/email-already-in-use')).toBe(
        'An account with this email already exists.'
      );
    });

    it('returns message for weak-password', () => {
      expect(getAuthErrorMessage('auth/weak-password')).toBe(
        'Password is too weak. Use at least 8 characters.'
      );
    });

    it('returns message for operation-not-allowed', () => {
      expect(getAuthErrorMessage('auth/operation-not-allowed')).toBe(
        'Email/password sign up is not enabled.'
      );
    });
  });

  describe('network errors', () => {
    it('returns message for network-request-failed', () => {
      expect(getAuthErrorMessage('auth/network-request-failed')).toBe(
        'Network error. Please check your connection.'
      );
    });
  });

  describe('generic errors', () => {
    it('returns message for internal-error', () => {
      expect(getAuthErrorMessage('auth/internal-error')).toBe(
        'Something went wrong. Please try again.'
      );
    });

    it('returns fallback message for unknown error codes', () => {
      expect(getAuthErrorMessage('auth/unknown-error')).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });

    it('returns fallback message for empty string', () => {
      expect(getAuthErrorMessage('')).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });

    it('returns fallback message for non-auth error codes', () => {
      expect(getAuthErrorMessage('some/random/error')).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });
});
