// App Layout - Layout for authenticated pages with header
import { Header } from '@/components/ui/header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
