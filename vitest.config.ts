import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/utils/index.ts',
        'src/lib/utils/auth-errors.ts',
        'src/lib/utils/duplicate-checker.ts',
        'src/lib/utils/library-health.ts',
        'src/lib/utils/book-api.ts',
        'src/lib/utils/image-upload.ts',
        'src/lib/utils/profile-photo.ts',
        'src/lib/schemas/auth.ts',
        'src/lib/schemas/book.ts',
        'src/lib/schemas/genre.ts',
        'src/lib/schemas/series.ts',
        'src/lib/schemas/wishlist.ts',
        'src/lib/repositories/books.ts',
        'src/lib/repositories/genres.ts',
        'src/lib/repositories/series.ts',
        'src/lib/repositories/wishlist.ts',
        'src/lib/repositories/widget-settings.ts',
        'src/lib/hooks/use-auth.ts',
        'src/lib/hooks/use-body-scroll-lock.ts',
        'src/components/ui/book-cover.tsx',
        'src/components/ui/toast.tsx',
        'src/components/ui/modal.tsx',
        'src/components/ui/search-overlay.tsx',
        'src/components/ui/collapsible-section.tsx',
        'src/components/books/book-card.tsx',
        'src/components/books/filter-panel.tsx',
        'src/components/books/reading-activity.tsx',
        'src/lib/utils/book-filters.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**/*',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 75,
        branches: 60,
        functions: 75,
        lines: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
