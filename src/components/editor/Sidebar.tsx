'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Settings,
  Folder,
  Layers,
  ChevronLeft,
  Home,
} from 'lucide-react';
import DocumentIcon from '@/components/common/DocumentIcon';

interface SidebarDoc {
  id: string;
  title: string;
  icon: string;
}

interface SidebarProps {
  workspaceId: string;
  workspaceName: string;
  currentDocId: string;
  documents: SidebarDoc[];
  onCreateDocument: () => void;
  isOpen: boolean;
  onToggle: () => void;
  canEdit: boolean;
}

export default function Sidebar({
  workspaceId,
  workspaceName,
  currentDocId,
  documents,
  onCreateDocument,
  isOpen,
  onToggle,
  canEdit,
}: SidebarProps) {
  const router = useRouter();

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-40 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-md flex items-center gap-1.5 text-xs font-semibold hover:bg-slate-50 transition"
        title="Open Sidebar"
      >
        <Layers className="w-4 h-4 text-indigo-600" />
        <span className="font-semibold">Pages</span>
      </button>
    );
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/70 backdrop-blur flex flex-col h-full select-none flex-shrink-0">
      {/* Workspace Header */}
      <div className="p-3 border-b border-slate-200/80 flex items-center justify-between">
        <Link
          href={`/workspace/${workspaceId}`}
          className="flex items-center gap-2 hover:bg-slate-200/60 p-1.5 rounded-lg transition flex-1 min-w-0"
        >
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-2xs">
            <Folder className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-xs text-slate-800 truncate">
            {workspaceName}
          </span>
        </Link>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Quick Links */}
      <div className="px-3 pt-3 space-y-1 text-xs">
        <Link
          href="/"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition font-medium"
        >
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <span>Home</span>
        </Link>
        <Link
          href={`/dashboard?fromDoc=${currentDocId}&fromWs=${workspaceId}`}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition font-medium"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
          <span>All Workspaces</span>
        </Link>
        <Link
          href={`/workspace/${workspaceId}?fromDoc=${currentDocId}`}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition font-medium"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Workspace Settings</span>
        </Link>
      </div>

      {/* Pages Section */}
      <div className="px-3 pt-5 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
        <span>Pages ({documents.length})</span>
        {canEdit && (
          <button
            onClick={onCreateDocument}
            className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded transition"
            title="Create New Page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {documents.map((doc) => {
          const isActive = doc.id === currentDocId;
          return (
            <Link
              key={doc.id}
              href={`/workspace/${workspaceId}/doc/${doc.id}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all group ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-900 font-bold border-l-3 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <DocumentIcon icon={doc.icon} className="w-3.5 h-3.5" />
              <span className="truncate flex-1 tracking-tight">{doc.title}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
