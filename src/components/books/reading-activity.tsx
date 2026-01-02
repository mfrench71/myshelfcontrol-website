/**
 * Reading Activity Components
 * Edit modals for reading dates and notes, plus Reading Activity section
 */
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Pencil, BookOpen, Play, CheckCircle, RotateCcw, Loader2, Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/modal';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartedAt(formatDateForInput(initialStartedAt));
      setFinishedAt(formatDateForInput(initialFinishedAt));
      setError(null);
    }
  }, [isOpen, initialStartedAt, initialFinishedAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate dates
    const start = startedAt ? new Date(startedAt).getTime() : null;
    const finish = finishedAt ? new Date(finishedAt).getTime() : null;

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
        <h3 id="sheet-title" className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="started-at" className="block text-sm font-medium text-gray-700 mb-1">
              Started
            </label>
            <input
              type="date"
              id="started-at"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="finished-at" className="block text-sm font-medium text-gray-700 mb-1">
              Finished
            </label>
            <input
              type="date"
              id="finished-at"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes);
      setError(null);
    }
  }, [isOpen, initialNotes]);

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
        <h3 id="sheet-title" className="text-lg font-semibold text-gray-900 mb-4">
          Notes
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              placeholder="Add your notes about this book..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
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
// ReadingActivitySection Component
// ============================================================================

type ReadingActivityProps = {
  status: 'want-to-read' | 'reading' | 'finished';
  reads: BookRead[];
  onStartReading: () => Promise<void>;
  onMarkFinished: () => Promise<void>;
  onStartReread: () => Promise<void>;
  onUpdateDates: (readIndex: number, startedAt: number | null, finishedAt: number | null) => Promise<void>;
  updatingStatus: boolean;
};

/**
 * Reading Activity section for book view
 * Shows status, reading history, and inline actions
 */
export function ReadingActivitySection({
  status,
  reads,
  onStartReading,
  onMarkFinished,
  onStartReread,
  onUpdateDates,
  updatingStatus,
}: ReadingActivityProps) {
  const [editingReadIndex, setEditingReadIndex] = useState<number | null>(null);
  const editingRead = editingReadIndex !== null ? reads[editingReadIndex] : null;

  const handleSaveDates = async (startedAt: number | null, finishedAt: number | null) => {
    if (editingReadIndex !== null) {
      await onUpdateDates(editingReadIndex, startedAt, finishedAt);
    }
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-base">
        <BookOpen className="w-4 h-4" aria-hidden="true" />
        Reading Activity
      </h2>

      {/* Status Row */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Status:</span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
          status === 'reading'
            ? 'bg-blue-100 text-blue-700'
            : status === 'finished'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
        }`}>
          {status === 'reading' && <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />}
          {status === 'finished' && <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />}
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Current Read Info (if reading) */}
      {status === 'reading' && reads.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <span>Started: {formatDate(reads[reads.length - 1].startedAt)}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditingReadIndex(reads.length - 1)}
            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
          >
            Edit
          </button>
        </div>
      )}

      {/* Reading History (if finished with history) */}
      {status === 'finished' && reads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Reading History</h4>
          <div className="space-y-1.5">
            {reads.map((read, index) => {
              const startDate = formatDate(read.startedAt);
              const endDate = formatDate(read.finishedAt);

              return (
                <div key={`${read.startedAt}-${read.finishedAt}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span>
                      {startDate || 'Unknown'}
                      {endDate ? ` – ${endDate}` : ' – In progress'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingReadIndex(index)}
                    className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-1">
        {status === 'want-to-read' && (
          <button
            onClick={onStartReading}
            disabled={updatingStatus}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
          >
            {updatingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4" aria-hidden="true" />
            )}
            Start Reading
          </button>
        )}
        {status === 'reading' && (
          <button
            onClick={onMarkFinished}
            disabled={updatingStatus}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
          >
            {updatingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            )}
            Mark as Finished
          </button>
        )}
        {status === 'finished' && (
          <button
            onClick={onStartReread}
            disabled={updatingStatus}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
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

      {/* Edit Dates Modal */}
      <EditDatesModal
        isOpen={editingReadIndex !== null}
        onClose={() => setEditingReadIndex(null)}
        onSave={handleSaveDates}
        initialStartedAt={editingRead?.startedAt}
        initialFinishedAt={editingRead?.finishedAt}
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
};

/**
 * Notes section for book view with inline editing
 */
export function NotesSection({ notes, onSave }: NotesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-base">
          <Pencil className="w-4 h-4" aria-hidden="true" />
          Notes
        </h2>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
        >
          {notes ? 'Edit' : 'Add'}
        </button>
      </div>

      {notes ? (
        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
          {notes}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No notes yet</p>
      )}

      <EditNotesModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onSave}
        initialNotes={notes}
      />
    </div>
  );
}
