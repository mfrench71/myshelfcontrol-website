/**
 * Test Utilities
 * Custom render function with providers
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ToastProvider } from '@/components/ui/toast';

// All providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
}

function AllProviders({ children }: AllProvidersProps): ReactElement {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Helper to wait for async updates
export async function waitForAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Helper to create mock event
export function createMockEvent<T = HTMLElement>(
  overrides: Partial<React.SyntheticEvent<T>> = {}
): React.SyntheticEvent<T> {
  return {
    preventDefault: () => {},
    stopPropagation: () => {},
    target: {} as EventTarget & T,
    currentTarget: {} as EventTarget & T,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    nativeEvent: {} as Event,
    persist: () => {},
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    timeStamp: Date.now(),
    type: 'click',
    ...overrides,
  } as React.SyntheticEvent<T>;
}

// Helper to create mock keyboard event
export function createMockKeyboardEvent(
  key: string,
  overrides: Partial<React.KeyboardEvent> = {}
): React.KeyboardEvent {
  return {
    ...createMockEvent(),
    key,
    code: key,
    keyCode: key.charCodeAt(0),
    which: key.charCodeAt(0),
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    getModifierState: () => false,
    ...overrides,
  } as React.KeyboardEvent;
}

// Helper to create mock change event
export function createMockChangeEvent(
  value: string
): React.ChangeEvent<HTMLInputElement> {
  return {
    ...createMockEvent<HTMLInputElement>(),
    target: { value } as EventTarget & HTMLInputElement,
  } as React.ChangeEvent<HTMLInputElement>;
}
