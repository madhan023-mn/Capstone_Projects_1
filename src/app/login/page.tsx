'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      if (data.defaultWorkspaceId && data.defaultDocumentId) {
        router.push(`/workspace/${data.defaultWorkspaceId}/doc/${data.defaultDocumentId}`);
      } else if (data.defaultWorkspaceId) {
        router.push(`/workspace/${data.defaultWorkspaceId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-sm shadow-indigo-500/20">
              ⚡
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight">SyncSpace</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-slate-600 mt-1">
            Collaborate on documents with your team in real time
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Pill */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Demo Accounts (Password: Password123!)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('alice@collab.io')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-800 transition"
              >
                <span className="font-bold text-emerald-700 block">Alice</span>
                <span className="text-[10px] text-slate-500">alice@collab.io (Owner)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('bob@collab.io')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-800 transition"
              >
                <span className="font-bold text-blue-700 block">Bob</span>
                <span className="text-[10px] text-slate-500">bob@collab.io (Editor)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
