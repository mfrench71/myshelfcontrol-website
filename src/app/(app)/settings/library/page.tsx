/**
 * Library Settings Page
 * Manage genres, series, and backup/restore
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Tag, Layers, Download, Upload, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getGenres, createGenre, updateGenre, deleteGenre } from '@/lib/repositories/genres';
import { getBooks } from '@/lib/repositories/books';
import { getContrastColor, getNextAvailableColor, GENRE_COLORS } from '@/lib/utils';
import type { Genre, Book } from '@/lib/types';

/** Genre with book count */
type GenreWithCount = Genre & { bookCount: number };

export default function LibrarySettingsPage() {
  const { user, loading: authLoading } = useAuthContext();

  // Genre state
  const [genres, setGenres] = useState<GenreWithCount[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreColor, setNewGenreColor] = useState('');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load genres with book counts
  const loadGenres = useCallback(async () => {
    if (!user) return;

    try {
      setGenresLoading(true);
      const [userGenres, books] = await Promise.all([
        getGenres(user.uid),
        getBooks(user.uid),
      ]);

      // Count books per genre
      const genreCounts = countBooksPerGenre(books);

      const genresWithCounts: GenreWithCount[] = userGenres.map((genre) => ({
        ...genre,
        bookCount: genreCounts[genre.id] || 0,
      }));

      setGenres(genresWithCounts);
    } catch (error) {
      console.error('Failed to load genres:', error);
    } finally {
      setGenresLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  // Count books per genre
  function countBooksPerGenre(books: Book[]): Record<string, number> {
    const counts: Record<string, number> = {};
    books.forEach((book) => {
      (book.genres || []).forEach((genreId) => {
        counts[genreId] = (counts[genreId] || 0) + 1;
      });
    });
    return counts;
  }

  // Handle add genre
  const handleAddGenre = async () => {
    if (!user || !newGenreName.trim() || saving) return;

    setSaving(true);
    try {
      const color = newGenreColor || getNextAvailableColor(genres.map((g) => g.color));
      await createGenre(user.uid, newGenreName.trim(), color);
      setNewGenreName('');
      setNewGenreColor('');
      setShowAddForm(false);
      await loadGenres();
    } catch (error) {
      console.error('Failed to create genre:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit genre
  const handleEditGenre = async () => {
    if (!user || !editingGenre || !editName.trim() || saving) return;

    setSaving(true);
    try {
      await updateGenre(user.uid, editingGenre.id, {
        name: editName.trim(),
        color: editColor,
      });
      setEditingGenre(null);
      await loadGenres();
    } catch (error) {
      console.error('Failed to update genre:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete genre
  const handleDeleteGenre = async (genreId: string) => {
    if (!user || saving) return;

    setSaving(true);
    try {
      await deleteGenre(user.uid, genreId);
      setDeleteConfirm(null);
      await loadGenres();
    } catch (error) {
      console.error('Failed to delete genre:', error);
    } finally {
      setSaving(false);
    }
  };

  // Start editing a genre
  const startEditGenre = (genre: Genre) => {
    setEditingGenre(genre);
    setEditName(genre.name);
    setEditColor(genre.color);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingGenre(null);
    setEditName('');
    setEditColor('');
  };

  // Start adding
  const startAddGenre = () => {
    setShowAddForm(true);
    setNewGenreColor(getNextAvailableColor(genres.map((g) => g.color)));
  };

  if (authLoading) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                  Settings
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Library</li>
            </ol>
          </nav>
        </div>
      </div>

      <div id="library-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Library</h1>

        <div className="space-y-6">
          {/* Genres Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-gray-600" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-gray-900">Genres</h2>
              </div>
              <button
                onClick={startAddGenre}
                className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>

            {/* Add Genre Form */}
            {showAddForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label htmlFor="new-genre-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Genre Name
                    </label>
                    <input
                      id="new-genre-name"
                      type="text"
                      value={newGenreName}
                      onChange={(e) => setNewGenreName(e.target.value)}
                      placeholder="e.g., Science Fiction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="w-20">
                    <label htmlFor="new-genre-color" className="block text-sm font-medium text-gray-700 mb-1">
                      Colour
                    </label>
                    <input
                      id="new-genre-color"
                      type="color"
                      value={newGenreColor}
                      onChange={(e) => setNewGenreColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={handleAddGenre}
                    disabled={!newGenreName.trim() || saving}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewGenreName('');
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 min-h-[44px]"
                    aria-label="Cancel"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Genre List */}
            {genresLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : genres.length === 0 ? (
              <div className="py-8 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
                <p className="text-gray-500 mt-3">No genres yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first genre to organise books</p>
              </div>
            ) : (
              <div className="space-y-2">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {editingGenre?.id === genre.id ? (
                      /* Edit Mode */
                      <>
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          onClick={handleEditGenre}
                          disabled={!editName.trim() || saving}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Save changes"
                        >
                          <Check className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Cancel editing"
                        >
                          <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </>
                    ) : deleteConfirm === genre.id ? (
                      /* Delete Confirmation */
                      <>
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: genre.color }}
                        />
                        <span className="flex-1 text-sm text-gray-700">
                          Delete &quot;{genre.name}&quot;?
                          {genre.bookCount > 0 && (
                            <span className="text-amber-600 ml-1">
                              ({genre.bookCount} {genre.bookCount === 1 ? 'book' : 'books'} will be affected)
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => handleDeleteGenre(genre.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors min-h-[44px]"
                        >
                          {saving ? '...' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm rounded-lg transition-colors min-h-[44px]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      /* Normal View */
                      <>
                        <span
                          className="inline-flex items-center py-1 px-2.5 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: genre.color,
                            color: getContrastColor(genre.color),
                          }}
                        >
                          {genre.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {genre.bookCount} {genre.bookCount === 1 ? 'book' : 'books'}
                        </span>
                        <div className="flex-1" />
                        <button
                          onClick={() => startEditGenre(genre)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={`Edit ${genre.name}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(genre.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={`Delete ${genre.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Series Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Series</h2>
            </div>
            <p className="text-gray-500 mb-4">Manage your book series</p>
            <p className="text-sm text-gray-400 italic">Series management coming soon</p>
          </div>

          {/* Backup Section */}
          <div id="backup" className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Backup & Restore</h2>
            </div>
            <p className="text-gray-500 mb-4">Export or import your library data</p>
            <div className="flex flex-wrap gap-3">
              <button
                id="export-btn"
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export Data</span>
              </button>
              <button
                id="import-btn"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors min-h-[44px]"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Import Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
