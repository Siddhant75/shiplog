'use client';
import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  ShieldCheck,
  CheckCircle2,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResumeBulletPoint,
  DEFAULT_BASE_RESUME,
  synthesizeUpdatedResume,
  generateQuarterlyBragDoc,
} from '@/lib/resume/engine';
import { HISTORICAL_SHIPS } from '@/lib/portfolio/data';

export interface ResumeSyncViewProps {
  bullets?: ResumeBulletPoint[];
  onToast?: (msg: string) => void;
}

export function ResumeSyncView({ bullets = [], onToast }: ResumeSyncViewProps) {
  const [activeTab, setActiveTab] = useState<'resume' | 'brag'>('resume');

  const revision = synthesizeUpdatedResume(DEFAULT_BASE_RESUME, bullets);
  const bragDocText = generateQuarterlyBragDoc(
    HISTORICAL_SHIPS.map((s) => ({
      title: s.title,
      techStack: s.techStack,
      impact: s.impact,
      challengeSolved: s.challengeSolved,
    }))
  );

  const handleCopyBullets = () => {
    if (bullets.length === 0) return;
    const text = bullets.map((b) => `- ${b.bullet}`).join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (onToast) onToast('Copied Google XYZ resume bullets to clipboard! 📄');
  };

  const handleDownloadResume = () => {
    const blob = new Blob([revision.updatedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alex-Mercer-Resume-Updated-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast('Downloaded updated markdown resume! 💾');
  };

  const handleCopyBragDoc = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bragDocText).catch(() => {});
    }
    if (onToast) onToast('Copied Quarterly Brag Document to clipboard! 🏆');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Resume Sync Sub-Agent</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-mono text-emerald-300">
                Autonomous Career Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuously converts verified daily shipments into high-impact Google XYZ resume bullets & brag documents
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBullets}
              disabled={bullets.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md active:scale-95 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Bullets</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadResume}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MD</span>
            </button>
          </div>
        </div>

        {/* ATS Score & Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider block text-emerald-400 font-bold">
                  ATS Impact Score
                </span>
                <span className="text-lg font-black text-white">{revision.atsScore}/100</span>
                <span className="text-[10px] text-emerald-300/80 ml-2 font-mono">
                  Strong Action Verbs & Metrics
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            <span>Formula: Accomplished [X] as measured by [Y] by doing [Z]</span>
          </div>
        </div>
      </div>

      {/* Generated Google XYZ Bullets Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Google XYZ-Formula Bullets (Synthesized from Code Grounding)</span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {bullets.length} Active Bullet{bullets.length === 1 ? '' : 's'}
          </span>
        </div>

        {bullets.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 text-center text-xs text-slate-400 italic">
            Ship today&apos;s voice recap to watch the Resume Sub-Agent formulate a new Google XYZ bullet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {bullets.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-100 font-medium leading-relaxed">{b.bullet}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-6 pt-1 text-[11px] font-mono text-slate-400">
                  <span className="text-emerald-400">Category: {b.category}</span>
                  <span>•</span>
                  <span>Verified Tech: {b.verifiedTech.join(', ')}</span>
                  <span>•</span>
                  <span>Date: {b.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switcher: ATS Resume vs Brag Doc */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('resume')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'resume'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              ATS Resume Revision
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brag')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'brag'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Quarterly Brag Document
            </button>
          </div>

          {activeTab === 'brag' && (
            <button
              type="button"
              onClick={handleCopyBragDoc}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Brag Doc</span>
            </button>
          )}
        </div>

        {/* Markdown Preview Area */}
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-850 font-mono text-xs text-slate-300 leading-relaxed max-h-[420px] overflow-y-auto whitespace-pre-wrap select-all">
          {activeTab === 'resume' ? revision.updatedMarkdown : bragDocText}
        </div>
      </div>
    </div>
  );
}
