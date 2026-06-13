import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, User, ShieldAlert, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

export default function Login() {
  const { login, signup, user, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard or POS based on role
    if (user) {
      if (user.role === 'cashier') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) return;

    setLocalLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password, name, 'admin'); // Default role as admin (backend auto-resolves first user)
        setIsSignUp(false); // Switch to login after successful signup
      } else {
        const u = await login(email, password);
        if (u.role === 'cashier') {
          navigate('/pos');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

      {/* Card container */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="TejasPOS"
            className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-indigo-500/20 mb-4"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.logo-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div className="logo-fallback hidden w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/20 mb-4">
            T
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isSignUp ? 'Create your Account' : 'Sign in to TejasPOS'}
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            {isSignUp ? 'Set up the first administrator account' : 'Enter your credentials to access the terminal'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-400 text-xs font-semibold flex items-start">
            <ShieldAlert className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-xs font-semibold flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <FormField label="Full Name" required>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </FormField>
          )}

          <FormField label="Email Address" required>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </FormField>

          <FormField label="Password" required>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            {!isSignUp && (
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-350 hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}
          </FormField>

          <Button
            type="submit"
            variant="primary"
            loading={localLoading}
            className="w-full mt-2"
          >
            {isSignUp ? 'Register Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
            }}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Log In' : 'Registering for the first time? Create Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
