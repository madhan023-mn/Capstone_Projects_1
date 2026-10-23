'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import EditorToolbar from './EditorToolbar';
import CommentsDrawer from './CommentsDrawer';
import VersionHistoryDrawer from './VersionHistoryDrawer';
import Sidebar from './Sidebar';
import IconPicker from '@/components/common/IconPicker';

import {
  MessageSquare,
  History,
  Users,
  Wifi,
  WifiOff,
  CheckCircle2,
  Share2,
  Clock,
  Sparkles,
  Menu,
} from 'lucide-react';
import { getUserColor } from '@/lib/utils';

interface Collaborator {
  clientId: number;
  name: string;
  color: string;
  avatarUrl?: string;
  role?: string;
}

interface CollaborativeEditorProps {
  documentId: string;
  workspaceId: string;
  initialTitle: string;
  initialIcon: string;
  userRole: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  workspaceName: string;
  allDocs: { id: string; title: string; icon: string }[];
}

export default function CollaborativeEditor({
  documentId,
  workspaceId,
  initialTitle,
  initialIcon,
  userRole,
  currentUser,
  workspaceName,
  allDocs,
}: CollaborativeEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [icon, setIcon] = useState(initialIcon);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  // Panels
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Yjs & Provider state
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  const canEdit = ['OWNER', 'ADMIN', 'EDITOR'].includes(userRole);
  const canComment = ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER'].includes(userRole);
  const isReadOnly = !canEdit;

  const userColor = getUserColor(currentUser?.id || 'anon');

  // Initialize Yjs & WebSocket Provider
  useEffect(() => {
    let isMounted = true;
    const ydocInstance = new Y.Doc();
    setYdoc(ydocInstance);
    let providerInstance: WebsocketProvider | null = null;

    async function initCollaboration() {
      try {
        // 1. Fetch token from server
        const res = await fetch(`/api/documents/${documentId}/token`);
        if (!res.ok) {
          console.warn('Could not retrieve doc token, running in local mode');
          setConnectionStatus('disconnected');
          return;
        }
        const tokenData = await res.json();

        if (!isMounted) return;

        const wsUrl = tokenData.wsUrl || process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234';

        // 2. Connect via y-websocket with auth token
        providerInstance = new WebsocketProvider(wsUrl, documentId, ydocInstance, {
          params: { token: tokenData.token },
        });

        if (!isMounted) {
          providerInstance.destroy();
          return;
        }

        setProvider(providerInstance);

        // 3. Awareness setup (Cursors & Presence)
        providerInstance.awareness.setLocalStateField('user', {
          name: currentUser?.name || 'Collaborator',
          color: userColor,
          avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`,
          role: userRole,
        });

        // 4. Awareness change listener
        const updateCollaborators = () => {
          if (!providerInstance) return;
          const states = providerInstance.awareness.getStates();
          const activeUsers: Collaborator[] = [];

          states.forEach((state: any, clientId: number) => {
            if (state.user) {
              activeUsers.push({
                clientId,
                name: state.user.name || 'Anonymous',
                color: state.user.color || '#3b82f6',
                avatarUrl: state.user.avatarUrl,
                role: state.user.role,
              });
            }
          });

          setCollaborators(activeUsers);
        };

        providerInstance.awareness.on('change', updateCollaborators);
        updateCollaborators();

        // 5. Connection status
        providerInstance.on('status', (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
          if (isMounted) setConnectionStatus(event.status);
        });

        providerInstance.on('sync', (isSynced: boolean) => {
          if (isSynced && isMounted) {
            setConnectionStatus('connected');
          }
        });
      } catch (err) {
        console.error('Collab initialization error:', err);
        if (isMounted) setConnectionStatus('disconnected');
      }
    }

    initCollaboration();

    return () => {
      isMounted = false;
      setTimeout(() => {
        try {
          if (providerInstance) {
            providerInstance.destroy();
          }
          ydocInstance.destroy();
        } catch (e) {
          // teardown protection
        }
      }, 50);
    };
  }, [documentId, currentUser?.id, currentUser?.name, userColor, userRole]);

  // TipTap Editor instance
  const editor = useEditor(
    {
      editable: canEdit,
      extensions: [
        StarterKit.configure({
          history: ydoc ? false : undefined,
        }),
        Placeholder.configure({
          placeholder: "Type '/' for commands or start writing simultaneously...",
        }),
        Underline,
        Highlight,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        // Collaboration extension attached to the Yjs doc
        ...(ydoc
          ? [
              Collaboration.configure({
                document: ydoc,
              }),
            ]
          : []),
        // Collaboration Cursor extension
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider: provider,
                user: {
                  name: currentUser?.name || 'Collaborator',
                  color: userColor,
                },
              }),
            ]
          : []),
      ],
      onSelectionUpdate({ editor }) {
        try {
          const { from, to } = editor.state.selection;
          if (from !== to) {
            const text = editor.state.doc.textBetween(from, to, ' ');
            setSelectedText(text);
          } else {
            setSelectedText('');
          }
        } catch (e) {}
      },
    },
    [ydoc, provider, canEdit]
  );

  // Sync title changes
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!canEdit) return;

    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
      } catch (e) {
        console.error(e);
      }
    }, 800);
  };

  const handleIconChange = async (newIcon: string) => {
    setIcon(newIcon);
    if (!canEdit) return;
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: newIcon }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document', icon: 'file-text' }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/workspace/${workspaceId}/doc/${data.document.id}`;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreReload = () => {
    // Refresh page to load restored binary state
    window.location.reload();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70 text-slate-900 font-sans">
      {/* Notion-style Sidebar */}
      <Sidebar
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        currentDocId={documentId}
        documents={allDocs}
        onCreateDocument={handleCreateDocument}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        canEdit={canEdit}
      />

      {/* Main Document Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-100/60 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-200/80 px-6 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shadow-2xs"
                title="Expand sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Live Connection & Sync Indicator */}
            <div className="flex items-center gap-2.5">
              {connectionStatus === 'connected' ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shadow-2xs"
                  title="Real-time WebSocket connected and in sync"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse" />
                  <span>Live Synced</span>
                </div>
              ) : connectionStatus === 'connecting' ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700 shadow-2xs"
                  title="Connecting to collaboration server..."
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700 shadow-2xs"
                  title="Disconnected from server. Reconnecting..."
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Offline (Reconnecting)</span>
                </div>
              )}

              {/* Role Badge */}
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs">
                {userRole}
              </span>
            </div>
          </div>

          {/* Right Header: Collaborators Avatars, Comments, History */}
          <div className="flex items-center gap-3">
            {/* Online Collaborators Avatars (Figma style) */}
            <div className="flex items-center -space-x-2 overflow-hidden py-1 px-1">
              {collaborators.map((c) => (
                <div
                  key={c.clientId}
                  className="relative group transition-transform hover:scale-115 hover:z-20 cursor-pointer"
                  title={`${c.name} (${c.role || 'Collaborator'})`}
                >
                  <img
                    src={c.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={c.name}
                    className="w-7 h-7 rounded-full border-2 bg-white shadow-xs ring-1 ring-slate-200/50"
                    style={{ borderColor: c.color }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl z-30">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-slate-400 ml-1.5 text-[10px]">({c.role})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-[1px] h-5 bg-slate-200" />

            {/* Comments Button */}
            <button
              onClick={() => setCommentsOpen(!commentsOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs ${
                commentsOpen
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50'
              }`}
              title="Comments & Feedback"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comments</span>
              {selectedText && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              )}
            </button>

            {/* Version History Button */}
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs ${
                historyOpen
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50'
              }`}
              title="Version History & Snapshots"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </header>

        {/* TipTap Toolbar */}
        <EditorToolbar editor={editor} isReadOnly={isReadOnly} />

        {/* Document Body & ProseMirror Editor Canvas */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 px-8 sm:px-14 py-12 min-h-[calc(100vh-8.5rem)] transition-all">
            {/* Document Title & Icon Header */}
            <div className="mb-8">
              <div className="mb-4">
                <IconPicker
                  currentIcon={icon}
                  onSelect={handleIconChange}
                  disabled={!canEdit}
                />
              </div>

              <input
                type="text"
                value={title}
                disabled={!canEdit}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Document"
                className="w-full text-3xl sm:text-4xl font-extrabold text-slate-900 placeholder-slate-300 border-none outline-none focus:outline-none bg-transparent tracking-tight disabled:opacity-80 transition"
              />
            </div>

            {/* TipTap ProseMirror Editor */}
            <div className="min-h-[500px]">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* Comments Drawer */}
      <CommentsDrawer
        documentId={documentId}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        canComment={canComment}
        selectedText={selectedText}
        onClearSelectedText={() => setSelectedText('')}
      />

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        documentId={documentId}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        canEdit={canEdit}
        onRestoreSuccess={handleRestoreReload}
      />
    </div>
  );
}
