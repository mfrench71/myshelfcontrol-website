/**
 * Unit Tests for components/providers/auth-provider.tsx
 * Tests for AuthProvider and useAuthContext hook
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../auth-provider';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
    });
  });

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <AuthProvider>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });
});

describe('useAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth state when used within AuthProvider', () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('returns loading state correctly', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('returns error state correctly', () => {
    const mockError = new Error('Auth error');
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: mockError,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.error).toEqual(mockError);
  });

  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuthContext());
    }).toThrow('useAuthContext must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
