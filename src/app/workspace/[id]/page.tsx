'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Users,
  Settings,
  ArrowLeft,
  Search,
  Clock,
  MessageSquare,
  Shield,
  Trash2,
  UserPlus,
  ChevronRight,
  Sparkles,
  Folder,
  X,
  Home,
} from 'lucide-react';
import DocumentIcon from '@/components/common/DocumentIcon';

interface WorkspaceData {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: {
    id: string;
    role: string;
    userId: string;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }[];
  documents: {
    id: string;
    title: string;
    icon: string;
    updatedAt: string;
    createdById: string;
  }[];
  activities: {
    id: string;
    action: string;
    createdAt: string;
    user: { id: string; name: string };
  }[];
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [userRole, setUserRole] = useState<string>('VIEWER');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER'>('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [returnDoc, setReturnDoc] = useState<{ id: string; title?: string } | null>(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fromDocId = urlParams.get('fromDoc');
      if (fromDocId) {
        setReturnDoc({ id: fromDocId });
      } else {
        const stored = localStorage.getItem('syncspace_recent_doc');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.workspaceId === params.id && parsed.documentId) {
            setReturnDoc({ id: parsed.documentId, title: parsed.title });
          }
        }
      }
    } catch (e) {}
  }, [params.id]);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const res = await fetch(`/api/workspaces/${params.id}`);
        if (!res.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await res.json();
        setWorkspace(data.workspace);
        setUserRole(data.userRole);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [params.id, router]);

  const handleCreateDocument = async () => {
    setCreatingDoc(true);
    try {
      const res = await fetch(`/api/workspaces/${params.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Document',
          icon: 'file-text',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/workspace/${params.id}/doc/${data.document.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create document');
      }
    } catch (e) {
      alert('Error creating document');
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const res = await fetch(`/api/workspaces/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWorkspace((prev) =>
          prev
            ? {
                ...prev,
                members: [...prev.members, data.member],
              }
            : null
        );
        setInviteEmail('');
        alert('Member added successfully!');
      } else {
        alert(data.error || 'Failed to add member');
      }
    } catch (err) {
      alert('Error adding member');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/workspaces/${params.id}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setWorkspace((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((m) =>
                  m.userId === userId ? { ...m, role: newRole } : m
                ),
              }
            : null
        );
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      alert('Error updating role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/workspaces/${params.id}/members?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWorkspace((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m.userId !== userId),
              }
            : null
        );
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      alert('Error removing member');
    }
  };

  if (loading || !workspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-sans">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  const filteredDocs = workspace.documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canEdit = ['OWNER', 'ADMIN', 'EDITOR'].includes(userRole);
  const canAdmin = ['OWNER', 'ADMIN'].includes(userRole);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Return to Home"
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Back to Workspaces"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Folder className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="font-bold text-slate-900 text-base">{workspace.name}</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 ml-1">
                {userRole}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(returnDoc?.id || (workspace.documents.length > 0 && workspace.documents[0].id)) && (
              <Link
                href={`/workspace/${workspace.id}/doc/${returnDoc?.id || workspace.documents[0].id}`}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition group"
                title="Back to Document Editor"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                <span>Back to Document</span>
              </Link>
            )}

            <button
              onClick={() => setShowMemberModal(true)}
              className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Members ({workspace.members.length})</span>
            </button>

            {canEdit && (
              <button
                onClick={handleCreateDocument}
                disabled={creatingDoc}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{creatingDoc ? 'Creating...' : 'New Document'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Document List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs transition"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm shadow-2xs">
                No documents found. Click &quot;New Document&quot; to start writing!
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/workspace/${workspace.id}/doc/${doc.id}`}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center group-hover:border-indigo-300 group-hover:bg-indigo-50/40 transition shrink-0">
                      <DocumentIcon icon={doc.icon} size="md" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                        {doc.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" /> Updated{' '}
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Activity Feed & Details */}
        <div className="space-y-6">
          {/* Workspace Details */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              About Workspace
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {workspace.description || 'Collaborative team workspace.'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Total Documents:</span>
              <span className="font-semibold text-slate-900">{workspace.documents.length}</span>
            </div>
          </div>

          {/* Activity Log */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {workspace.activities.length === 0 ? (
                <div className="text-xs text-slate-400">No recent activity recorded.</div>
              ) : (
                workspace.activities.map((act) => (
                  <div key={act.id} className="text-xs text-slate-600 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900">{act.user.name}</span>{' '}
                      <span>{act.action.toLowerCase().replace(/_/g, ' ')}</span>
                      <div className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Members & Permissions Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Workspace Members
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invite Form */}
            {canAdmin && (
              <form onSubmit={handleInviteMember} className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Add Member by Email
                </span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    required
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="COMMENTER">Commenter</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-xs"
                  >
                    {inviting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {workspace.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={m.user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt={m.user.name}
                      className="w-7 h-7 rounded-full border border-slate-200 bg-white"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{m.user.name}</div>
                      <div className="text-[11px] text-slate-500">{m.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canAdmin && m.role !== 'OWNER' ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-indigo-700 focus:outline-none"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="COMMENTER">COMMENTER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 border border-slate-200 text-slate-700 text-[10px]">
                        {m.role}
                      </span>
                    )}

                    {canAdmin && m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
