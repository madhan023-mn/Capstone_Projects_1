'use client';

import React, { useEffect, useState } from 'react';
import { History, Plus, RotateCcw, X, Clock, Check } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface VersionItem {
  id: string;
  documentId: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface VersionHistoryDrawerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
  onRestoreSuccess: () => void;
}

export default function VersionHistoryDrawer({
  documentId,
  isOpen,
  onClose,
  canEdit,
  onRestoreSuccess,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadVersions() {
      try {
        const res = await fetch(`/api/documents/${documentId}/versions`);
        if (res.ok) {
          const data = await res.json();
          setVersions(data.versions || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadVersions();
  }, [documentId, isOpen]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setVersions((prev) => [data.version, ...prev]);
        setNewLabel('');
      } else {
        alert('Failed to create snapshot');
      }
    } catch (err) {
      alert('Error creating snapshot');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreVersion = async (version: VersionItem) => {
    if (
      !confirm(
        `Are you sure you want to restore Version ${version.versionNumber} ("${
          version.label || 'Snapshot'
        }")? Current unsaved edits will be replaced.`
      )
    ) {
      return;
    }

    setRestoringId(version.id);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/versions/${version.id}/restore`,
        { method: 'POST' }
      );

      if (res.ok) {
        alert(`Successfully restored to Version ${version.versionNumber}.`);
        onRestoreSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to restore version');
      }
    } catch (e) {
      alert('Error restoring version');
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-slate-900">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Create Snapshot Form */}
      {canEdit && (
        <form
          onSubmit={handleCreateSnapshot}
          className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2"
        >
          <div className="text-xs font-semibold text-slate-700">Save Snapshot Point</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Major draft revision"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </form>
      )}

      {/* Snapshot List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading history...</div>
        ) : versions.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">
            No snapshots recorded yet. Click "Save" above to create an immutable checkpoint!
          </div>
        ) : (
          versions.map((ver) => (
            <div
              key={ver.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-indigo-200 hover:bg-indigo-50/20 transition flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-800">
                    Version {ver.versionNumber}
                  </span>
                  {ver.label && (
                    <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                      {ver.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(ver.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>{ver.creator.name}</span>
                </div>
              </div>

              {canEdit && (
                <button
                  onClick={() => handleRestoreVersion(ver)}
                  disabled={restoringId === ver.id}
                  className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white border border-slate-200 shadow-sm text-xs flex items-center gap-1"
                  title="Restore this version"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Restore</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
