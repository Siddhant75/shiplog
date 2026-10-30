'use client';
import React, { useState } from 'react';
import {
  BookOpen,
  GitCommit,
  Mic,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  FileCode,
} from 'lucide-react';
import { WikiTopicHub, WIKI_TOPIC_HUBS } from '@/lib/wiki/data';

export interface WikiVaultViewProps {
  topicHubs?: WikiTopicHub[];
  onToast?: (msg: string) => void;
}

export function WikiVaultView({ topicHubs = WIKI_TOPIC_HUBS, onToast }: WikiVaultViewProps) {
  const [activeSlug, setActiveSlug] = useState<string>(topicHubs[0]?.slug || 'networking-realtime');

  const activeHub = topicHubs.find((h) => h.slug === activeSlug) || topicHubs[0];

  const handleExportTopic = () => {
    if (!activeHub) return;
    const text = [
      `# ${activeHub.name}`,
      `*Summary:* ${activeHub.summary}`,
      '',
      `## Architectural Decisions`,
      ...activeHub.adrs.map(
        (a, i) => `### ADR #${i + 1}: ${a.decision}\n- **Rationale:** ${a.rationale}\n- **Evidence:** \`${a.evidence}\``
      ),
      '',
      `## Verbatim Raw Spoken Transcript`,
      ...activeHub.verbatimVault.map((v) => `### ${v.date}: ${v.title}\n> "${v.transcript}"`),
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (onToast) onToast(`Exported ${activeHub.name} topic markdown to clipboard! 🧠`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Wiki Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Engineering Wiki Vault</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-[11px] font-mono text-indigo-300">
                LLM Wiki Pattern
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Living system knowledge compiled continuously from daily voice logs and grounded git diffs
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportTopic}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Export Topic Markdown</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
          <span>• 3 Interconnected Topic Hubs</span>
          <span>• 5 Architectural Decisions</span>
          <span>• Immutable Verbatim Transcript Tier</span>
        </div>
      </div>

      {/* Topic Hub Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topicHubs.map((hub) => {
          const isSelected = hub.slug === activeSlug;
          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => setActiveSlug(hub.slug)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {hub.name}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {hub.summary}
              </p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {hub.relatedTech.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Hub Knowledge Body */}
      {activeHub && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{activeHub.name}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeHub.summary}
            </p>
          </div>

          {/* Section 1: ADR Records */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <GitCommit className="w-4 h-4" />
              <span>Architectural Decision Records (ADRs)</span>
            </div>

            <div className="space-y-3">
              {activeHub.adrs.map((adr, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2 hover:border-slate-750 transition"
                >
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[10px] font-mono text-indigo-300 font-bold">
                      ADR #{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{adr.decision}</h4>
                  </div>
                  <p className="text-xs text-slate-300 pl-7 leading-relaxed">
                    <span className="text-slate-500 font-semibold mr-1">Rationale:</span>
                    {adr.rationale}
                  </p>
                  {adr.evidence && (
                    <div className="pl-7 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-400">
                        <ExternalLink className="w-3 h-3" />
                        Code Evidence Anchor: {adr.evidence}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Verbatim Voice Vault */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Mic className="w-4 h-4" />
              <span>Immutable Verbatim Voice Vault (MemPalace Write Tier)</span>
            </div>

            <div className="space-y-2.5">
              {activeHub.verbatimVault.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/90 border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-semibold text-slate-200">{item.title}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 italic border-l-2 border-cyan-500/40 pl-3 leading-relaxed">
                    &ldquo;{item.transcript}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
