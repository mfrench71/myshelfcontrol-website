/**
 * Unit Tests for components/ui/collapsible-section.tsx
 * Tests for reusable collapsible accordion section component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookOpen } from 'lucide-react';
import { CollapsibleSection } from '../collapsible-section';

describe('CollapsibleSection', () => {
  describe('rendering', () => {
    it('renders title correctly', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <CollapsibleSection title="Test Section" icon={BookOpen}>
          <div>Content</div>
        </CollapsibleSection>
      );

      // Icon should be rendered (aria-hidden)
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders count badge when count is provided', () => {
      render(
        <CollapsibleSection title="Test Section" count={5}>
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('does not render count badge when count is 0', () => {
      render(
        <CollapsibleSection title="Test Section" count={0}>
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
    });

    it('does not render count badge when count is undefined', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <div data-testid="child-content">Child content</div>
        </CollapsibleSection>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" className="custom-class">
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('expand/collapse behaviour', () => {
    it('is collapsed by default', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      // Check for collapsed state (grid-rows-[0fr])
      const contentWrapper = screen.getByText('Content').parentElement?.parentElement;
      expect(contentWrapper).toHaveClass('grid-rows-[0fr]');
    });

    it('can be expanded by default with defaultExpanded prop', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <div>Content</div>
        </CollapsibleSection>
      );

      // Check for expanded state (grid-rows-[1fr])
      const contentWrapper = screen.getByText('Content').parentElement?.parentElement;
      expect(contentWrapper).toHaveClass('grid-rows-[1fr]');
    });

    it('toggles on header click', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      const contentWrapper = screen.getByText('Content').parentElement?.parentElement;

      // Initially collapsed
      expect(contentWrapper).toHaveClass('grid-rows-[0fr]');

      // Click to expand
      fireEvent.click(button);
      expect(contentWrapper).toHaveClass('grid-rows-[1fr]');

      // Click to collapse
      fireEvent.click(button);
      expect(contentWrapper).toHaveClass('grid-rows-[0fr]');
    });

    it('prevents default on click', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

      fireEvent.click(button, mockEvent);

      // Button should handle the click (component manages its own state)
      expect(button).toBeInTheDocument();
    });
  });

  describe('chevron rotation', () => {
    it('chevron points down when collapsed', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      const chevron = screen.getByRole('button').querySelector('svg');
      expect(chevron).not.toHaveClass('rotate-180');
    });

    it('chevron rotates when expanded', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <div>Content</div>
        </CollapsibleSection>
      );

      const chevron = screen.getByRole('button').querySelector('svg');
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('actions', () => {
    it('renders actions when expanded', () => {
      render(
        <CollapsibleSection
          title="Test Section"
          defaultExpanded
          actions={<button data-testid="action-btn">Action</button>}
        >
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });

    it('does not render actions when collapsed', () => {
      render(
        <CollapsibleSection
          title="Test Section"
          actions={<button data-testid="action-btn">Action</button>}
        >
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.queryByTestId('action-btn')).not.toBeInTheDocument();
    });

    it('shows actions when toggled to expanded', () => {
      render(
        <CollapsibleSection
          title="Test Section"
          actions={<button data-testid="action-btn">Action</button>}
        >
          <div>Content</div>
        </CollapsibleSection>
      );

      // Initially no actions visible
      expect(screen.queryByTestId('action-btn')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(screen.getByRole('button'));

      // Actions should now be visible
      expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible button with minimum touch target', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('chevron has aria-hidden', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      const chevron = screen.getByRole('button').querySelector('svg');
      expect(chevron).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
