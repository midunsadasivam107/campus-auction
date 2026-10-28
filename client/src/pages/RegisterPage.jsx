import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
  HiOutlineRefresh,
} from 'react-icons/hi';

function RegisterPage() {
  const [step, setStep] = useState(1); // 1 = Details form, 2 = OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    graduationYear: new Date().getFullYear() + 1,
  });
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Handle resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Step 1: Send OTP verification code to email
   */
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setErrorMsg('Please enter a valid campus email address');
      toast.error('Please enter a valid campus email address');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', {
        email: formData.email.trim().toLowerCase(),
      });

      toast.success(res.data.message || 'Verification code sent to your email! ✉️');
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send verification code';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  /**
   * Step 2: Verify OTP and complete student registration
   */
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        otp: cleanOtp,
        studentId: formData.studentId || undefined,
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
      });

      toast.success('Email verified! Account created successfully. 🎓');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === 1
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
            }`}
          >
            {step === 2 ? '✓' : '1'}
          </div>
          <div
            className={`w-12 h-0.5 rounded transition-colors ${
              step === 2 ? 'bg-red-600' : 'bg-zinc-800'
            }`}
          />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === 2
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            2
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-950/80 text-red-400 border border-red-800/60 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
            {step === 1 ? '🎓' : '✉️'}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === 1 ? 'Student Sign Up' : 'Verify Your Email'}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            {step === 1
              ? 'Join your campus marketplace to buy and sell used items'
              : `Enter the 6-digit code sent to ${formData.email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 text-red-300 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* ───────── STEP 1: Details Form ───────── */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <HiOutlineUser className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Rahul Kumar"
                  className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Campus Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <HiOutlineMail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@campus.edu"
                  className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Student ID <span className="text-zinc-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="CS2026-042"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Grad Year
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <HiOutlineAcademicCap className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    name="graduationYear"
                    min="2020"
                    max="2035"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    className="w-full pl-9 pr-2 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <HiOutlineLockClosed className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <HiOutlineLockClosed className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 text-sm mt-3 flex items-center justify-center gap-1.5"
            >
              {sendingOtp ? 'Sending verification code...' : 'Continue to Verification →'}
            </button>
          </form>
        )}

        {/* ───────── STEP 2: OTP Verification ───────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-5">
            <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl text-center">
              <p className="text-xs text-zinc-400 mb-1">Verification code sent to:</p>
              <p className="font-semibold text-white text-sm truncate">{formData.email}</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-red-400 hover:text-red-300 mt-2 font-medium inline-flex items-center gap-1"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Edit email or details
              </button>
            </div>

            {/* Dev helper pill */}
            {devOtp && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-300">
                  💡 Dev Code: <strong className="text-red-400 font-mono tracking-wider">{devOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-[11px]"
                >
                  Paste Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 text-center mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                autoFocus
                className="w-full py-3.5 px-4 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-center font-mono text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-inner"
              />
              <p className="text-center text-xs text-zinc-500 mt-2">
                ⏱️ Code valid for 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <HiOutlineShieldCheck className="w-5 h-5" />
              {submitting ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            {/* Resend Code Button & Timer */}
            <div className="text-center pt-2">
              {resendCooldown > 0 ? (
                <p className="text-xs text-zinc-500">
                  Resend code in <span className="text-zinc-300 font-medium font-mono">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp(null)}
                  disabled={sendingOtp}
                  className="text-xs text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1"
                >
                  <HiOutlineRefresh className="w-3.5 h-3.5" />
                  {sendingOtp ? 'Sending new code...' : 'Resend Verification Code'}
                </button>
              )}
            </div>
          </form>
        )}

        <p className="text-center text-sm text-zinc-400 mt-6">
          Already registered?{' '}
          <Link
            to="/login"
            className="text-red-500 hover:text-red-400 font-semibold"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
