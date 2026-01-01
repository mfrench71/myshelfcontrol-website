import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bin',
};

export default function BinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
