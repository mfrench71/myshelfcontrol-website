import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Details',
};

export default function BookDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
