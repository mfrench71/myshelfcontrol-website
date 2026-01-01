import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Book',
};

export default function EditBookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
