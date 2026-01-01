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
        'src/lib/schemas/auth.ts',
        'src/lib/repositories/books.ts',
        'src/lib/repositories/genres.ts',
        'src/lib/repositories/series.ts',
        'src/lib/repositories/wishlist.ts',
        'src/components/ui/book-cover.tsx',
        'src/components/ui/toast.tsx',
        'src/components/books/book-card.tsx',
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
