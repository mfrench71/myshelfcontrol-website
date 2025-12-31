// Home Page - Dashboard for authenticated users
'use client';

import { useAuthContext } from '@/components/providers/auth-provider';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-content">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {user ? `Welcome back!` : 'Welcome to MyShelfControl'}
        </h1>
        <p className="text-gray-600 mt-1">
          {user
            ? 'Track your reading journey and organise your collection.'
            : 'Sign in to start tracking your books.'}
        </p>
      </div>

      {/* Quick Actions */}
      {user ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/books"
            className="book-card hover:border-primary group"
          >
            <div className="book-cover-placeholder">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                My Books
              </h3>
              <p className="text-sm text-gray-500">
                View and manage your collection
              </p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-700 mt-4">
            Get Started
          </h2>
          <p className="text-gray-500 mt-2">
            Create an account or sign in to start tracking your books.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors btn-press"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
