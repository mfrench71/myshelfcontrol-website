// Firebase Auth Error Messages
// Maps Firebase error codes to user-friendly messages

/**
 * Map Firebase Auth error codes to user-friendly messages
 * @param errorCode - Firebase error code (e.g., 'auth/invalid-email')
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    // Sign in errors
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',

    // Sign up errors
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/operation-not-allowed': 'Email/password sign up is not enabled.',

    // Network errors
    'auth/network-request-failed': 'Network error. Please check your connection.',

    // Generic fallback
    'auth/internal-error': 'Something went wrong. Please try again.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}
