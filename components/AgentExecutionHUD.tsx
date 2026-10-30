'use client';
import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Shield, Cpu, GitBranch, FileSpreadsheet } from 'lucide-react';

export interface AgentExecutionHUDProps {
  isRunning: boolean;
  currentStep?: number;
}

export const AGENT_STEPS = [
  {
    step: 1,
    title: 'Pre-flight secret scrubber running (0 leaks detected)',
    icon: Shield,
    subtext: 'Scanning voice transcript and diffs with regex redaction rules',
  },
  {
    step: 2,
    title: 'Ingesting repository diff context & commit history',
    icon: GitBranch,
    subtext: 'Loading commit SHAs, file paths, and syntax changes',
  },
  {
    step: 3,
    title: 'Multi-format synthesis (Portfolio, Standup, ADR, Resume)',
    icon: Cpu,
    subtext: 'Extracting quantified impact and Google XYZ formula bullets',
  },
  {
    step: 4,
    title: 'Cross-referencing tech tags against git tree (Anti-Hallucination)',
    icon: Sparkles,
    subtext: 'Validating declared technologies against actual changed lines',
  },
  {
    step: 5,
    title: 'Updating Living Portfolio, Wiki Index & Resume revision',
    icon: FileSpreadsheet,
    subtext: 'Persisting verbatim raw log and compiling navigable topics',
  },
];

export function AgentExecutionHUD({ isRunning, currentStep = 1 }: AgentExecutionHUDProps) {
  if (!isRunning) return null;

  const progressPercent = Math.min(100, Math.max(15, currentStep * 20));

  return (
    <div
      data-step={currentStep}
      className="w-full rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Autonomous Agent Execution Pipeline
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Real-time multi-agent reasoning, verification & compilation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-400">
            {progressPercent}%
          </span>
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stepper Milestones */}
      <div className="space-y-2.5 pt-1">
        {AGENT_STEPS.map((item) => {
          const isDone = item.step < currentStep;
          const isActive = item.step === currentStep;
          const isPending = item.step > currentStep;

          return (
            <div
              key={item.step}
              className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-950/40 border border-indigo-500/40 shadow-sm'
                  : isDone
                  ? 'bg-slate-950/40 border border-slate-850'
                  : 'opacity-40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-600">
                    {item.step}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-semibold ${
                      isActive
                        ? 'text-cyan-200'
                        : isDone
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    Step {item.step}: {item.title}
                  </h4>
                  {isActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  {item.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
