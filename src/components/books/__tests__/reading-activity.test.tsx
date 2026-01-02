/**
 * Unit Tests for components/books/reading-activity.tsx
 * Tests for reading activity components: StatusPill, ReadingActivitySection, NotesSection, Modals
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  StatusPill,
  ReadingActivitySection,
  NotesSection,
  EditDatesModal,
  EditNotesModal,
} from '../reading-activity';

// Mock data
const mockReads = [
  { startedAt: 1704067200000, finishedAt: 1704672000000 }, // 1 Jan 2024 - 8 Jan 2024
  { startedAt: 1735689600000, finishedAt: null }, // 1 Jan 2025 - In progress
];

const mockHandlers = {
  onStartReading: vi.fn().mockResolvedValue(undefined),
  onMarkFinished: vi.fn().mockResolvedValue(undefined),
  onStartReread: vi.fn().mockResolvedValue(undefined),
  onUpdateDates: vi.fn().mockResolvedValue(undefined),
  onDeleteRead: vi.fn().mockResolvedValue(undefined),
};

describe('StatusPill', () => {
  it('renders want-to-read status', () => {
    render(<StatusPill status="want-to-read" />);
    expect(screen.getByText('Not Read')).toBeInTheDocument();
  });

  it('renders reading status with icon', () => {
    render(<StatusPill status="reading" />);
    expect(screen.getByText('Reading')).toBeInTheDocument();
    // Check for BookOpen icon (svg present)
    const pill = screen.getByText('Reading').closest('span');
    expect(pill?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders finished status with icon', () => {
    render(<StatusPill status="finished" />);
    expect(screen.getByText('Finished')).toBeInTheDocument();
    // Check for CheckCircle icon (svg present)
    const pill = screen.getByText('Finished').closest('span');
    expect(pill?.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct styling for each status', () => {
    const { rerender } = render(<StatusPill status="want-to-read" />);
    expect(screen.getByText('Not Read').closest('span')).toHaveClass('bg-gray-100');

    rerender(<StatusPill status="reading" />);
    expect(screen.getByText('Reading').closest('span')).toHaveClass('bg-blue-100');

    rerender(<StatusPill status="finished" />);
    expect(screen.getByText('Finished').closest('span')).toHaveClass('bg-green-100');
  });
});

describe('ReadingActivitySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Reading Log header', () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
        />
      );

      expect(screen.getByText('Reading Log')).toBeInTheDocument();
    });

    it('renders count badge when reads exist', () => {
      render(
        <ReadingActivitySection
          status="reading"
          reads={mockReads}
          {...mockHandlers}
          updatingStatus={false}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows "No reading history yet" when no reads', () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      expect(screen.getByText('No reading history yet')).toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('is collapsed by default', () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
        />
      );

      // Content should have collapsed grid class
      const content = screen.getByText('No reading history yet').closest('div[class*="grid"]');
      expect(content).toHaveClass('grid-rows-[0fr]');
    });

    it('expands when header clicked', () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /reading log/i }));

      const content = screen.getByText('No reading history yet').closest('div[class*="grid"]');
      expect(content).toHaveClass('grid-rows-[1fr]');
    });

    it('supports controlled mode', () => {
      const onToggle = vi.fn();
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
          isExpanded={true}
          onToggle={onToggle}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /reading log/i }));
      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('reading entries', () => {
    it('displays reading dates correctly', () => {
      render(
        <ReadingActivitySection
          status="reading"
          reads={mockReads}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      // Check for date ranges
      expect(screen.getByText(/1 Jan 2024/)).toBeInTheDocument();
      expect(screen.getByText(/In progress/)).toBeInTheDocument();
    });

    it('shows mark finished button for in-progress reads', () => {
      render(
        <ReadingActivitySection
          status="reading"
          reads={[{ startedAt: 1735689600000, finishedAt: null }]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      expect(screen.getByLabelText('Mark as finished')).toBeInTheDocument();
    });

    it('calls onMarkFinished when checkmark clicked', async () => {
      render(
        <ReadingActivitySection
          status="reading"
          reads={[{ startedAt: 1735689600000, finishedAt: null }]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      fireEvent.click(screen.getByLabelText('Mark as finished'));
      expect(mockHandlers.onMarkFinished).toHaveBeenCalled();
    });

    it('shows edit and delete buttons for each entry', () => {
      render(
        <ReadingActivitySection
          status="finished"
          reads={[mockReads[0]]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      expect(screen.getByLabelText('Edit reading dates')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete reading entry')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('shows Start Reading for want-to-read status', () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      expect(screen.getByText('Start Reading')).toBeInTheDocument();
    });

    it('calls onStartReading when clicked', async () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      fireEvent.click(screen.getByText('Start Reading'));
      expect(mockHandlers.onStartReading).toHaveBeenCalled();
    });

    it('shows Start Re-read for finished status', () => {
      render(
        <ReadingActivitySection
          status="finished"
          reads={[mockReads[0]]}
          {...mockHandlers}
          updatingStatus={false}
          defaultExpanded
        />
      );

      expect(screen.getByText('Start Re-read')).toBeInTheDocument();
    });

    it('disables buttons when updatingStatus is true', () => {
      render(
        <ReadingActivitySection
          status="want-to-read"
          reads={[]}
          {...mockHandlers}
          updatingStatus={true}
          defaultExpanded
        />
      );

      expect(screen.getByText('Start Reading').closest('button')).toBeDisabled();
    });
  });
});

describe('NotesSection', () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Notes header', () => {
      render(<NotesSection notes="" onSave={mockOnSave} />);
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('shows note indicator icon when notes exist', () => {
      render(<NotesSection notes="Some notes" onSave={mockOnSave} />);
      // MessageSquare icon should be present
      const header = screen.getByText('Notes').closest('span');
      expect(header?.querySelectorAll('svg').length).toBeGreaterThan(0);
    });

    it('shows "No notes yet" when empty', () => {
      render(<NotesSection notes="" onSave={mockOnSave} defaultExpanded />);
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    it('shows notes content when notes exist', () => {
      render(<NotesSection notes="My book notes" onSave={mockOnSave} defaultExpanded />);
      expect(screen.getByText('My book notes')).toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('is collapsed by default', () => {
      render(<NotesSection notes="Some notes" onSave={mockOnSave} />);
      const content = screen.getByText('Some notes').closest('div[class*="grid"]');
      expect(content).toHaveClass('grid-rows-[0fr]');
    });

    it('expands when header clicked', () => {
      render(<NotesSection notes="Some notes" onSave={mockOnSave} />);
      // Click the header button (first button)
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      const content = screen.getByText('Some notes').closest('div[class*="grid"]');
      expect(content).toHaveClass('grid-rows-[1fr]');
    });

    it('supports controlled mode', () => {
      const onToggle = vi.fn();
      render(
        <NotesSection
          notes="Some notes"
          onSave={mockOnSave}
          isExpanded={true}
          onToggle={onToggle}
        />
      );
      // Click the header button (first button)
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('shows edit button when notes exist', () => {
      render(<NotesSection notes="Some notes" onSave={mockOnSave} defaultExpanded />);
      expect(screen.getByLabelText('Edit notes')).toBeInTheDocument();
    });

    it('shows delete button when notes exist', () => {
      render(<NotesSection notes="Some notes" onSave={mockOnSave} defaultExpanded />);
      expect(screen.getByLabelText('Delete notes')).toBeInTheDocument();
    });

    it('shows add button when no notes', () => {
      render(<NotesSection notes="" onSave={mockOnSave} defaultExpanded />);
      expect(screen.getByLabelText('Add notes')).toBeInTheDocument();
    });
  });
});

describe('EditDatesModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders when open', () => {
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={1704672000000}
      />
    );

    expect(screen.getByText('Edit Dates')).toBeInTheDocument();
  });

  it('populates initial dates', () => {
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={1704672000000}
      />
    );

    const startInput = screen.getByLabelText('Started') as HTMLInputElement;
    const finishInput = screen.getByLabelText('Finished') as HTMLInputElement;

    expect(startInput.value).toBe('2024-01-01');
    expect(finishInput.value).toBe('2024-01-08');
  });

  it('shows clear button for finished date when set', () => {
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={1704672000000}
      />
    );

    expect(screen.getByLabelText('Clear finished date')).toBeInTheDocument();
  });

  it('clears finished date when clear button clicked', async () => {
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={1704672000000}
      />
    );

    fireEvent.click(screen.getByLabelText('Clear finished date'));

    const finishInput = screen.getByLabelText('Finished') as HTMLInputElement;
    expect(finishInput.value).toBe('');
  });

  it('shows error when no dates provided', async () => {
    vi.useRealTimers(); // Use real timers for this test
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={null}
      />
    );

    // Clear the start date
    const startInput = screen.getByLabelText('Started') as HTMLInputElement;
    fireEvent.change(startInput, { target: { value: '' } });

    // Submit
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('At least one date is required')).toBeInTheDocument();
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  it('calls onSave with correct values', async () => {
    vi.useRealTimers(); // Use real timers for this test
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={null}
      />
    );

    // Add a finish date
    const finishInput = screen.getByLabelText('Finished') as HTMLInputElement;
    fireEvent.change(finishInput, { target: { value: '2024-01-10' } });

    // Submit
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  it('disables save when no changes made', () => {
    render(
      <EditDatesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialStartedAt={1704067200000}
        initialFinishedAt={1704672000000}
      />
    );

    expect(screen.getByText('Save')).toBeDisabled();
  });
});

describe('EditNotesModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <EditNotesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNotes="Initial notes"
      />
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('populates initial notes', () => {
    render(
      <EditNotesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNotes="Initial notes"
      />
    );

    const textarea = screen.getByPlaceholderText('Add your notes about this book...');
    expect(textarea).toHaveValue('Initial notes');
  });

  it('disables save when no changes made', () => {
    render(
      <EditNotesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNotes="Initial notes"
      />
    );

    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('enables save when notes changed', () => {
    render(
      <EditNotesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNotes="Initial notes"
      />
    );

    const textarea = screen.getByPlaceholderText('Add your notes about this book...');
    fireEvent.change(textarea, { target: { value: 'Updated notes' } });

    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('calls onSave with trimmed notes', async () => {
    render(
      <EditNotesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNotes=""
      />
    );

    const textarea = screen.getByPlaceholderText('Add your notes about this book...');
    fireEvent.change(textarea, { target: { value: '  New notes  ' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('New notes');
    });
  });

  it('closes modal on cancel', () => {
    render(
      <EditNotesModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNotes=""
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
