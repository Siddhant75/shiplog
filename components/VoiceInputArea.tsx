'use client';
import React from 'react';
import { Mic, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export interface VoiceInputAreaProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function VoiceInputArea({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled = false,
}: VoiceInputAreaProps) {
  const isSubmitDisabled = isLoading || disabled || !value.trim();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm space-y-3.5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Mic className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Daily Voice Recap</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-medium">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                Wispr Flow Ready
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Speak using Wispr hotkey or type
        </span>
      </div>

      {/* Transcript Textarea */}
      <div className="relative">
        <textarea
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Hold your Wispr Flow hotkey and talk through your day: what you shipped, technical challenges solved, decisions made..."
          className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition resize-y font-normal"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span>Tip: Tap your Wispr Flow hotkey from anywhere to dictate.</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-semibold text-xs text-white shadow-lg shadow-indigo-600/25 transition"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Agent Running...</span>
            </>
          ) : (
            <>
              <span>Ship Entry</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
