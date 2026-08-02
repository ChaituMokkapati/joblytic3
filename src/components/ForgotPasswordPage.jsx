import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import AmbMonogramLogo from './AmbMonogramLogo';
import { forgotPassword, resetPassword } from '../api/jobsApi';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.toLowerCase().trim());
      setStep(2);
    } catch (err) {
      setError(err.message || 'Could not reach server. Make sure backend is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.toLowerCase().trim(), otp.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Invalid OTP or server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">

      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#800020]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl shadow-[#800020]/10 relative z-10">

        {/* Logo + Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/login" className="mb-4 group">
            <AmbMonogramLogo size={64} useImage={false} className="border-2 border-[#D4AF37] group-hover:scale-105 transition-transform" />
          </Link>
          <h2 className="text-2xl font-serif font-bold text-white">
            {success ? '✅ Password Reset!' : step === 1 ? 'Forgot Password' : 'Enter OTP & New Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {success
              ? 'Your password has been updated. You can now log in.'
              : step === 1
              ? 'Enter your registered email to receive a 6-digit OTP.'
              : `OTP sent to ${email}. Check your backend terminal console.`}
          </p>
        </div>

        {/* Step Indicators */}
        {!success && (
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-[#D4AF37]' : 'text-slate-600'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step >= 1 ? 'bg-[#800020] border-[#D4AF37] text-[#D4AF37]' : 'border-slate-700 text-slate-600'}`}>1</span>
              <span>Send OTP</span>
            </div>
            <div className="flex-1 h-px bg-slate-700" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? 'text-[#D4AF37]' : 'text-slate-600'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === 2 ? 'bg-[#800020] border-[#D4AF37] text-[#D4AF37]' : 'border-slate-700 text-slate-600'}`}>2</span>
              <span>Reset Password</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success ? (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-[#800020] text-[#F5F1E8] font-semibold text-sm border border-[#D4AF37]/60 hover:bg-[#600018] transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Back to Login
            </Link>
          </div>

        ) : step === 1 ? (
          /* Step 1 — Email Input */
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#800020] text-[#F5F1E8] font-semibold text-sm border border-[#D4AF37]/60 shadow-lg hover:bg-[#600018] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" /><span>Sending OTP...</span></>
                : <><span>Send OTP</span><ArrowRight className="w-4 h-4 text-[#D4AF37]" /></>}
            </button>
          </form>

        ) : (
          /* Step 2 — OTP + New Password */
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1.5">6-Digit OTP</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-white placeholder-slate-600 font-mono tracking-widest transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Check the backend terminal console for your OTP.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border outline-none text-sm text-white placeholder-slate-600 transition-all focus:ring-2 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-700 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
                className="flex-none py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#800020] text-[#F5F1E8] font-semibold text-sm border border-[#D4AF37]/60 shadow-lg hover:bg-[#600018] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" /><span>Resetting...</span></>
                  : <><span>Reset Password</span><ArrowRight className="w-4 h-4 text-[#D4AF37]" /></>}
              </button>
            </div>
          </form>
        )}

        {/* Back to Login */}
        {!success && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
