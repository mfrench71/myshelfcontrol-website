/**
 * Unit Tests for components/ui/header.tsx
 * Tests for Header component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../header';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

// Mock firebase client
vi.mock('@/lib/firebase/client', () => ({
  auth: {},
}));

// Mock auth context
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  photoURL: null,
};
vi.mock('@/components/providers/auth-provider', () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  getGravatarUrl: () => 'https://gravatar.com/avatar/test',
}));

// Mock wishlist repository
vi.mock('@/lib/repositories/wishlist', () => ({
  getWishlist: vi.fn().mockResolvedValue([]),
}));

// Mock SearchOverlay
vi.mock('@/components/ui/search-overlay', () => ({
  SearchOverlay: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="search-overlay">
        <button onClick={onClose}>Close Search</button>
      </div>
    ) : null,
}));

// Mock BottomSheet
vi.mock('@/components/ui/modal', () => ({
  BottomSheet: ({
    isOpen,
    onClose,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="bottom-sheet">
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('rendering', () => {
    it('renders logo with link to dashboard', () => {
      render(<Header />);

      const logo = screen.getByText('Book Republic');
      expect(logo).toBeInTheDocument();
      expect(logo.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('renders My Library button', () => {
      render(<Header />);

      expect(screen.getByLabelText('View My Library')).toBeInTheDocument();
    });

    it('renders search button', () => {
      render(<Header />);

      expect(screen.getByLabelText('Search books')).toBeInTheDocument();
    });

    it('renders menu button', () => {
      render(<Header />);

      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('shows user initial when no photo', () => {
      render(<Header />);

      // Open menu to see avatar
      fireEvent.click(screen.getByLabelText('Open menu'));

      // Should show 'T' for test@example.com (may appear multiple times for mobile/desktop)
      expect(screen.getAllByText('T').length).toBeGreaterThan(0);
    });
  });

  describe('search functionality', () => {
    it('opens search overlay when search button is clicked', () => {
      render(<Header />);

      expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Search books'));

      expect(screen.getByTestId('search-overlay')).toBeInTheDocument();
    });

    it('closes search overlay when close is clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Search books'));
      expect(screen.getByTestId('search-overlay')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close Search'));
      expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument();
    });
  });

  describe('menu functionality', () => {
    it('opens menu when menu button is clicked', () => {
      render(<Header />);

      expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Open menu'));

      expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
    });

    it('shows user email in menu', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Open menu'));

      // May appear multiple times for mobile/desktop
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
    });

    it('shows wishlist link in menu', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Open menu'));

      // May appear multiple times for mobile/desktop
      expect(screen.getAllByText('Wishlist').length).toBeGreaterThan(0);
    });

    it('shows settings link in menu', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Open menu'));

      // May appear multiple times for mobile/desktop
      expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    });

    it('shows sign out button in menu', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Open menu'));

      // May appear multiple times for mobile/desktop
      expect(screen.getAllByText('Sign Out').length).toBeGreaterThan(0);
    });

    it('navigates to wishlist when wishlist is clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Open menu'));
      // Click the first Wishlist button (mobile)
      fireEvent.click(screen.getAllByText('Wishlist')[0]);

      expect(mockPush).toHaveBeenCalledWith('/wishlist');
    });

    it('navigates to settings when settings is clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText('Open menu'));
      // Click the first Settings button (mobile)
      fireEvent.click(screen.getAllByText('Settings')[0]);

      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  describe('offline indicator', () => {
    it('does not show offline banner when online', () => {
      render(<Header />);

      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    });

    it('shows offline banner when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(<Header />);

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });
  });
});
