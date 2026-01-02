/**
 * Reading Activity Components
 * Edit modals for reading dates and notes, plus Reading Activity section
 */
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Pencil, BookOpen, Play, CheckCircle, RotateCcw, Loader2, Trash2, ChevronDown, MessageSquare, X } from 'lucide-react';
import { BottomSheet, ConfirmModal } from '@/components/ui/modal';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { STATUS_LABELS, formatDate, formatDateForInput } from '@/lib/utils/book-filters';
import type { BookRead } from '@/lib/types';

// ============================================================================
// EditDatesModal Component
// ============================================================================

type EditDatesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startedAt: number | null, finishedAt: number | null) => Promise<void>;
  initialStartedAt?: string | number | Date | null;
  initialFinishedAt?: string | number | Date | null;
  title?: string;
};

/**
 * Modal for editing reading session dates
 */
export function EditDatesModal({
  isOpen,
  onClose,
  onSave,
  initialStartedAt,
  initialFinishedAt,
  title = 'Edit Dates',
}: EditDatesModalProps) {
  const [startedAt, setStartedAt] = useState('');
  const [finishedAt, setFinishedAt] = useState('');
  const [initialStartedAtValue, setInitialStartedAtValue] = useState('');
  const [initialFinishedAtValue, setInitialFinishedAtValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise form when modal opens
  useEffect(() => {
    if (isOpen) {
      const startVal = formatDateForInput(initialStartedAt);
      const finishVal = formatDateForInput(initialFinishedAt);
      setStartedAt(startVal);
      setFinishedAt(finishVal);
      setInitialStartedAtValue(startVal);
      setInitialFinishedAtValue(finishVal);
      setError(null);
    }
  }, [isOpen, initialStartedAt, initialFinishedAt]);

  // Check if form has changes
  const hasChanges = startedAt !== initialStartedAtValue || finishedAt !== initialFinishedAtValue;

  // Today's date for max attribute
  const todayString = formatDateForInput(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate dates
    const start = startedAt ? new Date(startedAt).getTime() : null;
    const finish = finishedAt ? new Date(finishedAt).getTime() : null;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const todayTime = today.getTime();

    if (!start && !finish) {
      setError('At least one date is required');
      return;
    }

    if (start && start > todayTime) {
      setError('Start date cannot be in the future');
      return;
    }

    if (finish && finish > todayTime) {
      setError('Finish date cannot be in the future');
      return;
    }

    if (start && finish && start > finish) {
      setError('Start date cannot be after finish date');
      return;
    }

    setSaving(true);
    try {
      await onSave(start, finish);
      onClose();
    } catch {
      setError('Failed to save dates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeOnBackdrop={!saving}
      closeOnEscape={!saving}
    >
      <div className="p-6">
        <h3 id="sheet-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="started-at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Started
            </label>
            <input
              type="date"
              id="started-at"
              value={startedAt}
              max={todayString}
              onChange={(e) => setStartedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="finished-at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Finished
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                id="finished-at"
                value={finishedAt}
                max={todayString}
                onChange={(e) => setFinishedAt(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
              />
              {finishedAt && (
                <button
                  type="button"
                  onClick={() => setFinishedAt('')}
                  className="px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[44px] flex items-center justify-center"
                  aria-label="Clear finished date"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}

// ============================================================================
// EditNotesModal Component
// ============================================================================

type EditNotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
  initialNotes?: string;
};

/**
 * Modal for editing book notes
 */
export function EditNotesModal({
  isOpen,
  onClose,
  onSave,
  initialNotes = '',
}: EditNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [initialNotesValue, setInitialNotesValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes);
      setInitialNotesValue(initialNotes);
      setError(null);
    }
  }, [isOpen, initialNotes]);

  // Check if form has changes
  const hasChanges = notes.trim() !== initialNotesValue.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setSaving(true);
    try {
      await onSave(notes.trim());
      onClose();
    } catch {
      setError('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Notes"
      closeOnBackdrop={!saving}
      closeOnEscape={!saving}
    >
      <div className="p-6">
        <h3 id="sheet-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Notes
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              placeholder="Add your notes about this book..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}

// ============================================================================
// StatusPill Component
// ============================================================================

type StatusPillProps = {
  status: 'want-to-read' | 'reading' | 'finished';
};

/**
 * Status pill badge for displaying reading status
 */
export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
      status === 'reading'
        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
        : status === 'finished'
          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    }`}>
      {status === 'reading' && <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />}
      {status === 'finished' && <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

// ============================================================================
// ReadingActivitySection Component
// ============================================================================

type ReadingActivityProps = {
  status: 'want-to-read' | 'reading' | 'finished';
  reads: BookRead[];
  onStartReading: () => Promise<void>;
  onMarkFinished: () => Promise<void>;
  onStartReread: () => Promise<void>;
  onUpdateDates: (readIndex: number, startedAt: number | null, finishedAt: number | null) => Promise<void>;
  onDeleteRead: (readIndex: number) => Promise<void>;
  updatingStatus: boolean;
  /** Controlled mode: whether section is expanded */
  isExpanded?: boolean;
  /** Controlled mode: callback when toggle is clicked */
  onToggle?: () => void;
  /** Uncontrolled mode: initial expanded state */
  defaultExpanded?: boolean;
};

/**
 * Reading Activity section for book view
 * Shows reading history and inline actions in a collapsible section
 */
export function ReadingActivitySection({
  status,
  reads,
  onStartReading,
  onMarkFinished,
  onStartReread,
  onUpdateDates,
  onDeleteRead,
  updatingStatus,
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
}: ReadingActivityProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled mode if both isExpanded and onToggle are provided
  const isControlled = controlledExpanded !== undefined && onToggle !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  const handleToggle = isControlled ? onToggle : () => setInternalExpanded(!internalExpanded);
  const [editingReadIndex, setEditingReadIndex] = useState<number | null>(null);
  const [deletingReadIndex, setDeletingReadIndex] = useState<number | null>(null);
  const editingRead = editingReadIndex !== null ? reads[editingReadIndex] : null;

  const handleSaveDates = async (startedAt: number | null, finishedAt: number | null) => {
    if (editingReadIndex !== null) {
      await onUpdateDates(editingReadIndex, startedAt, finishedAt);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingReadIndex !== null) {
      await onDeleteRead(deletingReadIndex);
      setDeletingReadIndex(null);
    }
  };

  return (
    <div>
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggle();
        }}
        className="w-full flex items-center justify-between p-3 text-left min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-base">
          Reading Log
          {reads.length > 0 && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {reads.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {/* Reading History */}
          {reads.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reads.map((read, index) => {
                    const startDate = formatDate(read.startedAt);
                    const endDate = formatDate(read.finishedAt);
                    const isInProgress = !read.finishedAt;

                    return (
                      <tr key={`${read.startedAt}-${read.finishedAt}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
                            <span>
                              {startDate || 'Unknown'}
                              {endDate ? ` – ${endDate}` : ' – In progress'}
                            </span>
                          </div>
                        </td>
                        <td className="py-0 px-0 text-right whitespace-nowrap">
                          {isInProgress && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                onMarkFinished();
                              }}
                              disabled={updatingStatus}
                              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-green-500 hover:text-green-600 min-w-[44px] min-h-[44px] inline-flex items-center justify-center disabled:opacity-50"
                              aria-label="Mark as finished"
                            >
                              {updatingStatus ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingReadIndex(index);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label="Edit reading dates"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setDeletingReadIndex(index);
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label="Delete reading entry"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">No reading history yet</p>
          )}

          {/* Action Button - only for status changes that don't have a row */}
          {(status === 'want-to-read' || status === 'finished') && (
            <div className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              {status === 'want-to-read' && (
                <button
                  onClick={onStartReading}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary dark:text-blue-400 hover:text-primary-dark dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                  Start Reading
                </button>
              )}
              {status === 'finished' && (
                <button
                  onClick={onStartReread}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary dark:text-blue-400 hover:text-primary-dark dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  )}
                  Start Re-read
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dates Modal */}
      <EditDatesModal
        isOpen={editingReadIndex !== null}
        onClose={() => setEditingReadIndex(null)}
        onSave={handleSaveDates}
        initialStartedAt={editingRead?.startedAt}
        initialFinishedAt={editingRead?.finishedAt}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingReadIndex !== null}
        onClose={() => setDeletingReadIndex(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Reading Entry"
        message="Are you sure you want to delete this reading entry? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

// ============================================================================
// NotesSection Component
// ============================================================================

type NotesSectionProps = {
  notes: string;
  onSave: (notes: string) => Promise<void>;
  /** Controlled mode: whether section is expanded */
  isExpanded?: boolean;
  /** Controlled mode: callback when toggle is clicked */
  onToggle?: () => void;
  /** Uncontrolled mode: initial expanded state */
  defaultExpanded?: boolean;
};

/**
 * Notes section for book view with inline editing (collapsible)
 */
export function NotesSection({
  notes,
  onSave,
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
}: NotesSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled mode if both isExpanded and onToggle are provided
  const isControlled = controlledExpanded !== undefined && onToggle !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  const handleToggle = isControlled ? onToggle : () => setInternalExpanded(!internalExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    await onSave('');
    setIsDeleting(false);
  };

  return (
    <div>
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggle();
        }}
        className="w-full flex items-center justify-between p-3 text-left min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-base">
          Notes
          {notes && (
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {notes ? (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap p-3">
                  {notes}
                </div>
                <div className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(true);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                    aria-label="Edit notes"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsDeleting(true);
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                    aria-label="Delete notes"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500 italic p-3">No notes yet</p>
                <div className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(true);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                    aria-label="Add notes"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditNotesModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onSave}
        initialNotes={notes}
      />

      <ConfirmModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Notes"
        message="Are you sure you want to delete your notes? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
