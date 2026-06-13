import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

// Password strength rules
const RULES = [
  { id: 'length',    label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)',      test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter (a–z)',      test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'One number (0–9)',                test: (p) => /[0-9]/.test(p) },
];

function getStrength(password) {
  return RULES.filter(r => r.test(password)).length;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500'];
const STRENGTH_TEXT   = ['', 'text-rose-400', 'text-amber-400', 'text-indigo-400', 'text-emerald-400'];

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState('');
  const [fieldErrors, setFieldErrors]     = useState({ password: '', confirm: '' });
  const [sessionReady, setSessionReady]   = useState(false);
  const [sessionError, setSessionError]   = useState(false);

  // Supabase sends the reset token as a hash fragment in the URL.
  // We must listen for PASSWORD_RECOVERY event to confirm the session is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        }
      }
    );

    // Also check if session already exists (user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // If no PASSWORD_RECOVERY event after 5 seconds, link is invalid/expired
    const timeout = setTimeout(() => {
      if (!sessionReady) setSessionError(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [sessionReady]);

  const strength = getStrength(password);

  const validate = () => {
    const errors = { password: '', confirm: '' };
    let valid = true;

    if (!password) {
      errors.password = 'Password is required.';
      valid = false;
    } else if (strength < 3) {
      errors.password = 'Password is too weak. Meet at least 3 requirements below.';
      valid = false;
    }

    if (!confirmPassword) {
      errors.confirm = 'Please confirm your password.';
      valid = false;
    } else if (password !== confirmPassword) {
      errors.confirm = 'Passwords do not match.';
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate('/login', { 
        state: { message: 'Password updated! Please log in with your new password.' }
      }), 3000);

    } catch (err) {
      setError(err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  // INVALID / EXPIRED LINK
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
        {/* Background blobs for premium glassmorphism */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-rose-950/40 border border-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-rose-455" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Link Expired</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            This password reset link is invalid or has expired. 
            Reset links are valid for 1 hour.
          </p>
          
          <Button
            variant="primary"
            onClick={() => navigate('/forgot-password')}
            className="w-full mb-3"
          >
            Request a New Link
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => navigate('/login')}
            className="w-full bg-slate-950 text-slate-350 border border-slate-800 hover:bg-slate-900 focus:ring-slate-800"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
        {/* Background blobs for premium glassmorphism */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-450" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
            Password Updated!
          </h1>
          <p className="text-slate-400 text-sm mb-2 font-medium">
            Your password has been changed successfully.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            Redirecting you to login in 3 seconds...
          </p>
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // LOADING — waiting for Supabase session from email link
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
        {/* Background blobs for premium glassmorphism */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/20 rounded-full blur-3xl" />

        <div className="text-center relative z-10">
          <div className="w-10 h-10 border-2 border-indigo-550/25 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  // MAIN FORM
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">

        {/* Icon */}
        <div className="w-14 h-14 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-indigo-455" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
          Set new password
        </h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Choose a strong password you haven't used before.
        </p>

        {/* Global error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-455 text-xs font-semibold flex items-start">
            <ShieldAlert className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* New Password */}
          <FormField label="New Password" error={fieldErrors.password} required>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="Enter new password"
                className={`w-full pl-10 pr-12 h-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  fieldErrors.password 
                    ? 'border-rose-900/50 bg-rose-950/20 focus:ring-rose-500' 
                    : 'border-slate-800 bg-slate-950 text-slate-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-400 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                {/* Bar */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength 
                          ? STRENGTH_COLORS[strength] 
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-bold ${STRENGTH_TEXT[strength]}`}>
                  {STRENGTH_LABELS[strength]} Password
                </p>

                {/* Rules checklist */}
                <ul className="space-y-1.5 mt-2 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
                  {RULES.map(rule => {
                    const passed = rule.test(password);
                    return (
                      <li 
                        key={rule.id}
                        className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                          passed ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <CheckCircle 
                          size={13} 
                          className={passed ? 'text-emerald-450' : 'text-slate-700'} 
                        />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </FormField>

          {/* Confirm Password */}
          <FormField label="Confirm New Password" error={fieldErrors.confirm} required>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setFieldErrors(prev => ({ ...prev, confirm: '' }));
                }}
                placeholder="Confirm new password"
                className={`w-full pl-10 pr-12 h-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  fieldErrors.confirm 
                    ? 'border-rose-900/50 bg-rose-950/20 focus:ring-rose-500' 
                    : confirmPassword && password === confirmPassword
                      ? 'border-emerald-900/50 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950 text-slate-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-400 transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* Match indicator */}
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-450" /> Passwords match
              </p>
            )}
          </FormField>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
