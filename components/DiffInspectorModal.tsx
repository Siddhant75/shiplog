'use client';
import React, { useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, FileCode2, ExternalLink } from 'lucide-react';

export interface DiffInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  techName: string;
  isVerified: boolean;
  evidence?: string;
  rawDiffSnippet?: string;
  unverifiedReason?: string;
}

export function DiffInspectorModal({
  isOpen,
  onClose,
  techName,
  isVerified,
  evidence,
  rawDiffSnippet,
  unverifiedReason,
}: DiffInspectorModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const diffLines = (rawDiffSnippet || '').split('\n');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-indigo-400" />
              <h3 id="diff-inspector-title" className="text-base font-bold text-white tracking-tight">
                Git Diff Verification Proof
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Target Technology: <span className="text-indigo-300 font-semibold">{techName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close diff modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Pill */}
        <div>
          {isVerified ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold tracking-wider font-mono uppercase">VERIFIED IN GIT DIFF</span>
                <span className="block text-emerald-200/90 text-[11px] mt-0.5">
                  Code modifications match the verified technology signature in commit history.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold tracking-wider font-mono uppercase">FLAGGED: UNVERIFIED CLAIM</span>
                <span className="block text-amber-200/90 text-[11px] mt-0.5">
                  {unverifiedReason || '0 matching files found in git commit tree. Flagged by ShipLog Anti-Hallucination Engine.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* File Anchor */}
        {evidence && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-500">Grounded in:</span>
            <span className="text-indigo-300 select-all">{evidence}</span>
          </div>
        )}

        {/* Diff Code Viewer */}
        {isVerified && diffLines.length > 0 && (
          <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950 border border-slate-850 p-4 font-mono text-xs leading-relaxed space-y-0.5">
            {diffLines.map((line, idx) => {
              const isAdd = line.startsWith('+') && !line.startsWith('+++');
              const isDel = line.startsWith('-') && !line.startsWith('---');
              const isHunk = line.startsWith('@@');

              const lineClass = isAdd
                ? 'text-emerald-400 bg-emerald-950/30'
                : isDel
                ? 'text-red-400 bg-red-950/30'
                : isHunk
                ? 'text-cyan-400 bg-cyan-950/20 font-bold'
                : 'text-slate-400';

              return (
                <div key={idx} className={`px-2 py-0.5 rounded ${lineClass} whitespace-pre overflow-x-auto`}>
                  {line}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>ShipLog Anti-Hallucination Verification</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
