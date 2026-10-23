'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CollaborativeEditor from '@/components/editor/CollaborativeEditor';

interface DocumentPageProps {
  params: {
    id: string; // workspaceId
    docId: string;
  };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('VIEWER');
  const [allDocs, setAllDocs] = useState<{ id: string; title: string; icon: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('Workspace');

  useEffect(() => {
    async function load() {
      try {
        // 1. Current user
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setCurrentUser(meData.user);

        // 2. Fetch document
        const docRes = await fetch(`/api/documents/${params.docId}`);
        if (!docRes.ok) {
          const errData = await docRes.json().catch(() => ({}));
          setErrorMsg(errData.error || 'Document not found or inaccessible');
          return;
        }
        const docJson = await docRes.json();
        setDocData(docJson.document);
        setUserRole(docJson.userRole);
        setWorkspaceName(docJson.document?.workspace?.name || 'Workspace');

        // 3. Fetch all workspace docs for sidebar
        const wsDocsRes = await fetch(`/api/workspaces/${params.id}/documents`);
        if (wsDocsRes.ok) {
          const wsDocsJson = await wsDocsRes.json();
          setAllDocs(
            wsDocsJson.documents.map((d: any) => ({
              id: d.id,
              title: d.title,
              icon: d.icon || 'file-text',
            }))
          );
        }
      } catch (err: any) {
        console.error('Error loading document:', err);
        setErrorMsg(err?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, params.docId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-sans">
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Opening collaborative document...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !docData || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Unable to open document</h2>
          <p className="text-xs text-slate-600 mb-6">{errorMsg || 'This document may have been deleted or moved.'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push(`/workspace/${params.id}`)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Back to Workspace
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeEditor
      documentId={params.docId}
      workspaceId={params.id}
      initialTitle={docData.title}
      initialIcon={docData.icon || 'file-text'}
      userRole={userRole}
      currentUser={currentUser}
      workspaceName={workspaceName}
      allDocs={allDocs}
    />
  );
}
