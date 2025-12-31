// Books Page - List and manage user's book collection
import { BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'My Books',
};

export default function BooksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-content">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        <Link
          href="/books/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors btn-press min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Book</span>
        </Link>
      </div>

      {/* Empty State */}
      <div className="empty-state">
        <BookOpen className="empty-state-icon" />
        <h2 className="empty-state-title">No books yet</h2>
        <p className="empty-state-description">
          Start building your library by adding your first book.
        </p>
        <div className="empty-state-action">
          <Link
            href="/books/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors btn-press"
          >
            <Plus className="w-5 h-5" />
            Add Your First Book
          </Link>
        </div>
      </div>
    </div>
  );
}
