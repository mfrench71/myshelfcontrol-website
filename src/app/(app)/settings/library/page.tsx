/**
 * Library Settings Page
 * Manage genres, series, and backup/restore
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import {
  Tag,
  Layers,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  Combine,
  Library,
  Check,
  Loader2,
  BookOpen,
  Heart,
  MinusCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { BottomSheet } from '@/components/ui/modal';
import { getGenres, createGenre, updateGenre, deleteGenre } from '@/lib/repositories/genres';
import { getSeries, createSeries, updateSeries, deleteSeries } from '@/lib/repositories/series';
import { getBooks, getBinBooks, addBook, batchMergeGenre, batchMergeSeries } from '@/lib/repositories/books';
import { getWishlist, addWishlistItem } from '@/lib/repositories/wishlist';
import { getContrastColor, getNextAvailableColor, GENRE_COLORS } from '@/lib/utils';
import type { Genre, Series, Book } from '@/lib/types';

/** Genre with book count */
type GenreWithCount = Genre & { bookCount: number };

/** Series with book count */
type SeriesWithCount = Series & { bookCount: number };

/** Picker settings stored in localStorage */
type PickerSettings = {
  genreSuggestionsFirst: boolean;
  seriesSuggestionsFirst: boolean;
};

const DEFAULT_PICKER_SETTINGS: PickerSettings = {
  genreSuggestionsFirst: false,
  seriesSuggestionsFirst: false,
};

function getPickerSettings(): PickerSettings {
  if (typeof window === 'undefined') return DEFAULT_PICKER_SETTINGS;
  try {
    const stored = localStorage.getItem('pickerSettings');
    return stored ? { ...DEFAULT_PICKER_SETTINGS, ...JSON.parse(stored) } : DEFAULT_PICKER_SETTINGS;
  } catch {
    return DEFAULT_PICKER_SETTINGS;
  }
}

function savePickerSettings(settings: Partial<PickerSettings>): void {
  if (typeof window === 'undefined') return;
  const current = getPickerSettings();
  localStorage.setItem('pickerSettings', JSON.stringify({ ...current, ...settings }));
}

export default function LibrarySettingsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();

  // Books data (used in loadData for counting - state stored for future features)
  const [_books, setBooks] = useState<Book[]>([]);

  // Genre state
  const [genres, setGenres] = useState<GenreWithCount[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreName, setGenreName] = useState('');
  const [genreColor, setGenreColor] = useState('');
  const [genreSaving, setGenreSaving] = useState(false);
  const [genreDeleteConfirm, setGenreDeleteConfirm] = useState<GenreWithCount | null>(null);
  const [showMergeGenreModal, setShowMergeGenreModal] = useState(false);
  const [mergingGenre, setMergingGenre] = useState<Genre | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');

  // Series state
  const [seriesList, setSeriesList] = useState<SeriesWithCount[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [seriesName, setSeriesName] = useState('');
  const [seriesTotalBooks, setSeriesTotalBooks] = useState('');
  const [seriesSaving, setSeriesSaving] = useState(false);
  const [seriesDeleteConfirm, setSeriesDeleteConfirm] = useState<SeriesWithCount | null>(null);
  const [showMergeSeriesModal, setShowMergeSeriesModal] = useState(false);
  const [mergingSeries, setMergingSeries] = useState<Series | null>(null);
  const [mergeSeriesTargetId, setMergeSeriesTargetId] = useState('');

  // Picker settings
  const [pickerSettings, setPickerSettings] = useState<PickerSettings>(DEFAULT_PICKER_SETTINGS);

  // Backup/restore state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load picker settings on mount
  useEffect(() => {
    setPickerSettings(getPickerSettings());
  }, []);

  // Lock body scroll when any modal is open
  const isAnyModalOpen = showGenreModal || !!genreDeleteConfirm || showMergeGenreModal ||
    showSeriesModal || !!seriesDeleteConfirm || showMergeSeriesModal;
  useBodyScrollLock(isAnyModalOpen);

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setGenresLoading(true);
      setSeriesLoading(true);

      const [userGenres, userSeries, userBooks] = await Promise.all([
        getGenres(user.uid),
        getSeries(user.uid),
        getBooks(user.uid),
      ]);

      setBooks(userBooks);

      // Count books per genre
      const genreCounts = countBooksPerGenre(userBooks);
      const genresWithCounts: GenreWithCount[] = userGenres.map((genre) => ({
        ...genre,
        bookCount: genreCounts[genre.id] || 0,
      }));
      setGenres(genresWithCounts);

      // Count books per series
      const seriesCounts = countBooksPerSeries(userBooks);
      const seriesWithCounts: SeriesWithCount[] = userSeries.map((s) => ({
        ...s,
        bookCount: seriesCounts[s.id] || 0,
      }));
      setSeriesList(seriesWithCounts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setGenresLoading(false);
      setSeriesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Count books per genre
  function countBooksPerGenre(bookList: Book[]): Record<string, number> {
    const counts: Record<string, number> = {};
    bookList.forEach((book) => {
      (book.genres || []).forEach((genreId) => {
        counts[genreId] = (counts[genreId] || 0) + 1;
      });
    });
    return counts;
  }

  // Count books per series
  function countBooksPerSeries(bookList: Book[]): Record<string, number> {
    const counts: Record<string, number> = {};
    bookList.forEach((book) => {
      if (book.seriesId) {
        counts[book.seriesId] = (counts[book.seriesId] || 0) + 1;
      }
    });
    return counts;
  }

  // Get used colors (for hiding in picker)
  function getUsedColors(): Set<string> {
    const used = new Set<string>();
    genres.forEach((g) => {
      if (g.id !== editingGenre?.id) {
        used.add(g.color.toLowerCase());
      }
    });
    return used;
  }

  // ========== DIRTY STATE HELPERS ==========

  /** Check if genre form has changes worth saving */
  const isGenreFormDirty = (): boolean => {
    if (!genreName.trim()) return false; // Need a name at minimum

    if (editingGenre) {
      // Edit mode: check if something changed
      return genreName.trim() !== editingGenre.name || genreColor !== editingGenre.color;
    }

    // Add mode: just need a name
    return true;
  };

  /** Check if series form has changes worth saving */
  const isSeriesFormDirty = (): boolean => {
    if (!seriesName.trim()) return false; // Need a name at minimum

    if (editingSeries) {
      // Edit mode: check if something changed
      const originalTotal = editingSeries.totalBooks?.toString() || '';
      return seriesName.trim() !== editingSeries.name || seriesTotalBooks !== originalTotal;
    }

    // Add mode: just need a name
    return true;
  };

  // ========== GENRE HANDLERS ==========

  const openAddGenreModal = () => {
    setEditingGenre(null);
    setGenreName('');
    setGenreColor(getNextAvailableColor(genres.map((g) => g.color)));
    setShowGenreModal(true);
  };

  const openEditGenreModal = (genre: Genre) => {
    setEditingGenre(genre);
    setGenreName(genre.name);
    setGenreColor(genre.color);
    setShowGenreModal(true);
  };

  const closeGenreModal = () => {
    setShowGenreModal(false);
    setEditingGenre(null);
    setGenreName('');
    setGenreColor('');
  };

  const handleSaveGenre = async () => {
    if (!user || !genreName.trim() || genreSaving) return;

    setGenreSaving(true);
    try {
      if (editingGenre) {
        await updateGenre(user.uid, editingGenre.id, {
          name: genreName.trim(),
          color: genreColor,
        });
        showToast('Genre updated!', { type: 'success' });
      } else {
        await createGenre(user.uid, genreName.trim(), genreColor);
        showToast('Genre created!', { type: 'success' });
      }
      closeGenreModal();
      await loadData();
    } catch (error) {
      console.error('Failed to save genre:', error);
      showToast('Failed to save genre. Please try again.', { type: 'error' });
    } finally {
      setGenreSaving(false);
    }
  };

  const handleDeleteGenre = async () => {
    if (!user || !genreDeleteConfirm || genreSaving) return;

    setGenreSaving(true);
    try {
      await deleteGenre(user.uid, genreDeleteConfirm.id);
      setGenreDeleteConfirm(null);
      showToast('Genre deleted', { type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to delete genre:', error);
      showToast('Error deleting genre', { type: 'error' });
    } finally {
      setGenreSaving(false);
    }
  };

  const openMergeGenreModal = (genre: Genre) => {
    setMergingGenre(genre);
    setMergeTargetId('');
    setShowMergeGenreModal(true);
  };

  const closeMergeGenreModal = () => {
    setShowMergeGenreModal(false);
    setMergingGenre(null);
    setMergeTargetId('');
  };

  const handleMergeGenre = async () => {
    if (!user || !mergingGenre || !mergeTargetId || genreSaving) return;

    setGenreSaving(true);
    try {
      // Update all books with the source genre to have the target genre instead
      const updatedCount = await batchMergeGenre(user.uid, mergingGenre.id, mergeTargetId);

      // Delete the source genre
      await deleteGenre(user.uid, mergingGenre.id);
      closeMergeGenreModal();
      const targetGenre = genres.find((g) => g.id === mergeTargetId);
      showToast(`Merged ${updatedCount} books into "${targetGenre?.name}"`, { type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to merge genre:', error);
      showToast('Failed to merge genres. Please try again.', { type: 'error' });
    } finally {
      setGenreSaving(false);
    }
  };

  // ========== SERIES HANDLERS ==========

  const openAddSeriesModal = () => {
    setEditingSeries(null);
    setSeriesName('');
    setSeriesTotalBooks('');
    setShowSeriesModal(true);
  };

  const openEditSeriesModal = (series: Series) => {
    setEditingSeries(series);
    setSeriesName(series.name);
    setSeriesTotalBooks(series.totalBooks?.toString() || '');
    setShowSeriesModal(true);
  };

  const closeSeriesModal = () => {
    setShowSeriesModal(false);
    setEditingSeries(null);
    setSeriesName('');
    setSeriesTotalBooks('');
  };

  const handleSaveSeries = async () => {
    if (!user || !seriesName.trim() || seriesSaving) return;

    setSeriesSaving(true);
    try {
      const totalBooks = seriesTotalBooks ? parseInt(seriesTotalBooks, 10) : undefined;

      if (editingSeries) {
        await updateSeries(user.uid, editingSeries.id, {
          name: seriesName.trim(),
          totalBooks,
        });
        showToast('Series updated!', { type: 'success' });
      } else {
        await createSeries(user.uid, seriesName.trim(), totalBooks);
        showToast('Series created!', { type: 'success' });
      }

      closeSeriesModal();
      await loadData();
    } catch (error) {
      console.error('Failed to save series:', error);
      showToast('Failed to save series. Please try again.', { type: 'error' });
    } finally {
      setSeriesSaving(false);
    }
  };

  const handleDeleteSeries = async () => {
    if (!user || !seriesDeleteConfirm || seriesSaving) return;

    setSeriesSaving(true);
    try {
      await deleteSeries(user.uid, seriesDeleteConfirm.id);
      setSeriesDeleteConfirm(null);
      showToast('Series deleted', { type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to delete series:', error);
      showToast('Error deleting series', { type: 'error' });
    } finally {
      setSeriesSaving(false);
    }
  };

  const openMergeSeriesModal = (series: Series) => {
    setMergingSeries(series);
    setMergeSeriesTargetId('');
    setShowMergeSeriesModal(true);
  };

  const closeMergeSeriesModal = () => {
    setShowMergeSeriesModal(false);
    setMergingSeries(null);
    setMergeSeriesTargetId('');
  };

  const handleMergeSeries = async () => {
    if (!user || !mergingSeries || !mergeSeriesTargetId || seriesSaving) return;

    setSeriesSaving(true);
    try {
      // Update all books with the source series to have the target series instead
      const updatedCount = await batchMergeSeries(user.uid, mergingSeries.id, mergeSeriesTargetId);

      // Delete the source series
      await deleteSeries(user.uid, mergingSeries.id);
      closeMergeSeriesModal();
      const targetSeries = seriesList.find((s) => s.id === mergeSeriesTargetId);
      showToast(`Merged ${updatedCount} books into "${targetSeries?.name}"`, { type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to merge series:', error);
      showToast('Failed to merge series. Please try again.', { type: 'error' });
    } finally {
      setSeriesSaving(false);
    }
  };

  // ========== PICKER SETTINGS HANDLERS ==========

  const handleGenreSuggestionsFirstChange = (checked: boolean) => {
    setPickerSettings((prev) => ({ ...prev, genreSuggestionsFirst: checked }));
    savePickerSettings({ genreSuggestionsFirst: checked });
    showToast(checked ? 'Genre suggestions shown first' : 'Your genres shown first', { type: 'info' });
  };

  const handleSeriesSuggestionsFirstChange = (checked: boolean) => {
    setPickerSettings((prev) => ({ ...prev, seriesSuggestionsFirst: checked }));
    savePickerSettings({ seriesSuggestionsFirst: checked });
    showToast(checked ? 'Series suggestions shown first' : 'Your series shown first', { type: 'info' });
  };

  // ========== BACKUP HANDLERS ==========

  /** Export backup data as JSON file */
  const handleExport = useCallback(async () => {
    if (!user || exporting) return;

    setExporting(true);
    setImportSummary(null);

    try {
      // Load all data for export
      const [allBooks, allGenres, allSeries, allWishlist, binnedBooks] = await Promise.all([
        getBooks(user.uid),
        getGenres(user.uid),
        getSeries(user.uid),
        getWishlist(user.uid),
        getBinBooks(user.uid),
      ]);

      if (allBooks.length === 0 && allGenres.length === 0 && allWishlist.length === 0 && allSeries.length === 0 && binnedBooks.length === 0) {
        showToast('No data to export', { type: 'error' });
        return;
      }

      // Prepare export data
      const exportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        genres: allGenres.map(({ id, ...g }) => ({ ...g, _exportId: id })),
        series: allSeries.map(({ id, ...s }) => ({ ...s, _exportId: id })),
        books: allBooks.map(({ id: _id, ...b }) => b),
        wishlist: allWishlist.map(({ id: _id, ...w }) => w),
        bin: binnedBooks.map(({ id: _id, ...b }) => b),
      };

      // Create and download file
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myshelfcontrol-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Show summary
      const parts = [`${allBooks.length} books`, `${allGenres.length} genres`];
      if (allSeries.length > 0) parts.push(`${allSeries.length} series`);
      if (allWishlist.length > 0) parts.push(`${allWishlist.length} wishlist items`);
      if (binnedBooks.length > 0) parts.push(`${binnedBooks.length} binned`);
      showToast(`Exported ${parts.join(', ')}`, { type: 'success' });
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed. Please try again.', { type: 'error' });
    } finally {
      setExporting(false);
    }
  }, [user, exporting, showToast]);

  /** Import backup data from JSON file */
  const handleImport = useCallback(async (file: File) => {
    if (!user || importing) return;

    setImporting(true);
    setImportStatus('Reading file...');
    setImportSummary(null);

    try {
      const text = await file.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file');
      }

      if (!data.version || (data.version !== 1 && data.version !== 2)) {
        throw new Error('Unrecognised backup format');
      }

      // Migrate v1 to v2
      if (data.version === 1) {
        data.series = [];
        data.bin = [];
      }

      const importGenres = data.genres || [];
      const importSeries = data.series || [];
      const importBooks = data.books || [];
      const importWishlist = data.wishlist || [];
      const importBin = data.bin || [];

      if (importBooks.length === 0 && importGenres.length === 0 && importWishlist.length === 0 && importSeries.length === 0 && importBin.length === 0) {
        throw new Error('Backup file is empty');
      }

      setImportStatus('Loading existing data...');
      const [existingBooks, existingGenres, existingSeries, existingWishlist] = await Promise.all([
        getBooks(user.uid),
        getGenres(user.uid),
        getSeries(user.uid),
        getWishlist(user.uid),
      ]);

      const genreIdMap = new Map<string, string>();
      let genresImported = 0;
      let genresSkipped = 0;

      // Import genres
      if (importGenres.length > 0) {
        setImportStatus('Importing genres...');
        for (const genre of importGenres) {
          const existing = existingGenres.find(g => g.name.toLowerCase() === genre.name.toLowerCase());
          if (existing) {
            genreIdMap.set(genre._exportId, existing.id);
            genresSkipped++;
          } else {
            const newId = await createGenre(user.uid, genre.name, genre.color);
            genreIdMap.set(genre._exportId, newId);
            genresImported++;
          }
        }
      }

      // Import series
      const seriesIdMap = new Map<string, string>();
      let seriesImported = 0;
      let seriesSkipped = 0;

      if (importSeries.length > 0) {
        setImportStatus('Importing series...');
        for (const s of importSeries) {
          const existing = existingSeries.find(es => es.name.toLowerCase() === s.name.toLowerCase());
          if (existing) {
            seriesIdMap.set(s._exportId, existing.id);
            seriesSkipped++;
          } else {
            const newId = await createSeries(user.uid, s.name, s.totalBooks);
            seriesIdMap.set(s._exportId, newId);
            seriesImported++;
          }
        }
      }

      // Import books
      let booksImported = 0;
      let booksSkipped = 0;
      const importedBookKeys = new Set<string>();

      if (importBooks.length > 0) {
        setImportStatus('Importing books...');
        for (const book of importBooks) {
          // Check for duplicates
          const isDuplicate = existingBooks.some(existing => {
            if (book.isbn && existing.isbn && book.isbn === existing.isbn) return true;
            if (book.title && existing.title &&
                book.title.toLowerCase() === existing.title.toLowerCase() &&
                (book.author || '').toLowerCase() === (existing.author || '').toLowerCase()) return true;
            return false;
          });

          if (isDuplicate) {
            booksSkipped++;
            continue;
          }

          // Remap genres
          const remappedGenres = (book.genres || []).map((oldId: string) => genreIdMap.get(oldId)).filter(Boolean);
          const remappedSeriesId = book.seriesId ? seriesIdMap.get(book.seriesId) || null : null;

          await addBook(user.uid, {
            ...book,
            genres: remappedGenres,
            seriesId: remappedSeriesId,
          });
          booksImported++;

          // Track for wishlist cross-check
          if (book.isbn) importedBookKeys.add(`isbn:${book.isbn}`);
          if (book.title) importedBookKeys.add(`title:${book.title.toLowerCase()}|${(book.author || '').toLowerCase()}`);
        }
      }

      // Import wishlist
      let wishlistImported = 0;
      let wishlistSkipped = 0;
      let wishlistSkippedOwned = 0;

      // Build owned books lookup
      const ownedBooksLookup = new Set<string>();
      for (const book of existingBooks) {
        if (book.isbn) ownedBooksLookup.add(`isbn:${book.isbn}`);
        if (book.title) ownedBooksLookup.add(`title:${book.title.toLowerCase()}|${(book.author || '').toLowerCase()}`);
      }
      for (const key of importedBookKeys) ownedBooksLookup.add(key);

      if (importWishlist.length > 0) {
        setImportStatus('Importing wishlist...');
        for (const item of importWishlist) {
          // Check for duplicates in existing wishlist
          const isDuplicate = existingWishlist.some(existing => {
            if (item.isbn && existing.isbn && item.isbn === existing.isbn) return true;
            if (item.title && existing.title &&
                item.title.toLowerCase() === existing.title.toLowerCase() &&
                (item.author || '').toLowerCase() === (existing.author || '').toLowerCase()) return true;
            return false;
          });

          if (isDuplicate) {
            wishlistSkipped++;
            continue;
          }

          // Skip if already owned
          const isOwned = (item.isbn && ownedBooksLookup.has(`isbn:${item.isbn}`)) ||
            (item.title && ownedBooksLookup.has(`title:${item.title.toLowerCase()}|${(item.author || '').toLowerCase()}`));

          if (isOwned) {
            wishlistSkippedOwned++;
            continue;
          }

          await addWishlistItem(user.uid, item);
          wishlistImported++;
        }
      }

      // Build summary
      const summaryLines: string[] = [];
      if (booksImported > 0) summaryLines.push(`books:${booksImported} added`);
      if (genresImported > 0) summaryLines.push(`genres:${genresImported} created`);
      if (seriesImported > 0) summaryLines.push(`series:${seriesImported} created`);
      if (wishlistImported > 0) summaryLines.push(`wishlist:${wishlistImported} added`);
      if (booksSkipped > 0) summaryLines.push(`books-skip:${booksSkipped} duplicate`);
      if (genresSkipped > 0) summaryLines.push(`genres-skip:${genresSkipped} existing`);
      if (seriesSkipped > 0) summaryLines.push(`series-skip:${seriesSkipped} existing`);
      if (wishlistSkipped > 0) summaryLines.push(`wishlist-skip:${wishlistSkipped} duplicate`);
      if (wishlistSkippedOwned > 0) summaryLines.push(`wishlist-owned:${wishlistSkippedOwned} already owned`);

      setImportSummary(summaryLines);
      setImportStatus(null);

      const totalImported = booksImported + genresImported + seriesImported + wishlistImported;
      if (totalImported > 0) {
        showToast('Import complete', { type: 'success' });
        await loadData(); // Refresh data
      } else {
        showToast('Nothing new to import', { type: 'info' });
      }
    } catch (err) {
      console.error('Import failed:', err);
      showToast('Import failed. Please check the file format and try again.', { type: 'error' });
      setImportStatus(null);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user, importing, showToast, loadData]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  }, [handleImport]);

  if (authLoading) {
    return (
      <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const usedColors = getUsedColors();
  const availableColors = GENRE_COLORS.filter((c) => !usedColors.has(c.toLowerCase()));

  return (
    <>
      <div id="library-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Library</h1>

        {/* Mobile Section Navigation (Pills) */}
        <nav className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar" aria-label="Jump to section">
          <div className="flex gap-2">
            <a
              href="#genres"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Genres
            </a>
            <a
              href="#series"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Series
            </a>
            <a
              href="#backup"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors min-h-[44px] inline-flex items-center"
            >
              Backup
            </a>
          </div>
        </nav>

        <div className="space-y-6">
          {/* Genres Section */}
          <section id="genres" className="scroll-mt-36">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Genres</h2>
              </div>
              <button
                onClick={openAddGenreModal}
                className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>

            {/* Genre List (Table) */}
            {genresLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                        </td>
                        <td className="py-1.5 px-1">
                          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : genres.length === 0 ? (
              <div className="py-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" aria-hidden="true" />
                <p className="text-gray-500 dark:text-gray-400 mt-3">No genres yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first genre to organise books</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {genres.map((genre) => (
                      <tr key={genre.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: genre.color }}
                              title={genre.name}
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{genre.name}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap text-right">
                          {genre.bookCount}
                        </td>
                        <td className="py-0 px-0 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditGenreModal(genre)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label={`Edit ${genre.name}`}
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => openMergeGenreModal(genre)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-gray-400 hover:text-blue-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label={`Merge ${genre.name}`}
                          >
                            <Combine className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setGenreDeleteConfirm(genre)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label={`Delete ${genre.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Genre Picker Setting */}
            <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Show suggestions first in picker</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Genre suggestions from public sources appear before your genres
                  </p>
                </div>
                <div className="relative flex-shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={pickerSettings.genreSuggestionsFirst}
                    onChange={(e) => handleGenreSuggestionsFirstChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </div>
              </label>
            </div>
          </section>

          {/* Series Section */}
          <section id="series" className="scroll-mt-36">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Series</h2>
              </div>
              <button
                onClick={openAddSeriesModal}
                className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>

            {/* Series List (Table) */}
            {seriesLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-3">
                          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                        </td>
                        <td className="py-1.5 px-1">
                          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : seriesList.length === 0 ? (
              <div className="py-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Library className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" aria-hidden="true" />
                <p className="text-gray-500 dark:text-gray-400 mt-3">No series yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add series to track book collections</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {seriesList.map((series) => (
                      <tr key={series.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-1.5 px-3">
                          <span className="text-sm text-gray-900 dark:text-gray-100">{series.name}</span>
                        </td>
                        <td className="py-1.5 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap text-right">
                          {series.totalBooks
                            ? `${series.bookCount}/${series.totalBooks}`
                            : series.bookCount}
                        </td>
                        <td className="py-0 px-0 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditSeriesModal(series)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label={`Edit ${series.name}`}
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => openMergeSeriesModal(series)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-gray-400 hover:text-blue-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label={`Merge ${series.name}`}
                          >
                            <Combine className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setSeriesDeleteConfirm(series)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                            aria-label={`Delete ${series.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Series Picker Setting */}
            <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Show suggestions first in picker</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Series suggestions from public sources appear before your series
                  </p>
                </div>
                <div className="relative flex-shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={pickerSettings.seriesSuggestionsFirst}
                    onChange={(e) => handleSeriesSuggestionsFirstChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </div>
              </label>
            </div>
          </section>

          {/* Backup & Restore Section */}
          <section id="backup" className="scroll-mt-36">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Backup & Restore</h2>

            {/* Export */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Export Backup</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Download all your books, genres, series, and wishlist as a JSON file.</p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Download Backup</span>
                  </>
                )}
              </button>
            </div>

            {/* Import */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Import Backup</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Restore books, genres, series, and wishlist from a backup file. Duplicates will be skipped.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Select Backup File</span>
                  </>
                )}
              </button>

              {/* Import Progress */}
              {importStatus && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{importStatus}</span>
                </div>
              )}

              {/* Import Summary */}
              {importSummary && importSummary.length > 0 && (
                <div className="mt-4 space-y-1">
                  {importSummary.map((line, i) => {
                    const [type, text] = line.split(':');
                    let icon = <BookOpen className="w-4 h-4 text-green-600" />;
                    let textClass = 'text-gray-700 dark:text-gray-300';

                    if (type === 'genres') icon = <Tag className="w-4 h-4 text-green-600" />;
                    else if (type === 'series') icon = <Library className="w-4 h-4 text-green-600" />;
                    else if (type === 'wishlist') icon = <Heart className="w-4 h-4 text-green-600" />;
                    else if (type.includes('-skip')) {
                      icon = <MinusCircle className="w-4 h-4 text-gray-400" />;
                      textClass = 'text-gray-500 dark:text-gray-400';
                    } else if (type === 'wishlist-owned') {
                      icon = <CheckCircle className="w-4 h-4 text-blue-500" />;
                      textClass = 'text-blue-600 dark:text-blue-400';
                    }

                    return (
                      <div key={i} className={`flex items-center gap-2 text-sm ${textClass}`}>
                        {icon}
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Genre Add/Edit Modal */}
      <BottomSheet
        isOpen={showGenreModal}
        onClose={closeGenreModal}
        title={editingGenre ? 'Edit Genre' : 'Add Genre'}
        closeOnBackdrop={!genreSaving}
        closeOnEscape={!genreSaving}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingGenre ? 'Edit Genre' : 'Add Genre'}
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="genre-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Genre Name <span className="text-red-500">*</span>
              </label>
              <input
                id="genre-name"
                type="text"
                value={genreName}
                onChange={(e) => setGenreName(e.target.value)}
                placeholder="e.g., Science Fiction"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Show color picker only when editing */}
            {editingGenre && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Colour</label>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700 p-2">
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const isSelected = color.toLowerCase() === genreColor.toLowerCase();
                      const textColor = getContrastColor(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setGenreColor(color)}
                          className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                            isSelected ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select ${color} colour${isSelected ? ' (selected)' : ''}`}
                          aria-pressed={isSelected}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 mx-auto" style={{ color: textColor }} aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={closeGenreModal}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGenre}
              disabled={!isGenreFormDirty() || genreSaving}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {genreSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Genre Delete Confirmation Modal */}
      <BottomSheet
        isOpen={!!genreDeleteConfirm}
        onClose={() => setGenreDeleteConfirm(null)}
        title="Delete Genre"
        closeOnBackdrop={!genreSaving}
        closeOnEscape={!genreSaving}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Genre</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {genreDeleteConfirm && genreDeleteConfirm.bookCount > 0 ? (
              <>
                This will remove &quot;{genreDeleteConfirm.name}&quot; from{' '}
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {genreDeleteConfirm.bookCount} book
                  {genreDeleteConfirm.bookCount !== 1 ? 's' : ''}
                </span>
                .
              </>
            ) : (
              <>Are you sure you want to delete &quot;{genreDeleteConfirm?.name}&quot;?</>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setGenreDeleteConfirm(null)}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGenre}
              disabled={genreSaving}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {genreSaving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Genre Merge Modal */}
      <BottomSheet
        isOpen={showMergeGenreModal && !!mergingGenre}
        onClose={closeMergeGenreModal}
        title="Merge Genre"
        closeOnBackdrop={!genreSaving}
        closeOnEscape={!genreSaving}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Merge Genre</h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Merge &quot;<span className="font-medium">{mergingGenre?.name}</span>&quot; into another genre. Books will be moved and the source genre will be deleted.
          </p>

          <div>
            <label htmlFor="merge-target" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Target Genre
            </label>
            <select
              id="merge-target"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a genre...</option>
              {genres
                .filter((g) => g.id !== mergingGenre?.id)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={closeMergeGenreModal}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleMergeGenre}
              disabled={!mergeTargetId || genreSaving}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {genreSaving ? 'Merging...' : 'Merge'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Series Add/Edit Modal */}
      <BottomSheet
        isOpen={showSeriesModal}
        onClose={closeSeriesModal}
        title={editingSeries ? 'Edit Series' : 'Add Series'}
        closeOnBackdrop={!seriesSaving}
        closeOnEscape={!seriesSaving}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingSeries ? 'Edit Series' : 'Add Series'}
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="series-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Series Name <span className="text-red-500">*</span>
              </label>
              <input
                id="series-name"
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="e.g., Harry Potter"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="series-total" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Books in Series
              </label>
              <input
                id="series-total"
                type="number"
                inputMode="numeric"
                value={seriesTotalBooks}
                onChange={(e) => setSeriesTotalBooks(e.target.value)}
                placeholder="e.g., 7"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional. Shows completion progress (e.g., 3/7). You can have more books than this total.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={closeSeriesModal}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSeries}
              disabled={!isSeriesFormDirty() || seriesSaving}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {seriesSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Series Delete Confirmation Modal */}
      <BottomSheet
        isOpen={!!seriesDeleteConfirm}
        onClose={() => setSeriesDeleteConfirm(null)}
        title="Delete Series"
        closeOnBackdrop={!seriesSaving}
        closeOnEscape={!seriesSaving}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Series</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {seriesDeleteConfirm && seriesDeleteConfirm.bookCount > 0 ? (
              <>
                This will remove &quot;{seriesDeleteConfirm.name}&quot; from{' '}
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {seriesDeleteConfirm.bookCount} book
                  {seriesDeleteConfirm.bookCount !== 1 ? 's' : ''}
                </span>
                .
              </>
            ) : (
              <>Are you sure you want to delete &quot;{seriesDeleteConfirm?.name}&quot;?</>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSeriesDeleteConfirm(null)}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSeries}
              disabled={seriesSaving}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {seriesSaving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Series Merge Modal */}
      <BottomSheet
        isOpen={showMergeSeriesModal && !!mergingSeries}
        onClose={closeMergeSeriesModal}
        title="Merge Series"
        closeOnBackdrop={!seriesSaving}
        closeOnEscape={!seriesSaving}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Merge Series</h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Merge &quot;<span className="font-medium">{mergingSeries?.name}</span>&quot; into another series. Books will be moved and the source series will be deleted.
          </p>

          <div>
            <label htmlFor="merge-series-target" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Target Series
            </label>
            <select
              id="merge-series-target"
              value={mergeSeriesTargetId}
              onChange={(e) => setMergeSeriesTargetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a series...</option>
              {seriesList
                .filter((s) => s.id !== mergingSeries?.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={closeMergeSeriesModal}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleMergeSeries}
              disabled={!mergeSeriesTargetId || seriesSaving}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {seriesSaving ? 'Merging...' : 'Merge'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
