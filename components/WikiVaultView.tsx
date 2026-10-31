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
  Search,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { WikiTopicHub, WIKI_TOPIC_HUBS } from '@/lib/wiki/data';

export interface WikiVaultViewProps {
  topicHubs?: WikiTopicHub[];
  onToast?: (msg: string) => void;
}

export function WikiVaultView({ topicHubs = WIKI_TOPIC_HUBS, onToast }: WikiVaultViewProps) {
  const [activeSlug, setActiveSlug] = useState<string>(topicHubs[0]?.slug || 'networking-realtime');
  const [searchQuery, setSearchQuery] = useState('');

  const activeHub = topicHubs.find((h) => h.slug === activeSlug) || topicHubs[0];

  const filteredHubs = topicHubs.filter((hub) =>
    hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hub.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hub.relatedTech.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Engineering Wiki Vault</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-[11px] font-mono text-indigo-300">
                Living Knowledge Graph
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
          <span className="flex items-center gap-1.5 text-indigo-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {topicHubs.length} Interconnected Topic Hubs
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
            5 Grounded Architectural Decisions
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            Immutable Verbatim Voice Vault
          </span>
        </div>
      </div>

      {/* Obsidian / GitBook Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Topic Hub Directory Sidebar (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Topic Knowledge Graph
              </span>
              <span className="text-[11px] font-mono text-indigo-400">
                {topicHubs.length} Nodes
              </span>
            </div>

            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter topic hubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Topic List */}
            <div className="space-y-2 pt-1">
              {filteredHubs.map((hub) => {
                const isSelected = hub.slug === activeSlug;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setActiveSlug(hub.slug)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all duration-200 block ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-mono font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {hub.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
                        {hub.adrs.length} ADR{hub.adrs.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {hub.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hub.relatedTech.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Obsidian Knowledge Tier Callout */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-300/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dual-Tier Knowledge Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Raw spoken journals are indexed into immutable voice cards, synthesized into validated ADRs, and cross-referenced with bi-directional <code className="text-indigo-300">[[wikilinks]]</code>.
            </p>
          </div>
        </div>

        {/* Right Column: Active Topic Documentation Canvas (Span 8) */}
        <div className="lg:col-span-8 space-y-5">
          {activeHub && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-6">
              {/* Active Hub Header */}
              <div className="space-y-3 pb-5 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-xs font-bold">
                      Topic Hub
                    </span>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {activeHub.name}
                    </h3>
                  </div>

                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Git-Anchored Record
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeHub.summary}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-mono text-slate-500 mr-1">Verified Technologies:</span>
                  {activeHub.relatedTech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 1: Architectural Decision Records */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <GitCommit className="w-4 h-4" />
                    <span>Architectural Decision Records (ADRs)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {activeHub.adrs.length} Recorded
                  </span>
                </div>

                <div className="space-y-3">
                  {activeHub.adrs.map((adr, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2.5 hover:border-slate-750 transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[10px] font-mono text-indigo-300 font-bold shrink-0 mt-0.5">
                          ADR #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-100 leading-snug">
                          {adr.decision}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                        <span className="text-slate-500 font-semibold mr-1">Rationale:</span>
                        {adr.rationale}
                      </p>

                      {adr.evidence && (
                        <div className="pl-8 pt-1">
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

              {/* Section 2: Immutable Verbatim Voice Vault */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Mic className="w-4 h-4" />
                    <span>Immutable Verbatim Voice Vault (Raw Audio Tier)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Raw Wispr Streams
                  </span>
                </div>

                <div className="space-y-3">
                  {activeHub.verbatimVault.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/90 border border-slate-850 space-y-2 hover:border-slate-750 transition"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="font-semibold text-slate-200">{item.title}</span>
                        <span className="text-slate-500">{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 italic border-l-2 border-cyan-500/50 pl-3 leading-relaxed">
                        &ldquo;{item.transcript}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
