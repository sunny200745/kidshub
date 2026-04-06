import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Baby, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts';

export default function Login() {
  const { login, resetPassword, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">KidsHub</h1>
          </div>
          
          <h2 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight">
            Manage Your Daycare<br />With Confidence
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-md">
            The all-in-one platform for daycare owners and managers to streamline 
            operations, track activities, and communicate with parents.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Real-time attendance tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Activity logging & reports</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Parent communication hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-brand">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">KidsHub</span>
          </div>

          <div className="bg-white rounded-3xl shadow-soft-xl p-8 sm:p-10">
            {showForgotPassword ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-surface-900">Reset Password</h2>
                  <p className="text-surface-500 mt-2">
                    Enter your email to receive reset instructions
                  </p>
                </div>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-success-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900 mb-2">
                      Check your email
                    </h3>
                    <p className="text-surface-500 mb-6">
                      We've sent password reset instructions to {email}
                    </p>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetSent(false);
                      }}
                      className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Back to login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword}>
                    {error && (
                      <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
                        <p className="text-sm text-danger-600">{error}</p>
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-surface-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input pl-12"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full justify-center mb-4"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full text-center text-sm text-surface-500 hover:text-surface-700"
                    >
                      Back to login
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
                  <p className="text-surface-500 mt-2">
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={handleLogin}>
                  {error && (
                    <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
                      <p className="text-sm text-danger-600">{error}</p>
                    </div>
                  )}

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input pl-12"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input pl-12 pr-12"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500/20"
                      />
                      <span className="ml-2 text-sm text-surface-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-4 text-base font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-surface-100 text-center">
                  <p className="text-sm text-surface-500">
                    Don't have an account?{' '}
                    <a href="/register" className="font-medium text-brand-600 hover:text-brand-700">
                      Create an account
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-surface-400 mt-6">
            &copy; {new Date().getFullYear()} KidsHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
