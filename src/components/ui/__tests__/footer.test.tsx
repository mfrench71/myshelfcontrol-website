/**
 * Unit Tests for components/ui/footer.tsx
 * Tests for Footer component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

// Mock auth context
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
};
vi.mock('@/components/providers/auth-provider', () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

describe('Footer', () => {
  let originalDate: typeof Date;

  beforeEach(() => {
    // Mock Date to return a fixed year
    originalDate = global.Date;
    const mockDate = class extends Date {
      constructor() {
        super();
        return new originalDate('2026-01-01');
      }
      getFullYear() {
        return 2026;
      }
    } as typeof Date;
    global.Date = mockDate;

    // Mock environment variable (UK date format: DD.MM.YYYY)
    vi.stubEnv('NEXT_PUBLIC_BUILD_VERSION', '02.01.2025');
  });

  afterEach(() => {
    global.Date = originalDate;
    vi.unstubAllEnvs();
  });

  describe('rendering', () => {
    it('renders copyright with current year', () => {
      render(<Footer />);

      expect(screen.getByText(/© 2026 Book Republic/)).toBeInTheDocument();
    });

    it('renders privacy policy link', () => {
      render(<Footer />);

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('renders build version from environment for authenticated users', () => {
      render(<Footer />);

      expect(screen.getByText('v02.01.2025')).toBeInTheDocument();
    });

    it('shows dev when version not set', () => {
      vi.stubEnv('NEXT_PUBLIC_BUILD_VERSION', '');
      render(<Footer />);

      expect(screen.getByText('vdev')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has footer element', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });
  });
});
