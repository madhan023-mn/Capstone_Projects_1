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
          router.push(`/workspace/${params.id}`);
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
              icon: d.icon || '📄',
            }))
          );
        }
      } catch (err) {
        console.error('Error loading document:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, params.docId, router]);

  if (loading || !docData || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-sans">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Opening collaborative document...</span>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeEditor
      documentId={params.docId}
      workspaceId={params.id}
      initialTitle={docData.title}
      initialIcon={docData.icon || '📄'}
      userRole={userRole}
      currentUser={currentUser}
      workspaceName={workspaceName}
      allDocs={allDocs}
    />
  );
}
