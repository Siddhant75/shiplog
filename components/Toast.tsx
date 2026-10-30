'use client';
import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastProps {
  message: string | null;
  onClose?: () => void;
  durationMs?: number;
}

export function Toast({ message, onClose, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, onClose, durationMs]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl text-emerald-300 text-xs font-medium backdrop-blur-md animate-in slide-in-from-bottom-3 fade-in duration-200"
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="text-slate-100">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition ml-2"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
