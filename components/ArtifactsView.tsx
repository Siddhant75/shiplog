'use client';
import React, { useState } from 'react';
import {
  Briefcase,
  ListTodo,
  GitCommit,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Hash,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

export interface ArtifactsResult {
  entryId?: string;
  date?: string;
  success?: boolean;
  artifacts: {
    portfolio: {
      title: string;
      techStack: string[];
      impact: string;
      challengeSolved?: string;
    };
    standup: {
      yesterday: string;
      today: string;
      blockers: string;
    };
    decisionLog: Array<{
      decision: string;
      rationale: string;
      evidence: string;
    }>;
  };
  reasoningTrace: string[];
  verification?: {
    verifiedTech: string[];
    hallucinatedTech: string[];
    commitCoverage?: {
      covered: string[];
      unmentioned: string[];
    };
  };
}

export interface ArtifactsViewProps {
  result: ArtifactsResult | null;
}

export function ArtifactsView({ result }: ArtifactsViewProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'standup' | 'decisions' | 'trace'>('portfolio');

  if (!result || !result.artifacts) return null;

  const { artifacts, reasoningTrace = [], verification, entryId, date } = result;
  const portfolio = artifacts.portfolio || { title: '', techStack: [], impact: '' };
  const standup = artifacts.standup || { yesterday: '', today: '', blockers: '' };
  const decisionLog = artifacts.decisionLog || [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-sm space-y-5 animate-in fade-in duration-200">
      {/* Top Meta Header: Entry ID & Timestamp Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {entryId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>{entryId}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{date || new Date().toISOString().split('T')[0]}</span>
          </span>
          {verification?.verifiedTech && verification.verifiedTech.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Work
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 font-mono">
          <span>Autonomous Loop Complete</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div role="tablist" aria-label="Recap artifact views" className="flex flex-wrap border-b border-slate-800 pb-2 gap-1.5">
        <button
          id="tab-portfolio"
          role="tab"
          aria-selected={activeTab === 'portfolio'}
          aria-controls="panel-portfolio"
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'portfolio'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Portfolio Card</span>
        </button>

        <button
          id="tab-standup"
          role="tab"
          aria-selected={activeTab === 'standup'}
          aria-controls="panel-standup"
          type="button"
          onClick={() => setActiveTab('standup')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'standup'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Standup Update</span>
        </button>

        <button
          id="tab-decisions"
          role="tab"
          aria-selected={activeTab === 'decisions'}
          aria-controls="panel-decisions"
          type="button"
          onClick={() => setActiveTab('decisions')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'decisions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Decision Log ({decisionLog.length})</span>
        </button>

        <button
          id="tab-trace"
          role="tab"
          aria-selected={activeTab === 'trace'}
          aria-controls="panel-trace"
          type="button"
          onClick={() => setActiveTab('trace')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'trace'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Reasoning Trace ({reasoningTrace.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="text-sm">
        {/* Portfolio Card Tab */}
        {activeTab === 'portfolio' && (
          <div id="panel-portfolio" role="tabpanel" aria-labelledby="tab-portfolio" className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Project Contribution</span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {portfolio.title}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-300 leading-relaxed text-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Impact & Value</span>
              {portfolio.impact}
            </div>

            {portfolio.challengeSolved && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-1">Challenge Solved</span>
                {portfolio.challengeSolved}
              </div>
            )}

            {/* Tech Stack Pills (Verified vs Unverified) */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Technologies Used</span>
              <div className="flex flex-wrap gap-2">
                {(portfolio.techStack || []).map((tech) => {
                  const isVerified = verification?.verifiedTech?.includes(tech);
                  return (
                    <span
                      key={tech}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                        isVerified
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/50 shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {isVerified ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      )}
                      <span>{tech}</span>
                      {isVerified && <span className="text-[10px] text-emerald-400 font-mono">verified</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Standup Update Tab */}
        {activeTab === 'standup' && (
          <div id="panel-standup" role="tabpanel" aria-labelledby="tab-standup" className="space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Yesterday</span>
              </div>
              <p className="text-sm text-slate-200 pl-6 leading-relaxed">{standup.yesterday || 'None specified.'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Today</span>
              </div>
              <p className="text-sm text-slate-200 pl-6 leading-relaxed">{standup.today || 'None specified.'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Blockers</span>
              </div>
              <p className="text-sm text-slate-200 pl-6 leading-relaxed">{standup.blockers || 'None.'}</p>
            </div>

            {verification?.commitCoverage?.covered && verification.commitCoverage.covered.length > 0 && (
              <div className="pt-2 text-xs text-slate-400 font-mono">
                ✓ Cross-referenced against {verification.commitCoverage.covered.length} commit message(s)
              </div>
            )}
          </div>
        )}

        {/* Decision Log Tab */}
        {activeTab === 'decisions' && (
          <div id="panel-decisions" role="tabpanel" aria-labelledby="tab-decisions" className="space-y-3">
            {decisionLog.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No explicit decisions logged in this recap.</p>
            ) : (
              decisionLog.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[11px] font-mono font-semibold text-indigo-300 shrink-0">
                      #{idx + 1}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-100">{item.decision}</h4>
                  </div>
                  <div className="text-xs text-slate-300 pl-8 leading-relaxed">
                    <span className="text-slate-500 font-semibold mr-1">Rationale:</span>
                    {item.rationale}
                  </div>
                  {item.evidence && (
                    <div className="pl-8 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-400">
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                        Code Evidence: {item.evidence}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Reasoning Trace Tab with DOMPurify */}
        {activeTab === 'trace' && (
          <div id="panel-trace" role="tabpanel" aria-labelledby="tab-trace" className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>5-Step Autonomous Agent Execution Chain</span>
              <span className="text-[11px] text-emerald-400 font-mono">DOMPurify Active</span>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-2.5 overflow-x-auto">
              {reasoningTrace.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 leading-relaxed">
                  <span className="text-indigo-400 select-none font-bold shrink-0">
                    [{idx + 1}]
                  </span>
                  <span
                    className="flex-1"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(String(step ?? '')),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
