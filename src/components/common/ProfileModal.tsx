'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  X,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  createdAt?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfileData | null;
}

export default function ProfileModal({ isOpen, onClose, user: initialUser }: ProfileModalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData | null>(initialUser || null);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchMe() {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setProfile(data.user);
          }
          if (data.workspaces) {
            setWorkspaces(data.workspaces);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user profile:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUser = profile || initialUser;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    onClose();
    router.push('/login');
  };

  const formattedDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="relative h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 flex items-start justify-end pt-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-12 mb-3 flex items-end justify-between">
            <div className="relative">
              <img
                src={
                  currentUser?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    currentUser?.name || 'User'
                  )}`
                }
                alt={currentUser?.name || 'User profile'}
                className="w-20 h-20 rounded-2xl border-4 border-white bg-slate-100 shadow-md object-cover"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Active" />
            </div>

            {currentUser?.role && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                {currentUser.role}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {currentUser?.name || 'User Profile'}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser?.email || 'user@example.com'}</span>
            </p>
          </div>

          {/* User Details Grid */}
          <div className="mt-5 space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" /> Account Status
              </span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified & Active
              </span>
            </div>

            {formattedDate && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Member Since
                </span>
                <span className="font-semibold text-slate-700">{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Workspaces List */}
          {workspaces.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Your Workspaces ({workspaces.length})
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => {
                      onClose();
                      router.push(`/workspace/${ws.id}`);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition">
                        {ws.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {ws.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 transition flex items-center gap-1.5 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}