// Login Page - Authentication page for sign in/register
'use client';

import { useState, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';
import { checkPasswordStrength } from '@/lib/utils';
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Login form component that uses searchParams
 * Must be wrapped in Suspense
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerPassword, setRegisterPassword] = useState('');

  const loginFormRef = useRef<HTMLFormElement>(null);
  const registerFormRef = useRef<HTMLFormElement>(null);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!registerPassword) return null;
    return checkPasswordStrength(registerPassword);
  }, [registerPassword]);

  // Strength bar colours and labels
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthTextColors = ['text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-500'];

  /**
   * Create session cookie via API route
   */
  const createSession = async (idToken: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      return response.ok;
    } catch {
      console.error('Failed to create session');
      return false;
    }
  };

  /**
   * Handle form submission for login or registration
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate confirm password for registration
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      let userCredential;

      if (isLogin) {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Create new account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      // Get ID token and create session cookie
      const idToken = await userCredential.user.getIdToken();
      const sessionCreated = await createSession(idToken);

      if (!sessionCreated) {
        setError('Failed to create session. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to intended page or home
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      // Handle Firebase auth errors
      const errorCode = (err as { code?: string }).code || '';
      setError(getAuthErrorMessage(errorCode));
      setLoading(false);
    }
  };

  /**
   * Switch between login and register modes
   * Clears form state, errors, and password strength
   */
  const switchMode = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError(null);
    setShowPassword(false);
    setRegisterPassword('');
    loginFormRef.current?.reset();
    registerFormRef.current?.reset();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      {/* Logo */}
      <div className="flex items-center gap-2 text-primary mb-8">
        <BookOpen className="w-10 h-10" />
        <span className="text-2xl font-bold">MyShelfControl</span>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-6">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form
          id="login-form"
          ref={loginFormRef}
          onSubmit={handleSubmit}
          className={`space-y-4 ${isLogin ? '' : 'hidden'}`}
        >
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={8}
                disabled={loading}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 disabled:cursor-not-allowed"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Register Form */}
        <form
          id="register-form"
          ref={registerFormRef}
          onSubmit={handleSubmit}
          className={`space-y-4 ${isLogin ? 'hidden' : ''}`}
        >
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 disabled:cursor-not-allowed"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full ${
                        index < passwordStrength.score
                          ? strengthColors[Math.min(passwordStrength.score - 1, 3)]
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.score > 0 && (
                  <p className={`text-xs ${strengthTextColors[Math.min(passwordStrength.score - 1, 3)]}`}>
                    {strengthLabels[Math.min(passwordStrength.score - 1, 3)]}
                  </p>
                )}
              </div>
            )}
            {/* Password Requirements */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span className={passwordStrength?.checks.length ? 'text-green-500' : 'text-gray-500'}>
                8+ chars
              </span>
              <span className={passwordStrength?.checks.uppercase ? 'text-green-500' : 'text-gray-500'}>
                1 uppercase
              </span>
              <span className={passwordStrength?.checks.number ? 'text-green-500' : 'text-gray-500'}>
                1 number
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="register-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="register-password-confirm"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                id="show-register-btn"
                type="button"
                onClick={() => switchMode(false)}
                disabled={loading}
                className="text-primary hover:text-primary-dark font-medium disabled:cursor-not-allowed"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                id="show-login-btn"
                type="button"
                onClick={() => switchMode(true)}
                disabled={loading}
                className="text-primary hover:text-primary-dark font-medium disabled:cursor-not-allowed"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-500">
        <Link href="/privacy" className="hover:text-gray-700">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

/**
 * Login page with Suspense wrapper for useSearchParams
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
        <div className="flex items-center gap-2 text-primary mb-8">
          <BookOpen className="w-10 h-10" />
          <span className="text-2xl font-bold">MyShelfControl</span>
        </div>
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
