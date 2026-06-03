import React, { useState } from 'react';
import { useTripStore } from '../store';
import { Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

type AuthMode = 'login' | 'signup';

export const AuthPage: React.FC<{ mode?: AuthMode }> = ({ mode = 'login' }) => {
  const { setAuth } = useTripStore();
  const navigate = useNavigate();
  const isLogin = mode === 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/users/login/' : '/users/register/';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuth(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2563EB]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] bg-surface/80 backdrop-blur-md border border-border-subtle rounded-2xl p-lg shadow-xl relative z-10">
        <div className="flex flex-col items-center mb-xl">
          <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md shadow-sm">
            <Shield size={28} />
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface text-center">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-text-secondary text-sm mt-xs text-center">
            {isLogin 
              ? 'Log in to your LogisticsPro account to plan your next route.' 
              : 'Sign up for LogisticsPro to start planning compliant routes.'}
          </p>
        </div>

        {error && (
          <div className="mb-md p-sm bg-error-container/20 border border-error-container text-on-error-container text-xs rounded-lg text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="driver@logistics.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-highest border border-border-subtle rounded-lg px-md py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-highest border border-border-subtle rounded-lg px-md py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold rounded-lg h-[44px] mt-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-lg text-center border-t border-border-subtle pt-md">
          <p className="text-xs text-text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link
              to={isLogin ? '/signup' : '/login'}
              className="text-primary font-bold hover:underline ml-xs"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
