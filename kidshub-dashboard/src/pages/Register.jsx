import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Phone, Building2, Shield, Clock, Users } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts';
import { ROLES } from '../constants/roles';

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
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-surface-400">Loading...</p>
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
        role: ROLES.OWNER,
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

  const benefits = [
    { icon: Shield, title: 'Secure & Compliant', desc: 'Enterprise-grade security for your data' },
    { icon: Clock, title: 'Save Time', desc: 'Automate daily administrative tasks' },
    { icon: Users, title: 'Parent Connect', desc: 'Keep families engaged and informed' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark themed branding */}
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
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">KO</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">KidsHub</h1>
              <p className="text-surface-400 text-sm">Owner Portal</p>
            </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Start Managing<br />
            <span className="text-gradient">Your Center Today</span>
          </h2>
          <p className="text-lg text-surface-400 mb-12 max-w-md">
            Join hundreds of daycare owners who trust KidsHub to streamline their operations.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{benefit.title}</h3>
                  <p className="text-surface-500 text-sm">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-brand">
              <span className="text-white font-bold">KO</span>
            </div>
            <div>
              <span className="text-xl font-bold text-surface-900">KidsHub</span>
              <span className="text-sm text-surface-500 block">Owner Portal</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-soft-xl p-8 sm:p-10 border border-surface-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-surface-900">Create your account</h2>
              <p className="text-surface-500 mt-2">
                {step === 1 ? 'Enter your personal details' : 'Set up your daycare center'}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= 1 ? 'bg-brand-500 text-white' : 'bg-surface-200 text-surface-500'}`}>
                1
              </div>
              <div className={`w-16 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-brand-500' : 'bg-surface-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= 2 ? 'bg-brand-500 text-white' : 'bg-surface-200 text-surface-500'}`}>
                2
              </div>
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
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-surface-400 mt-6">
            © {new Date().getFullYear()} KidsHub Owner Portal
          </p>
        </div>
      </div>
    </div>
  );
}
