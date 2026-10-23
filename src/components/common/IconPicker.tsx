'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ICON_MAP, EMOJI_TO_ICON_KEY } from './DocumentIcon';
import { X, Sparkles } from 'lucide-react';

interface IconPickerProps {
  currentIcon?: string | null;
  onSelect: (iconKey: string) => void;
  disabled?: boolean;
}

export default function IconPicker({ currentIcon, onSelect, disabled = false }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedKey = (currentIcon && EMOJI_TO_ICON_KEY[currentIcon]) || currentIcon || 'file-text';
  const activeDef = ICON_MAP[normalizedKey] || ICON_MAP['file-text'];
  const ActiveIcon = activeDef.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Icon Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xs border ${
          disabled
            ? 'bg-slate-50 border-slate-200 cursor-default opacity-90'
            : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-indigo-400 hover:shadow-md cursor-pointer hover:scale-105 active:scale-95'
        }`}
        title={disabled ? activeDef.label : 'Click to change document icon'}
      >
        <ActiveIcon className={`w-7 h-7 ${activeDef.color}`} />
      </button>

      {/* Popover Grid */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 p-3.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Document Icon</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ICON_MAP).map(([key, item]) => {
              const IconComp = item.icon;
              const isSelected = normalizedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSelect(key);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-2 border-indigo-500 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                  title={item.label}
                >
                  <IconComp className={`w-5 h-5 ${item.color}`} />
                  <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
