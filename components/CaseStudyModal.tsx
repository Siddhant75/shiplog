'use client';
import React, { useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Briefcase,
  GitCommit,
  ExternalLink,
  Copy,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';
import { PortfolioShipItem } from '@/lib/portfolio/data';

export interface CaseStudyModalProps {
  isOpen: boolean;
  ship: PortfolioShipItem | null;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export function CaseStudyModal({ isOpen, ship, onClose, onToast }: CaseStudyModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ship) return null;

  const handleCopy = () => {
    const text = [
      `# Project Case Study: ${ship.title}`,
      `**Date:** ${ship.date} • **Evidence:** \`${ship.evidence}\``,
      `**Verified Technologies:** ${ship.techStack.join(', ')}`,
      '',
      `## Business Impact & Value`,
      ship.impact,
      '',
      `## Engineering Challenge Solved`,
      ship.challengeSolved,
      '',
      `## Grounded Code Diff Snippet`,
      '```diff',
      ship.rawDiffSnippet || 'N/A',
      '```',
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (onToast) onToast(`Copied "${ship.title}" case study markdown! 📄`);
  };

  const diffLines = (ship.rawDiffSnippet || '').split('\n');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Briefcase className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Project Case Study
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Git Grounded
              </span>
            </div>
            <h2 id="case-study-title" className="text-xl font-bold text-white tracking-tight">
              {ship.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              title="Copy markdown case study"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Markdown</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close case study modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs leading-relaxed">
          {/* Tech Stack Pills */}
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
              Verified Technology Stack
            </span>
            <div className="flex flex-wrap gap-2">
              {ship.techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-medium text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {tech}
                  <span className="text-[10px] text-emerald-400 font-mono">verified</span>
                </span>
              ))}
              {ship.unverifiedTech?.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 font-medium text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="line-through opacity-80">{tech}</span>
                  <span className="text-[10px] text-amber-400 font-mono">unverified</span>
                </span>
              ))}
            </div>
          </div>

          {/* Section 1: Business Impact & Value */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Business Impact & Value</span>
            </div>
            <p className="text-slate-200 text-sm pl-6 leading-relaxed">
              {ship.impact}
            </p>
          </div>

          {/* Section 2: Engineering Challenge Solved */}
          {ship.challengeSolved && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Engineering Challenge Solved</span>
              </div>
              <p className="text-amber-200/90 text-sm pl-6 leading-relaxed">
                {ship.challengeSolved}
              </p>
            </div>
          )}

          {/* Section 3: Grounded Code Diff Proof */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <FileCode2 className="w-4 h-4" />
                Grounded Code Diff Proof
              </span>
              <span className="text-slate-500">File: {ship.evidence}</span>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-850 p-4 font-mono text-xs leading-relaxed space-y-0.5 overflow-x-auto max-h-56">
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
                  <div key={idx} className={`px-2 py-0.5 rounded ${lineClass} whitespace-pre`}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>ShipLog Dev Memory • Verified Proof of Work</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
