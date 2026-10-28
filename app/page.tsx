'use client';
import React, { useState } from 'react';
import { Terminal, Settings, AlertCircle, X, Shield } from 'lucide-react';
import { VoiceInputArea } from '@/components/VoiceInputArea';
import { SettingsModal, SettingsState, DEFAULT_SETTINGS } from '@/components/SettingsModal';
import { SampleDataButton, SAMPLE_VOICE_TRANSCRIPT } from '@/components/SampleDataButton';
import { ArtifactsView, ArtifactsResult } from '@/components/ArtifactsView';
import { scrubSecrets } from '@/lib/security/scrubber';

export default function HomePage() {
  const [voiceText, setVoiceText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ArtifactsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (sampleOverride?: boolean) => {
    setIsLoading(true);
    setError(null);

    const transcriptToRun = sampleOverride ? SAMPLE_VOICE_TRANSCRIPT : voiceText;

    if (!transcriptToRun.trim()) {
      setError('Please provide a voice recap transcript before running.');
      setIsLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-provider-type': sampleOverride ? 'ollama' : settings.provider,
        'x-provider-key': sampleOverride ? '' : settings.key,
      };

      if (settings.baseUrl) {
        headers['x-provider-url'] = settings.baseUrl;
      }
      if (settings.model) {
        headers['x-provider-model'] = settings.model;
      }
      if (settings.githubToken) {
        headers['x-github-token'] = settings.githubToken;
      }

      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          voiceTranscript: transcriptToRun,
          isMockSample: Boolean(sampleOverride),
          repo: settings.githubToken ? 'user/repo' : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const rawErrMsg = data?.error || `Request failed with status ${res.status}`;
        setError(scrubSecrets(rawErrMsg));
      } else {
        setResult(data);
      }
    } catch (err: any) {
      const rawErrMsg = err?.message || 'Failed to communicate with agent service';
      setError(scrubSecrets(rawErrMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setVoiceText(SAMPLE_VOICE_TRANSCRIPT);
    handleSubmit(true);
  };

  const providerLabel =
    settings.provider === 'ollama'
      ? 'Ollama (Local Air-Gapped)'
      : settings.provider === 'gemini'
      ? 'Gemini (BYOK)'
      : settings.provider === 'openai'
      ? 'OpenAI (BYOK)'
      : 'Claude (BYOK)';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      <main className="w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 space-y-6">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">ShipLog</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                agentic-v1
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-medium">
                <Shield className="w-3 h-3 text-emerald-400" />
                Zero-Persistence
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              60s Voice Dev Journal → Verified Portfolio, Standup & Decision Log
            </p>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <SampleDataButton
              onLoadSample={handleLoadSample}
              isLoading={isLoading}
            />
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
              title="Configure Model & Security Settings"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline font-mono text-[11px] text-slate-400">
                {providerLabel}
              </span>
            </button>
          </div>
        </header>

        {/* Secret-Sanitized Error Banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm shadow-lg animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-300 text-xs uppercase tracking-wider">
                Execution Error
              </h4>
              <p className="text-xs text-red-200/90 mt-1 font-mono leading-relaxed break-all">
                {scrubSecrets(error)}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-900/40 transition"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Voice Input Section */}
        <VoiceInputArea
          value={voiceText}
          onChange={setVoiceText}
          onSubmit={() => handleSubmit(false)}
          isLoading={isLoading}
        />

        {/* Rendered Artifacts Section */}
        <ArtifactsView result={result} />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={setSettings}
          initialSettings={settings}
        />
      </main>
    </div>
  );
}
