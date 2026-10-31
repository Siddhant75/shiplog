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
  TrendingUp,
  Cpu,
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

  const handleCopySingleBullet = (bulletText: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`- ${bulletText}`).catch(() => {});
    }
    if (onToast) onToast('Copied bullet to clipboard! 📋');
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
              <h2 className="text-xl font-bold text-white tracking-tight">Resume Sync Sub-Agent</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-mono text-emerald-300">
                Autonomous Career Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuously converts verified daily shipments into high-impact Google XYZ resume bullets & brag documents
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

        {/* ATS Score & Grounding Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-3">
            <Award className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                ATS Impact Score
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{revision.atsScore}/100</span>
                <span className="text-[10px] font-mono text-emerald-300">Top 5% Tier</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Google XYZ Formula
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Accomplished [X] by [Z]
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Code Verification
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                100% Diff-Grounded Claims
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Split-Screen Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Synthesized Impact Bullets Feed (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>Google XYZ-Formula Bullets</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {bullets.length} Active
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesized automatically by the Resume Sub-Agent from your verified diff evidence:
            </p>

            {bullets.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-850 text-center text-xs text-slate-400 italic">
                Ship today&apos;s voice recap to watch the Resume Sub-Agent formulate a new Google XYZ bullet.
              </div>
            ) : (
              <div className="space-y-3">
                {bullets.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 text-xs shadow-md group hover:border-emerald-500/60 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-slate-100 font-medium leading-relaxed flex-1">
                        {b.bullet}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px]">
                          {b.category}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{b.verifiedTech.join(', ')}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySingleBullet(b.bullet)}
                        title="Copy this bullet"
                        className="text-slate-500 hover:text-indigo-400 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Julia Evans Brag Doc Pattern Info */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Julia Evans Brag Document Pattern</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Engineers often forget 80% of what they built by review season. ShipLog compiles an immutable quarterly brag doc ready for senior/staff promotion packets.
            </p>
          </div>
        </div>

        {/* Right Column: Live Document Studio (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-4">
            {/* Studio Tabs & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
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

              {activeTab === 'brag' ? (
                <button
                  type="button"
                  onClick={handleCopyBragDoc}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition self-start sm:self-auto"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Brag Doc</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Auto-Formatted Markdown
                </span>
              )}
            </div>

            {/* Live Document Preview Box */}
            <div className="relative rounded-xl bg-slate-950 p-5 border border-slate-850 font-mono text-xs text-slate-300 leading-relaxed max-h-[560px] overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
              {activeTab === 'resume' ? revision.updatedMarkdown : bragDocText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
