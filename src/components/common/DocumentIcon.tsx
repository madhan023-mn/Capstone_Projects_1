'use client';

import React from 'react';
import {
  FileText,
  Zap,
  Rocket,
  Palette,
  FileEdit,
  Lightbulb,
  Flame,
  BarChart3,
  Globe,
  Sparkles,
  Folder,
  Code2,
  Bookmark,
  Shield,
  Layers,
  Terminal,
  Coffee,
  Compass,
  Heart,
  Star,
  Cpu,
  CheckCircle2,
  BookOpen,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  'file-text': { icon: FileText, color: 'text-indigo-600', label: 'Document' },
  'zap': { icon: Zap, color: 'text-amber-500', label: 'Lightning' },
  'rocket': { icon: Rocket, color: 'text-rose-500', label: 'Rocket' },
  'palette': { icon: Palette, color: 'text-purple-500', label: 'Design' },
  'file-edit': { icon: FileEdit, color: 'text-blue-500', label: 'Notes' },
  'lightbulb': { icon: Lightbulb, color: 'text-yellow-500', label: 'Idea' },
  'flame': { icon: Flame, color: 'text-orange-500', label: 'Urgent' },
  'bar-chart': { icon: BarChart3, color: 'text-emerald-500', label: 'Analytics' },
  'globe': { icon: Globe, color: 'text-cyan-500', label: 'Public' },
  'sparkles': { icon: Sparkles, color: 'text-violet-500', label: 'Special' },
  'folder': { icon: Folder, color: 'text-indigo-500', label: 'Folder' },
  'code': { icon: Code2, color: 'text-emerald-600', label: 'Code' },
  'bookmark': { icon: Bookmark, color: 'text-pink-500', label: 'Bookmark' },
  'shield': { icon: Shield, color: 'text-sky-500', label: 'Security' },
  'layers': { icon: Layers, color: 'text-teal-500', label: 'Layers' },
  'terminal': { icon: Terminal, color: 'text-slate-700', label: 'Terminal' },
  'book': { icon: BookOpen, color: 'text-blue-600', label: 'Guide' },
  'star': { icon: Star, color: 'text-amber-400', label: 'Favorite' },
  'heart': { icon: Heart, color: 'text-rose-600', label: 'Love' },
  'cpu': { icon: Cpu, color: 'text-purple-600', label: 'System' },
};

// Backward-compatibility mapper for legacy emoji strings stored in database
export const EMOJI_TO_ICON_KEY: Record<string, string> = {
  '📄': 'file-text',
  '⚡': 'zap',
  '🚀': 'rocket',
  '🎨': 'palette',
  '📝': 'file-edit',
  '💡': 'lightbulb',
  '🔥': 'flame',
  '📊': 'bar-chart',
  '🌐': 'globe',
  '✨': 'sparkles',
  '📂': 'folder',
  '📑': 'book',
  '⭐': 'star',
  '❤️': 'heart',
};

interface DocumentIconProps {
  icon?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function DocumentIcon({ icon, className = '', size = 'md' }: DocumentIconProps) {
  const normalizedKey = (icon && EMOJI_TO_ICON_KEY[icon]) || icon || 'file-text';
  const iconDef = ICON_MAP[normalizedKey] || ICON_MAP['file-text'];
  const IconComponent = iconDef.icon;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-10 h-10',
  }[size];

  return (
    <IconComponent
      className={`${sizeClasses} ${iconDef.color} ${className} shrink-0`}
      aria-label={iconDef.label}
    />
  );
}
