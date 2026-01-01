/**
 * Unit Tests for components/ui/footer.tsx
 * Tests for Footer component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

// Mock the APP_VERSION constant
vi.mock('@/lib/constants', () => ({
  APP_VERSION: '1.2.3',
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
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('rendering', () => {
    it('renders copyright with current year', () => {
      render(<Footer />);

      expect(screen.getByText(/© 2026 MyShelfControl/)).toBeInTheDocument();
    });

    it('renders privacy policy link', () => {
      render(<Footer />);

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('renders app version', () => {
      render(<Footer />);

      expect(screen.getByText('v1.2.3')).toBeInTheDocument();
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
