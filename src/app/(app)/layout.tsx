// App Layout - Layout for authenticated pages with header and footer
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main id="main-content" className="flex-1 page-content">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
