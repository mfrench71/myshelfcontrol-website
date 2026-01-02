import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

/**
 * Auth Layout - Forces light mode regardless of user preference
 * Login/signup pages should always use light theme for consistency
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="light-mode-only" style={{ colorScheme: 'light' }}>
      {children}
    </div>
  );
}
