'use client';
import React, { useState } from 'react';
import {
  Briefcase,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Share2,
  Clock,
  Hash,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PortfolioShipItem, filterPortfolioByTech, searchPortfolio } from '@/lib/portfolio/data';

export interface PortfolioViewProps {
  ships: PortfolioShipItem[];
  onInspectDiff?: (tech: string, isVerified: boolean, evidence?: string, rawDiff?: string, reason?: string) => void;
  onToast?: (msg: string) => void;
}

const TECH_FILTER_CHIPS = ['All', 'WebSockets', 'TypeScript', 'Redis', 'PostgreSQL', 'Security'];

export function PortfolioView({ ships, onInspectDiff, onToast }: PortfolioViewProps) {
  const [selectedTech, setSelectedTech] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredByTech = filterPortfolioByTech(ships, selectedTech);
  const displayedShips = searchPortfolio(filteredByTech, searchQuery);

  const handleSharePortfolio = () => {
    const url = 'https://shiplog.dev/@alex-mercer';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    if (onToast) onToast('Portfolio link copied: https://shiplog.dev/@alex-mercer 🌐');
  };

  const handleCopyCard = (ship: PortfolioShipItem) => {
    const cardMd = [
      `### ${ship.title}`,
      `*Shipped on ${ship.date} • Verified in ${ship.evidence}*`,
      `- **Impact:** ${ship.impact}`,
      `- **Challenge Solved:** ${ship.challengeSolved}`,
      `- **Technologies:** ${ship.techStack.join(', ')}`,
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cardMd).catch(() => {});
    }
    if (onToast) onToast(`Copied "${ship.title}" markdown to clipboard!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Portfolio Public Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Briefcase className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Living Developer Portfolio</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-mono text-emerald-300">
                Public Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Alex Mercer <span className="text-slate-600">•</span> Senior Distributed Systems & Full-Stack Engineer
            </p>
          </div>

          <button
            type="button"
            onClick={handleSharePortfolio}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Portfolio</span>
          </button>
        </div>

        {/* Lifetime Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] font-mono text-slate-400">Total Ships</span>
            <div className="text-xl font-black text-white">{ships.length + 10} Verified Ships</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] font-mono text-slate-400">Core Stacks</span>
            <div className="text-xl font-black text-indigo-300">9 Technologies</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] font-mono text-slate-400">Grounding Rate</span>
            <div className="text-xl font-black text-emerald-300">100% Code Grounded</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] font-mono text-slate-400">Anti-Hallucination</span>
            <div className="text-xl font-black text-amber-300">Strict Git Diff Gate</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tech Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden md:inline">
            Filter by Technology:
          </span>
          {TECH_FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSelectedTech(chip)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedTech === chip
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified ships..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Shipped Cards Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedShips.map((ship) => (
          <div
            key={ship.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3.5 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Card Meta */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Hash className="w-3 h-3 text-indigo-400" />
                    {ship.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {ship.date}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCard(ship)}
                  title="Copy markdown card"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white tracking-tight">
                {ship.title}
              </h3>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5">
                {ship.techStack.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => {
                      if (onInspectDiff) {
                        onInspectDiff(tech, true, ship.evidence, ship.rawDiffSnippet);
                      }
                    }}
                    title="Click to view git diff proof"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:border-emerald-400 cursor-pointer transition active:scale-95"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{tech}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">verified</span>
                  </button>
                ))}

                {/* Flagged unverified tag if present */}
                {ship.unverifiedTech && ship.unverifiedTech.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => {
                      if (onInspectDiff) {
                        onInspectDiff(
                          tech,
                          false,
                          '',
                          '',
                          `Scanned git commits for "${ship.title}": 0 matching files or configs for ${tech}. Flagged as unverified.`
                        );
                      }
                    }}
                    title="Anti-Hallucination flag"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:border-amber-400 cursor-pointer transition active:scale-95"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span className="line-through opacity-80">{tech}</span>
                    <span className="text-[9px] text-amber-400 font-mono">unverified</span>
                  </button>
                ))}
              </div>

              {/* Impact */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 text-xs text-slate-300 leading-relaxed">
                <span className="text-slate-400 font-semibold block mb-0.5">Impact:</span>
                {ship.impact}
              </div>

              {/* Challenge Solved */}
              {ship.challengeSolved && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs text-amber-200/90 leading-relaxed">
                  <span className="text-amber-300 font-semibold block mb-0.5">Challenge Solved:</span>
                  {ship.challengeSolved}
                </div>
              )}
            </div>

            {/* Evidence Anchor Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400">
                <ExternalLink className="w-3 h-3" />
                {ship.evidence}
              </span>
              <span className="text-slate-600">Git Grounded</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
