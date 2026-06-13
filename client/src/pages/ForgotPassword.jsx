import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (supabaseError) throw supabaseError;

      // Always show success even if email not found (security best practice)
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE — email sent
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
        {/* Background blobs for premium glassmorphism */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
            Check your email
          </h1>
          <p className="text-slate-400 text-sm mb-2">
            We sent a password reset link to:
          </p>
          <p className="text-white font-bold mb-6 truncate px-2">
            {email}
          </p>
          <p className="text-slate-500 text-xs mb-8 leading-relaxed">
            Didn't receive it? Check your spam folder or wait a few minutes. 
            The link expires in 1 hour.
          </p>

          <Button
            variant="secondary"
            onClick={() => { setSent(false); setEmail(''); }}
            className="w-full mb-3 bg-slate-950 text-slate-350 border border-slate-800 hover:bg-slate-900 focus:ring-slate-800"
          >
            Try a different email
          </Button>

          <Link
            to="/login"
            className="block w-full text-center text-indigo-400 hover:text-indigo-350 font-bold text-xs mt-4 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // FORM STATE
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-350 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        {/* Icon */}
        <div className="w-14 h-14 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
          <Mail className="w-7 h-7 text-indigo-500" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          No worries! Enter your email address and we'll send you 
          a link to reset your password.
        </p>

        {/* Error notification block */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-500 text-xs font-semibold flex items-start">
            <ShieldAlert className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email field */}
          <FormField label="Email Address" required>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 h-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  error 
                    ? 'border-rose-900/50 bg-rose-950/20 focus:ring-rose-500' 
                    : 'border-slate-800 bg-slate-950 text-slate-50'
                }`}
              />
            </div>
          </FormField>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2"
          >
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}
