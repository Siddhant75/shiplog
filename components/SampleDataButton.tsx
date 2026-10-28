'use client';
import React from 'react';
import { Zap, Loader2 } from 'lucide-react';

export const SAMPLE_VOICE_TRANSCRIPT =
  'Today I shipped the resilient WebSocket reconnection mechanism using exponential backoff with full jitter in TypeScript. This prevents server reconnect storms on restart, improving client recovery during deployments.';

export interface SampleDataButtonProps {
  onLoadSample: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SampleDataButton({
  onLoadSample,
  disabled = false,
  isLoading = false,
}: SampleDataButtonProps) {
  return (
    <button
      type="button"
      onClick={onLoadSample}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label="Load verified sample recap scenario"
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-amber-300 text-xs font-semibold shadow-sm transition group"
      title="Run verified sample recap without requiring cloud API keys or local LLM setup"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
      ) : (
        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
      )}
      <span>⚡ Try Sample Scenario (1-Click Judge Demo)</span>
    </button>
  );
}
