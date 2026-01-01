/**
 * Unit Tests for lib/hooks/use-auth.ts
 * Tests for Firebase authentication state hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../use-auth';

// Mock Firebase auth
const mockUnsubscribe = vi.fn();
let authStateCallback: ((user: unknown) => void) | null = null;
let authErrorCallback: ((error: Error) => void) | null = null;

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, onSuccess, onError) => {
    authStateCallback = onSuccess;
    authErrorCallback = onError;
    return mockUnsubscribe;
  }),
}));

vi.mock('@/lib/firebase/client', () => ({
  auth: { name: 'mock-auth' },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
    authErrorCallback = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns loading true initially', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('authenticated user', () => {
    it('sets user when auth state changes', () => {
      const { result } = renderHook(() => useAuth());

      const mockUser = { uid: 'user-123', email: 'test@example.com' };

      act(() => {
        authStateCallback?.(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('unauthenticated user', () => {
    it('sets user to null when signed out', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.(null);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('auth error', () => {
    it('sets error when auth fails', () => {
      const { result } = renderHook(() => useAuth());

      const mockError = new Error('Auth failed');

      act(() => {
        authErrorCallback?.(mockError);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('cleanup', () => {
    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() => useAuth());

      expect(mockUnsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
