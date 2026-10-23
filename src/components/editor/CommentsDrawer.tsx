'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  CornerDownRight,
  Send,
  X,
  Trash2,
  Clock,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

interface CommentItem {
  id: string;
  content: string;
  targetText: string | null;
  isResolved: boolean;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentReply[];
}

interface CommentsDrawerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  canComment: boolean;
  selectedText?: string;
  onClearSelectedText?: () => void;
}

export default function CommentsDrawer({
  documentId,
  isOpen,
  onClose,
  canComment,
  selectedText,
  onClearSelectedText,
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadComments() {
      try {
        const res = await fetch(`/api/documents/${documentId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [documentId, isOpen]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newCommentText.trim(),
          targetText: selectedText || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewCommentText('');
        if (onClearSelectedText) onClearSelectedText();
      }
    } catch (err) {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !currentResolved }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isResolved: !currentResolved } : c))
        );
      }
    } catch (err) {
      alert('Error updating comment');
    }
  };

  const handleAddReply = async (commentId: string) => {
    const text = replyTexts[commentId];
    if (!text?.trim()) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, replies: [...c.replies, data.reply] } : c
          )
        );
        setReplyTexts((prev) => ({ ...prev, [commentId]: '' }));
      }
    } catch (e) {
      alert('Error sending reply');
    }
  };

  if (!isOpen) return null;

  const filteredComments = comments.filter((c) =>
    activeTab === 'open' ? !c.isResolved : c.isResolved
  );

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-slate-900">Comments</h3>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-medium">
            {comments.filter((c) => !c.isResolved).length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 text-xs font-medium">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2 text-center border-b-2 transition ${
            activeTab === 'open'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Open ({comments.filter((c) => !c.isResolved).length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`flex-1 py-2 text-center border-b-2 transition ${
            activeTab === 'resolved'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Resolved ({comments.filter((c) => c.isResolved).length})
        </button>
      </div>

      {/* Selected Text Highlight Reference */}
      {selectedText && (
        <div className="p-3 bg-amber-50/80 border-b border-amber-100 text-xs flex items-start justify-between">
          <div>
            <span className="font-semibold text-amber-900 block mb-0.5">Commenting on selection:</span>
            <p className="italic text-amber-800 line-clamp-2 font-serif">&ldquo;{selectedText}&rdquo;</p>
          </div>
          {onClearSelectedText && (
            <button
              onClick={onClearSelectedText}
              className="text-amber-700 hover:text-amber-900 ml-2"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* New Comment Input */}
      {canComment && (
        <form onSubmit={handleCreateComment} className="p-3.5 border-b border-slate-100 bg-slate-50/60">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment or question..."
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition"
            >
              <Send className="w-3 h-3" /> Post
            </button>
          </div>
        </form>
      )}

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading comments...</div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">
            {activeTab === 'open' ? 'No open comments on this document.' : 'No resolved comments.'}
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition space-y-2.5"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.author.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={comment.author.name}
                    className="w-5 h-5 rounded-full border border-slate-200"
                  />
                  <span className="text-xs font-semibold text-slate-800">{comment.author.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{formatTimeAgo(comment.createdAt)}</span>
                  {canComment && (
                    <button
                      onClick={() => handleToggleResolve(comment.id, comment.isResolved)}
                      className={`p-1 rounded hover:bg-slate-200 transition ${
                        comment.isResolved ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                      }`}
                      title={comment.isResolved ? 'Re-open' : 'Mark as resolved'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Target Excerpt */}
              {comment.targetText && (
                <div className="pl-2 border-l-2 border-indigo-400 text-[11px] text-slate-500 italic font-serif line-clamp-2">
                  &ldquo;{comment.targetText}&rdquo;
                </div>
              )}

              {/* Comment Body */}
              <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>

              {/* Replies Thread */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-3 border-l border-slate-200 space-y-2 pt-1">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <img
                          src={reply.author.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                          alt={reply.author.name}
                          className="w-3.5 h-3.5 rounded-full"
                        />
                        <span>{reply.author.name}</span>
                        <span className="text-[9px] text-slate-400 font-normal ml-auto">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 pl-5">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Box */}
              {canComment && !comment.isResolved && (
                <div className="pt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={replyTexts[comment.id] || ''}
                    onChange={(e) =>
                      setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddReply(comment.id);
                    }}
                    placeholder="Reply..."
                    className="flex-1 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                    title="Send reply"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
