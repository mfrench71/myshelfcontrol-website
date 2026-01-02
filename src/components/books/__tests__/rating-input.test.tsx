/**
 * Unit Tests for components/books/rating-input.tsx
 * Tests for star rating input component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RatingInput } from '../rating-input';

describe('RatingInput', () => {
  describe('rendering', () => {
    it('renders 5 star buttons', () => {
      const onChange = vi.fn();
      render(<RatingInput value={0} onChange={onChange} />);

      const buttons = screen.getAllByRole('button', { name: /rate \d star/i });
      expect(buttons).toHaveLength(5);
    });

    it('renders stars with correct aria labels', () => {
      const onChange = vi.fn();
      render(<RatingInput value={0} onChange={onChange} />);

      expect(screen.getByRole('button', { name: 'Rate 1 star' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rate 2 stars' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rate 3 stars' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rate 4 stars' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rate 5 stars' })).toBeInTheDocument();
    });

    it('does not show clear button when value is 0', () => {
      const onChange = vi.fn();
      render(<RatingInput value={0} onChange={onChange} />);

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('shows clear button when value is greater than 0', () => {
      const onChange = vi.fn();
      render(<RatingInput value={3} onChange={onChange} />);

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });
  });

  describe('visual state', () => {
    it('highlights stars up to the selected value', () => {
      const onChange = vi.fn();
      const { container } = render(<RatingInput value={3} onChange={onChange} />);

      const stars = container.querySelectorAll('svg');
      // First 3 stars should be filled
      expect(stars[0].classList.contains('fill-yellow-400')).toBe(true);
      expect(stars[1].classList.contains('fill-yellow-400')).toBe(true);
      expect(stars[2].classList.contains('fill-yellow-400')).toBe(true);
      // Last 2 should not be filled
      expect(stars[3].classList.contains('fill-yellow-400')).toBe(false);
      expect(stars[4].classList.contains('fill-yellow-400')).toBe(false);
    });

    it('highlights all stars when value is 5', () => {
      const onChange = vi.fn();
      const { container } = render(<RatingInput value={5} onChange={onChange} />);

      const stars = container.querySelectorAll('svg');
      stars.forEach((star) => {
        expect(star.classList.contains('fill-yellow-400')).toBe(true);
      });
    });

    it('highlights no stars when value is 0', () => {
      const onChange = vi.fn();
      const { container } = render(<RatingInput value={0} onChange={onChange} />);

      const stars = container.querySelectorAll('svg');
      stars.forEach((star) => {
        expect(star.classList.contains('fill-yellow-400')).toBe(false);
      });
    });
  });

  describe('interactions', () => {
    it('calls onChange with star number when clicking unselected star', () => {
      const onChange = vi.fn();
      render(<RatingInput value={0} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 3 stars' }));

      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('calls onChange with 0 when clicking already selected star (toggle off)', () => {
      const onChange = vi.fn();
      render(<RatingInput value={3} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 3 stars' }));

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('calls onChange with new value when clicking different star', () => {
      const onChange = vi.fn();
      render(<RatingInput value={2} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 5 stars' }));

      expect(onChange).toHaveBeenCalledWith(5);
    });

    it('calls onChange with 0 when clicking clear button', () => {
      const onChange = vi.fn();
      render(<RatingInput value={4} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: /clear/i }));

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('allows selecting rating 1', () => {
      const onChange = vi.fn();
      render(<RatingInput value={0} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 1 star' }));

      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('accessibility', () => {
    it('all buttons are of type button (not submit)', () => {
      const onChange = vi.fn();
      render(<RatingInput value={3} onChange={onChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('star icons have aria-hidden attribute', () => {
      const onChange = vi.fn();
      const { container } = render(<RatingInput value={0} onChange={onChange} />);

      const stars = container.querySelectorAll('svg');
      stars.forEach((star) => {
        expect(star).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('buttons have minimum touch target size', () => {
      const onChange = vi.fn();
      render(<RatingInput value={0} onChange={onChange} />);

      const buttons = screen.getAllByRole('button', { name: /rate \d star/i });
      buttons.forEach((button) => {
        expect(button.classList.contains('min-w-[44px]')).toBe(true);
        expect(button.classList.contains('min-h-[44px]')).toBe(true);
      });
    });
  });
});
