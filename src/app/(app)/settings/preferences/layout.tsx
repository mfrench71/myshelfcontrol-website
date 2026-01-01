import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preferences',
};

export default function PreferencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
