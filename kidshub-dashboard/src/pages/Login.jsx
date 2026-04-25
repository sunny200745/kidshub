import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Baby, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, LayoutDashboard, Users, Calendar, BarChart3 } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-surface-400">Loading...</p>
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

  const features = [
    { icon: LayoutDashboard, title: 'Dashboard Overview', desc: 'Real-time insights at a glance' },
    { icon: Users, title: 'Staff Management', desc: 'Organize your team efficiently' },
    { icon: Calendar, title: 'Scheduling', desc: 'Plan activities and routines' },
    { icon: BarChart3, title: 'Reports & Analytics', desc: 'Track progress and trends' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark themed branding for owners */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <img
              src="/kidshub-logo.svg"
              alt="KidsHub"
              className="w-14 h-14 rounded-2xl shadow-brand"
              width="56"
              height="56"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">KidsHub</h1>
              <p className="text-surface-400 text-sm">Owner Portal</p>
            </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Manage Your<br />
            <span className="text-gradient">Daycare Center</span>
          </h2>
          <p className="text-lg text-surface-400 mb-12 max-w-md">
            The complete management platform for daycare owners and administrators.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:bg-surface-800 transition-colors">
                <feature.icon className="w-8 h-8 text-brand-400 mb-3" />
                <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                <p className="text-surface-500 text-xs mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*
        Right Side - Login Form.

        We give this column its own themed background (brand-tinted
        gradient + decorative blurred blobs) for two reasons:

        1. On mobile/tablet (< lg) the desktop dark-hero on the left
           is hidden, so this column IS the entire screen. A flat
           bg-surface-50 there read as "default scaffolding" next to
           the rest of the parent/teacher app. Themed bg fixes that.

        2. On desktop (>= lg) the same chrome adds a subtle pink wash
           behind the white card, softening the hard cut between the
           dark left hero and the bright right form without competing
           with either.

        The blobs use overflow-hidden on the parent so they can extend
        past the column edges without bleeding into the dark hero.
      */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50">
        {/* Decorative blobs — purely visual; pointer-events:none so
            they never intercept clicks on the form. Mirror the desktop
            hero's pink/purple blob recipe so the brand language stays
            consistent across screen sizes. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-300/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-300/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-brand-200/40 blur-2xl"
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo — bigger and more graphic on small screens
              now that this column is the full viewport. The chip-style
              white tile with brand shadow matches the look of the
              parent/teacher app's loading splash so the brand mark
              feels like one consistent element across surfaces. */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-brand-lg flex items-center justify-center mb-4">
              <img
                src="/kidshub-logo.svg"
                alt="KidsHub"
                className="w-14 h-14 rounded-xl"
                width="56"
                height="56"
              />
            </div>
            <span className="text-2xl font-bold text-surface-900">KidsHub</span>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-xs font-medium text-brand-700">
              Owner Portal
            </span>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 sm:p-10 border border-brand-100/70">
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
                    Sign in to your owner account
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
                    <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                      Register your center
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-surface-400 mt-6">
            © {new Date().getFullYear()} KidsHub Owner Portal
          </p>
        </div>
      </div>
    </div>
  );
}
