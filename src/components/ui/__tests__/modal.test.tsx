/**
 * Unit Tests for components/ui/modal.tsx
 * Tests for Modal, BottomSheet, ConfirmModal, and useConfirmModal hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, BottomSheet, ConfirmModal, useConfirmModal } from '../modal';

// Mock useBodyScrollLock hook
vi.mock('@/lib/hooks/use-body-scroll-lock', () => ({
  useBodyScrollLock: vi.fn(),
}));

describe('Modal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders content when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('does not set aria-labelledby without title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('applies custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-class">
          <div>Modal content</div>
        </Modal>
      );

      expect(document.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('shows close button by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked (after animation)', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      // Animation delay
      vi.advanceTimersByTime(200);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('backdrop click', () => {
    it('closes on backdrop click by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      vi.advanceTimersByTime(200);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on backdrop click when disabled', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnBackdrop={false}>
          <div>Modal content</div>
        </Modal>
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      vi.advanceTimersByTime(200);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not close when clicking modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      fireEvent.click(screen.getByText('Modal content'));

      vi.advanceTimersByTime(200);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('escape key', () => {
    it('closes on Escape key by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      vi.advanceTimersByTime(200);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when disabled', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <div>Modal content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      vi.advanceTimersByTime(200);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('ignores other keys', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      vi.advanceTimersByTime(200);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('body scroll lock', () => {
    it('locks body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });
});

describe('BottomSheet', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(
        <BottomSheet isOpen={false} onClose={mockOnClose}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
    });

    it('renders content when open', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      expect(screen.getByText('Sheet content')).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} title="Test Sheet">
          <div>Sheet content</div>
        </BottomSheet>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'sheet-title');
    });

    it('renders close button by default', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} className="custom-sheet">
          <div>Sheet content</div>
        </BottomSheet>
      );

      expect(document.querySelector('.custom-sheet')).toBeInTheDocument();
    });
  });

  describe('backdrop click', () => {
    it('closes on backdrop click by default', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      vi.advanceTimersByTime(250);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on backdrop click when disabled', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} closeOnBackdrop={false}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      vi.advanceTimersByTime(250);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('escape key', () => {
    it('closes on Escape key by default', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      vi.advanceTimersByTime(250);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when disabled', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      vi.advanceTimersByTime(250);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('body scroll lock', () => {
    it('locks body scroll when open', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet content</div>
        </BottomSheet>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });
  });
});

describe('ConfirmModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders title and message', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm Action"
          message="Are you sure you want to proceed?"
        />
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('renders default button text', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm"
          message="Message"
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Delete"
          message="Delete this item?"
          confirmText="Delete"
          cancelText="Keep"
        />
      );

      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('button actions', () => {
    it('calls onClose when cancel is clicked', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm"
          message="Message"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm is clicked', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm"
          message="Message"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading state', () => {
    it('shows loading text when isLoading', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm"
          message="Message"
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('disables buttons when loading', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm"
          message="Message"
          isLoading={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('variant styling', () => {
    it('applies primary styling by default', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm"
          message="Message"
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-primary');
    });

    it('applies danger styling for danger variant', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Delete"
          message="Delete this?"
          variant="danger"
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });
  });
});

describe('useConfirmModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function TestComponent() {
    const [ConfirmModalComponent, confirm] = useConfirmModal();
    const handleClick = async () => {
      const result = await confirm({
        title: 'Test Title',
        message: 'Test Message',
      });
      // Store result in DOM for testing
      document.body.setAttribute('data-confirm-result', String(result));
    };

    return (
      <>
        <button onClick={handleClick}>Open Confirm</button>
        <ConfirmModalComponent />
      </>
    );
  }

  it('opens modal when confirm is called', async () => {
    render(<TestComponent />);

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('resolves true when confirmed', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));

    expect(screen.getByText('Test Title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await vi.runAllTimersAsync();

    expect(document.body.getAttribute('data-confirm-result')).toBe('true');
  });

  it('resolves false when cancelled', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));

    expect(screen.getByText('Test Title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await vi.runAllTimersAsync();

    expect(document.body.getAttribute('data-confirm-result')).toBe('false');
  });

  it('supports custom options', async () => {
    function CustomTestComponent() {
      const [ConfirmModalComponent, confirm] = useConfirmModal();
      const handleClick = async () => {
        await confirm({
          title: 'Delete Item',
          message: 'This cannot be undone',
          confirmText: 'Delete Forever',
          cancelText: 'Keep It',
          variant: 'danger',
        });
      };

      return (
        <>
          <button onClick={handleClick}>Open</button>
          <ConfirmModalComponent />
        </>
      );
    }

    render(<CustomTestComponent />);

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep It' })).toBeInTheDocument();
  });
});
