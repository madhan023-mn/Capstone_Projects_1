'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Zap,
  ShieldCheck,
  History,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const handleQuickDemoLogin = async (email: string) => {
    setLoadingUser(email);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.defaultWorkspaceId && data.defaultDocumentId) {
          router.push(`/workspace/${data.defaultWorkspaceId}/doc/${data.defaultDocumentId}`);
        } else if (data.defaultWorkspaceId) {
          router.push(`/workspace/${data.defaultWorkspaceId}`);
        } else {
          router.push('/dashboard');
        }
      } else {
        alert('Could not log in with demo account. Please ensure database is seeded.');
      }
    } catch (err) {
      alert('Error during demo login');
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Navigation Bar */}
      <header className="border-b border-slate-200/80 backdrop-blur-md sticky top-0 z-50 bg-white/85 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              SyncSpace
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-16 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-8 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Next.js • Yjs CRDT • WebSockets • PostgreSQL • Redis</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-slate-900">
          Real-Time Collaborative Workspace
          <span className="block mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Where Teams Create Together
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Inspired by Notion and Figma. Multiple users edit simultaneously with conflict-free Yjs CRDTs, live multiplayer cursors, presence avatars, snapshot version history, and role-based permissions.
        </p>

        {/* Quick Demo Logins Box */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 max-w-3xl mx-auto shadow-md">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold tracking-wider text-indigo-600 uppercase">
            <Zap className="w-4 h-4 text-amber-500" /> Instant Multi-User Demo (Open in 2 tabs to test live collaboration!)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleQuickDemoLogin('alice@collab.io')}
              disabled={!!loadingUser}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition text-left group shadow-2xs"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700">Alice Johnson</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">OWNER</span>
              </div>
              <span className="text-xs text-slate-500">alice@collab.io</span>
              <span className="text-[11px] text-emerald-600 mt-2 font-semibold flex items-center gap-1">
                {loadingUser === 'alice@collab.io' ? 'Logging in...' : 'Launch Session →'}
              </span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('bob@collab.io')}
              disabled={!!loadingUser}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition text-left group shadow-2xs"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-700">Bob Smith</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">EDITOR</span>
              </div>
              <span className="text-xs text-slate-500">bob@collab.io</span>
              <span className="text-[11px] text-blue-600 mt-2 font-semibold flex items-center gap-1">
                {loadingUser === 'bob@collab.io' ? 'Logging in...' : 'Launch Session →'}
              </span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('carol@collab.io')}
              disabled={!!loadingUser}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition text-left group shadow-2xs"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-sm text-slate-900 group-hover:text-amber-700">Carol Williams</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">COMMENTER</span>
              </div>
              <span className="text-xs text-slate-500">carol@collab.io</span>
              <span className="text-[11px] text-amber-600 mt-2 font-semibold flex items-center gap-1">
                {loadingUser === 'carol@collab.io' ? 'Logging in...' : 'Launch Session →'}
              </span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('david@collab.io')}
              disabled={!!loadingUser}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition text-left group shadow-2xs"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-sm text-slate-900 group-hover:text-purple-700">David Miller</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">VIEWER</span>
              </div>
              <span className="text-xs text-slate-500">david@collab.io</span>
              <span className="text-[11px] text-purple-600 mt-2 font-semibold flex items-center gap-1">
                {loadingUser === 'david@collab.io' ? 'Logging in...' : 'Launch Session →'}
              </span>
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Tip: Open an Incognito window or second browser tab, log in as <span className="font-semibold text-slate-800 font-mono">Bob</span> or <span className="font-semibold text-slate-800 font-mono">Carol</span>, and edit simultaneously with <span className="font-semibold text-slate-800 font-mono">Alice</span>!
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900 mb-12 tracking-tight">
          Engineered for Low-Latency, Zero-Conflict Collaboration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Yjs CRDT Conflict Resolution</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Edits are mathematically merged in real time using Conflict-free Replicated Data Types. No locking, no overwrites, zero data loss even on poor networks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 mb-4 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Live Colored Cursors & Presence</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              See collaborator avatars in the document header and watch colored cursors glide across the canvas as teammates type, select, and interact.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 mb-4 font-bold">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Immutable Version Snapshots</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Capture version snapshots with author timestamps. Preview and restore previous document states anytime with full audit trails.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Inline Comments & Threads</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Leave feedback tied to document sections or high-level questions. Threaded discussions, resolve status, and real-time updates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Strict Server-Enforced RBAC</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Role hierarchy: Owner, Admin, Editor, Commenter, and Viewer. Permissions are verified at both the REST API layer and the WebSocket handshake level.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 mb-4 font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Redis Pub/Sub Scaling</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scale horizontally across multiple WebSocket nodes. Redis synchronizes binary CRDT updates between server instances seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-white">
        <p>SyncSpace • Full-Stack Real-Time Collaborative Workspace Capstone Project</p>
      </footer>
    </div>
  );
}
