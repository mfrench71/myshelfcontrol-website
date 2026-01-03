/**
 * 404 Not Found Page
 * Displayed when a route doesn't exist
 */
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
      >
        <Image
          src="/branding/logo-icon.svg"
          alt=""
          width={40}
          height={40}
          className="w-10 h-10"
          aria-hidden="true"
          priority
          unoptimized
        />
        <span className="text-2xl">
          <span className="font-bold text-slate-800">book</span>
          <span className="font-normal text-blue-500">assembly</span>
        </span>
      </Link>

      {/* Content */}
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          Go home
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-16 text-sm text-gray-500">
        <Link href="/support" className="hover:text-gray-700">
          Support
        </Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/terms" className="hover:text-gray-700">
          Terms
        </Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/privacy" className="hover:text-gray-700">
          Privacy
        </Link>
      </p>
    </div>
  );
}
