/**
 * Landing Page - Promotional page for logged-out users
 * Logged-in users are redirected to /dashboard by middleware
 */
import Link from 'next/link';
import Image from 'next/image';
import { Library, Star, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image
            src="/branding/logo-icon.svg"
            alt=""
            width={48}
            height={48}
            className="w-12 h-12"
            aria-hidden="true"
            priority
            unoptimized
          />
          <h1 className="text-4xl">
            <span className="font-bold text-slate-800">book</span>
            <span className="font-normal text-blue-500">assembly</span>
          </h1>
        </div>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your library, assembled.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white text-lg font-medium rounded-lg transition-colors"
        >
          Get Started
        </Link>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Library className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Organise Your Library</h3>
            <p className="text-gray-600 text-sm">
              Catalogue your books with genres, series, and custom tags.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Your Progress</h3>
            <p className="text-gray-600 text-sm">
              Log reading dates, track what you&apos;re currently reading, and see your stats.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Rate and Review</h3>
            <p className="text-gray-600 text-sm">
              Give your books ratings and keep notes for future reference.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-200">
        <Link href="/support" className="text-sm text-gray-500 hover:text-gray-700">
          Support
        </Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
