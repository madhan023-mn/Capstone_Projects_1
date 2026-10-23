'use client';

import React from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Undo,
  Redo,
  Highlighter,
  Eye,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  isReadOnly: boolean;
}

export default function EditorToolbar({ editor, isReadOnly }: EditorToolbarProps) {
  if (!editor) return null;

  if (isReadOnly) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-200 bg-amber-50/80 text-amber-900 text-xs font-medium">
        <Eye className="w-4 h-4 text-amber-600 shrink-0" />
        <span>You are in read-only mode for this document (Viewer / Commenter permissions).</span>
      </div>
    );
  }

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md text-xs transition flex items-center justify-center ${
      active
        ? 'bg-white text-indigo-600 font-bold shadow-2xs ring-1 ring-slate-200/80'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-2 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
      {/* Undo / Redo Group */}
      <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
        <button
          onClick={() => {
            try {
              if (typeof (editor.chain().focus() as any)?.undo === 'function') {
                (editor.chain().focus() as any).undo().run();
              }
            } catch (e) {}
          }}
          disabled={typeof (editor.can() as any)?.undo === 'function' ? !(editor.can() as any).undo() : false}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 disabled:opacity-30 transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            try {
              if (typeof (editor.chain().focus() as any)?.redo === 'function') {
                (editor.chain().focus() as any).redo().run();
              }
            } catch (e) {}
          }}
          disabled={typeof (editor.can() as any)?.redo === 'function' ? !(editor.can() as any).redo() : false}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 disabled:opacity-30 transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Formatting Group */}
      <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btnClass(editor.isActive('highlight'))}
          title="Highlight"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headings Group */}
      <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lists & Callouts Group */}
      <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={btnClass(editor.isActive('taskList'))}
          title="Checklist / Task List"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <span className="font-mono text-[10px] font-bold">{"{ }"}</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
          title="Divider"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
