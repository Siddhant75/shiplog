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
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { PortfolioShipItem, filterPortfolioByTech, searchPortfolio } from '@/lib/portfolio/data';

export interface PortfolioViewProps {
  ships: PortfolioShipItem[];
  onOpenCaseStudy?: (ship: PortfolioShipItem) => void;
  onInspectDiff?: (tech: string, isVerified: boolean, evidence?: string, rawDiff?: string, reason?: string) => void;
  onToast?: (msg: string) => void;
}

const TECH_FILTER_CHIPS = ['All', 'WebSockets', 'TypeScript', 'Redis', 'PostgreSQL', 'Security'];

export function PortfolioView({ ships, onOpenCaseStudy, onInspectDiff, onToast }: PortfolioViewProps) {
  const [selectedTech, setSelectedTech] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredByTech = filterPortfolioByTech(ships, selectedTech);
  const displayedShips = searchPortfolio(filteredByTech, searchQuery);
  const featuredShip = ships[0] || null;

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
      {/* Portfolio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Living Developer Portfolio</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] font-mono text-emerald-300">
              Verified Dev
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Alex Mercer <span className="text-slate-600">•</span> Senior Distributed Systems & Full-Stack Engineer
          </p>
        </div>

        <button
          type="button"
          onClick={handleSharePortfolio}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 active:scale-95 transition shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Portfolio</span>
        </button>
      </div>

      {/* Modern Developer Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bento Tile 1: Featured Ship Hero Card (Span 2 Cols) */}
        {featuredShip && (
          <div className="lg:col-span-2 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold uppercase">
                    ⭐ Flagship Verified Ship
                  </span>
                  <span className="text-slate-500 text-xs font-mono">• {featuredShip.date}</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Git Grounded
                </span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight">
                {featuredShip.title}
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {featuredShip.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {tech}
                  </span>
                ))}
                {featuredShip.unverifiedTech?.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800 line-through opacity-80"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {tech}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {featuredShip.impact}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-slate-500">
                Anchored in <span className="text-indigo-400">{featuredShip.evidence}</span>
              </span>
              <button
                type="button"
                onClick={() => onOpenCaseStudy && onOpenCaseStudy(featuredShip)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition"
              >
                <span>Open Project Case Study</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Bento Column: Telemetry + Tech Radar */}
        <div className="space-y-4">
          {/* Tile 2: Verification Telemetry */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Verification Telemetry
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block">Total Ships</span>
                <span className="text-lg font-black text-white">{ships.length + 10} Verified</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block">Grounding Rate</span>
                <span className="text-lg font-black text-emerald-400">100%</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Strict code diff gate: 0 false buzzwords permitted.</span>
            </div>
          </div>

          {/* Tile 3: Tech Stack Frequency Radar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Core Stack Radar
              </span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>TypeScript</span>
                  <span className="text-indigo-400">42%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>WebSockets & Real-Time</span>
                  <span className="text-cyan-400">28%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '28%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Redis & Caching</span>
                  <span className="text-violet-400">20%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-violet-400 h-full rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
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

        <div className="relative min-w-[240px]">
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

      {/* Shipped Cards Gallery (3-Column Responsive Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedShips.map((ship) => (
          <div
            key={ship.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Hash className="w-3 h-3 text-indigo-400" />
                  {ship.id}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  {ship.date}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                {ship.title}
              </h4>

              <div className="flex flex-wrap gap-1">
                {ship.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    {tech}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {ship.impact}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpenCaseStudy && onOpenCaseStudy(ship)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Read Case Study</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => handleCopyCard(ship)}
                title="Copy markdown card"
                className="p-1 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
