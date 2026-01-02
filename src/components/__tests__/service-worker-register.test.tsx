/**
 * Unit Tests for components/service-worker-register.tsx
 * Tests for service worker registration component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ServiceWorkerRegister } from '../service-worker-register';

describe('ServiceWorkerRegister', () => {
  const originalNavigator = global.navigator;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    process.env.NODE_ENV = originalEnv;
  });

  describe('rendering', () => {
    it('renders null (no visible content)', () => {
      const { container } = render(<ServiceWorkerRegister />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('service worker registration', () => {
    it('does not register service worker when not in production', () => {
      const mockRegister = vi.fn();
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
          },
        },
        writable: true,
      });

      // NODE_ENV is 'test' by default in vitest
      render(<ServiceWorkerRegister />);

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('does not register when serviceWorker is not supported', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      // Should not throw
      expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    });

    it('registers service worker in production environment', async () => {
      const mockAddEventListener = vi.fn();
      const mockRegistration = {
        scope: '/test-scope/',
        addEventListener: mockAddEventListener,
      };
      const mockRegister = vi.fn().mockResolvedValue(mockRegistration);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            controller: null,
          },
        },
        writable: true,
      });

      // Simulate production
      process.env.NODE_ENV = 'production';

      render(<ServiceWorkerRegister />);

      // Wait for async registration
      await vi.waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('/sw.js');
      });

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Service Worker registered with scope:',
          '/test-scope/'
        );
      });

      consoleSpy.mockRestore();
    });

    it('handles registration failure gracefully', async () => {
      const mockError = new Error('Registration failed');
      const mockRegister = vi.fn().mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
          },
        },
        writable: true,
      });

      process.env.NODE_ENV = 'production';

      render(<ServiceWorkerRegister />);

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Service Worker registration failed:',
          mockError
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('listens for updatefound event after registration', async () => {
      const mockAddEventListener = vi.fn();
      const mockRegistration = {
        scope: '/',
        addEventListener: mockAddEventListener,
        installing: null,
      };
      const mockRegister = vi.fn().mockResolvedValue(mockRegistration);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            controller: null,
          },
        },
        writable: true,
      });

      process.env.NODE_ENV = 'production';

      render(<ServiceWorkerRegister />);

      await vi.waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith(
          'updatefound',
          expect.any(Function)
        );
      });
    });

    it('handles new worker state change to installed', async () => {
      let updateFoundCallback: (() => void) | null = null;
      let stateChangeCallback: (() => void) | null = null;

      const mockNewWorker = {
        state: 'installed',
        addEventListener: vi.fn((event: string, cb: () => void) => {
          if (event === 'statechange') stateChangeCallback = cb;
        }),
      };

      const mockRegistration = {
        scope: '/',
        installing: mockNewWorker,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          if (event === 'updatefound') updateFoundCallback = cb;
        }),
      };

      const mockRegister = vi.fn().mockResolvedValue(mockRegistration);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            controller: {}, // Existing controller = update scenario
          },
        },
        writable: true,
      });

      process.env.NODE_ENV = 'production';

      render(<ServiceWorkerRegister />);

      await vi.waitFor(() => {
        expect(updateFoundCallback).not.toBeNull();
      });

      // Trigger updatefound
      updateFoundCallback!();

      // Trigger state change
      stateChangeCallback!();

      expect(consoleSpy).toHaveBeenCalledWith('New content available, please refresh.');

      consoleSpy.mockRestore();
    });
  });
});
