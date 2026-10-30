'use client';
import React from 'react';
import { Mic } from 'lucide-react';

export interface WisprPulseProps {
  isListening?: boolean;
  className?: string;
}

export function WisprPulse({ isListening = false, className = '' }: WisprPulseProps) {
  return (
    <div
      data-active={isListening ? 'true' : 'false'}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
        isListening
          ? 'bg-cyan-950/70 border-cyan-500/60 shadow-lg shadow-cyan-500/20 text-cyan-200'
          : 'bg-slate-900/90 border-slate-800 text-slate-400'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
        {isListening && (
          <span className="absolute -inset-1 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Animated Waveform Equalizer Bars */}
      <div className="flex items-center gap-0.5 h-3">
        <span
          className={`w-0.5 rounded-full transition-all duration-200 ${
            isListening ? 'h-3 bg-cyan-400 animate-pulse' : 'h-1.5 bg-slate-600'
          }`}
        />
        <span
          className={`w-0.5 rounded-full transition-all duration-200 ${
            isListening ? 'h-4 bg-cyan-300 animate-bounce' : 'h-2 bg-slate-600'
          }`}
          style={{ animationDelay: '100ms' }}
        />
        <span
          className={`w-0.5 rounded-full transition-all duration-200 ${
            isListening ? 'h-2 bg-cyan-400 animate-pulse' : 'h-1 bg-slate-600'
          }`}
          style={{ animationDelay: '200ms' }}
        />
        <span
          className={`w-0.5 rounded-full transition-all duration-200 ${
            isListening ? 'h-3.5 bg-violet-400 animate-bounce' : 'h-2.5 bg-slate-600'
          }`}
          style={{ animationDelay: '150ms' }}
        />
        <span
          className={`w-0.5 rounded-full transition-all duration-200 ${
            isListening ? 'h-2 bg-cyan-400 animate-pulse' : 'h-1 bg-slate-600'
          }`}
          style={{ animationDelay: '300ms' }}
        />
      </div>

      <span className="text-[11px] font-mono tracking-tight">
        {isListening ? (
          <span className="font-semibold text-cyan-300">Wispr Flow Dictating Active</span>
        ) : (
          <span>
            Wispr Flow <span className="text-slate-500">•</span> Hold Hotkey to Speak
          </span>
        )}
      </span>
    </div>
  );
}
