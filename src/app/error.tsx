'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The application encountered an unexpected state. Don't worry, your work is safely preserved in real-time storage.
        </p>

        {error.message && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left overflow-x-auto text-xs font-mono text-slate-700">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
