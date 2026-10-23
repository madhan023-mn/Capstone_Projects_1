import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5 text-indigo-600 shadow-xs">
          <FileQuestion className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The document or workspace you are looking for doesn't exist, has been archived, or you may not have permission to view it.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
