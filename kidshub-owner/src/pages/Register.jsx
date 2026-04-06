import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Baby, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Phone, Building2 } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts';

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    centerName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

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
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.centerName.trim()) {
      setError('Daycare center name is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        centerName: formData.centerName,
        role: 'owner',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'centers', user.uid), {
        ownerId: user.uid,
        name: formData.centerName,
        email: formData.email,
        phone: formData.phone || null,
        address: null,
        settings: {
          timezone: 'America/New_York',
          operatingHours: {
            monday: { open: '07:00', close: '18:00', closed: false },
            tuesday: { open: '07:00', close: '18:00', closed: false },
            wednesday: { open: '07:00', close: '18:00', closed: false },
            thursday: { open: '07:00', close: '18:00', closed: false },
            friday: { open: '07:00', close: '18:00', closed: false },
            saturday: { open: '08:00', close: '14:00', closed: true },
            sunday: { open: '08:00', close: '14:00', closed: true },
          },
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError('An error occurred during registration. Please try again.');
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
            Start Managing Your<br />Daycare Today
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-md">
            Join thousands of daycare owners who trust KidsHub to manage their 
            centers efficiently and keep parents connected.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">No credit card required</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Setup in minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-surface-900">Create your account</h2>
              <p className="text-surface-500 mt-2">
                {step === 1 ? 'Enter your personal details' : 'Set up your daycare center'}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-brand-500' : 'bg-surface-200'}`} />
              <div className={`w-12 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-brand-500' : 'bg-surface-200'}`} />
              <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-brand-500' : 'bg-surface-200'}`} />
            </div>

            <form onSubmit={step === 2 ? handleRegister : (e) => { e.preventDefault(); handleNextStep(); }}>
              {error && (
                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
                  <p className="text-sm text-danger-600">{error}</p>
                </div>
              )}

              {step === 1 ? (
                <>
                  {/* Step 1: Personal Info */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-surface-400" />
                        </div>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="input pl-12"
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="input"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input pl-12"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Phone Number <span className="text-surface-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input pl-12"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center py-4 text-base font-semibold"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </>
              ) : (
                <>
                  {/* Step 2: Center & Password */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Daycare Center Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type="text"
                        name="centerName"
                        value={formData.centerName}
                        onChange={handleChange}
                        className="input pl-12"
                        placeholder="Little Stars Daycare"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input pl-12 pr-12"
                        placeholder="Create a password"
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
                    <p className="text-xs text-surface-400 mt-1">Must be at least 6 characters</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input pl-12 pr-12"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-400 hover:text-surface-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        required
                        className="w-4 h-4 mt-0.5 rounded border-surface-300 text-brand-500 focus:ring-brand-500/20"
                      />
                      <span className="text-sm text-surface-600">
                        I agree to the{' '}
                        <a href="#" className="text-brand-600 hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-secondary flex-1 justify-center py-4"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-[2] justify-center py-4 text-base font-semibold"
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-surface-100 text-center">
              <p className="text-sm text-surface-500">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-brand-600 hover:text-brand-700">
                  Sign in
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-surface-400 mt-6">
            &copy; {new Date().getFullYear()} KidsHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
