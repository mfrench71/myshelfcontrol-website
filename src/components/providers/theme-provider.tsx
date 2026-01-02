// Theme Provider - Context wrapper for dark/light mode
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

/**
 * Check if current path is a public page (login, privacy, etc.)
 * Public pages always use light mode regardless of user preference
 */
function isPublicPath(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/privacy');
}

/**
 * Check if we should force light mode (public pages or unauthenticated on home)
 */
function shouldForceLightMode(pathname: string): boolean {
  if (isPublicPath(pathname)) return true;

  // Check for auth cookie on home page
  if (pathname === '/' && typeof document !== 'undefined') {
    const isAuthenticated = document.cookie.indexOf('auth=') !== -1;
    if (!isAuthenticated) return true;
  }

  return false;
}

/**
 * Get the system's preferred colour scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme class to document element
 */
function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);

  // Update theme-color meta tag for PWA
  const themeColor = resolvedTheme === 'dark' ? '#111827' : '#ffffff';
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColor);
  } else {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    metaThemeColor.setAttribute('content', themeColor);
    document.head.appendChild(metaThemeColor);
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app and provides theme state
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Check if we should force light mode (public pages or unauthenticated on home)
  const forceLight = shouldForceLightMode(pathname);

  // Resolve theme based on preference and system setting
  const resolveTheme = useCallback((themeValue: Theme): ResolvedTheme => {
    if (themeValue === 'system') {
      return getSystemTheme();
    }
    return themeValue;
  }, []);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    // Only apply theme if not forcing light mode
    if (!shouldForceLightMode(window.location.pathname)) {
      applyTheme(resolved);
    }
  }, [resolveTheme]);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme = stored || 'system';
    setThemeState(initialTheme);
    const resolved = resolveTheme(initialTheme);
    setResolvedTheme(resolved);
    // Only apply theme if not forcing light mode
    if (!forceLight) {
      applyTheme(resolved);
    } else {
      // Force light mode
      applyTheme('light');
    }
  }, [resolveTheme, forceLight]);

  // Listen for system theme changes
  useEffect(() => {
    // Don't listen for system changes when forcing light mode
    if (forceLight) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, forceLight]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context (must be used within ThemeProvider)
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
