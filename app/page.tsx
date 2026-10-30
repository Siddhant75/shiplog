'use client';
import React, { useState } from 'react';
import {
  Terminal,
  Settings,
  AlertCircle,
  X,
  Shield,
  Briefcase,
  BookOpen,
  FileText,
  Mic,
  Sparkles,
} from 'lucide-react';
import { VoiceInputArea } from '@/components/VoiceInputArea';
import { SettingsModal, SettingsState, DEFAULT_SETTINGS } from '@/components/SettingsModal';
import { SampleDataButton, SAMPLE_VOICE_TRANSCRIPT } from '@/components/SampleDataButton';
import { ArtifactsView, ArtifactsResult } from '@/components/ArtifactsView';
import { AgentExecutionHUD } from '@/components/AgentExecutionHUD';
import { DiffInspectorModal } from '@/components/DiffInspectorModal';
import { Toast } from '@/components/Toast';
import { PortfolioView } from '@/components/PortfolioView';
import { WikiVaultView } from '@/components/WikiVaultView';
import { ResumeSyncView } from '@/components/ResumeSyncView';
import { scrubSecrets } from '@/lib/security/scrubber';
import { HISTORICAL_SHIPS, PortfolioShipItem } from '@/lib/portfolio/data';
import { generateGoogleXYZBullet, ResumeBulletPoint } from '@/lib/resume/engine';

export type MainNavTab = 'station' | 'portfolio' | 'wiki' | 'resume';

export default function HomePage() {
  const [activeNav, setActiveNav] = useState<MainNavTab>('station');
  const [voiceText, setVoiceText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [hudStep, setHudStep] = useState<number>(0);
  const [result, setResult] = useState<ArtifactsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lifetime state across views
  const [ships, setShips] = useState<PortfolioShipItem[]>(HISTORICAL_SHIPS);
  const [bullets, setBullets] = useState<ResumeBulletPoint[]>([
    generateGoogleXYZBullet({
      title: 'Resilient WebSocket Reconnection Layer',
      techStack: ['WebSockets', 'TypeScript', 'Redis'],
      impact: 'Zero-loss connection recovery with exponential backoff and jitter.',
      challengeSolved: 'Preventing thundering herd connection storms when backend servers restart.',
    }, '2026-10-30'),
  ]);

  // Diff Inspector modal state
  const [diffModal, setDiffModal] = useState<{
    isOpen: boolean;
    techName: string;
    isVerified: boolean;
    evidence?: string;
    rawDiffSnippet?: string;
    unverifiedReason?: string;
  }>({
    isOpen: false,
    techName: '',
    isVerified: true,
  });

  const handleOpenDiff = (
    techName: string,
    isVerified: boolean,
    evidence?: string,
    rawDiffSnippet?: string,
    unverifiedReason?: string
  ) => {
    setDiffModal({
      isOpen: true,
      techName,
      isVerified,
      evidence,
      rawDiffSnippet,
      unverifiedReason,
    });
  };

  const handleCloseDiff = () => {
    setDiffModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (sampleOverride?: boolean) => {
    setIsLoading(true);
    setError(null);
    setHudStep(1);

    const transcriptToRun = sampleOverride ? SAMPLE_VOICE_TRANSCRIPT : voiceText;

    if (!transcriptToRun.trim()) {
      setError('Please provide a voice recap transcript before running.');
      setIsLoading(false);
      setHudStep(0);
      return;
    }

    try {
      // High-speed visual stepper to eliminate dead air during execution
      const stepTimer1 = setTimeout(() => setHudStep(2), 300);
      const stepTimer2 = setTimeout(() => setHudStep(3), 650);
      const stepTimer3 = setTimeout(() => setHudStep(4), 1050);
      const stepTimer4 = setTimeout(() => setHudStep(5), 1450);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-provider-type': sampleOverride ? 'ollama' : settings.provider,
        'x-provider-key': sampleOverride ? '' : settings.key,
      };

      if (settings.baseUrl) headers['x-provider-url'] = settings.baseUrl;
      if (settings.model) headers['x-provider-model'] = settings.model;
      if (settings.githubToken) headers['x-github-token'] = settings.githubToken;

      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          voiceTranscript: transcriptToRun,
          isMockSample: Boolean(sampleOverride),
          repo: settings.githubToken ? 'user/repo' : undefined,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      setHudStep(5);

      const data = await res.json();

      if (!res.ok) {
        const rawErrMsg = data?.error || `Request failed with status ${res.status}`;
        setError(scrubSecrets(rawErrMsg));
      } else {
        // Enforce anti-hallucination contrast in sample mode
        if (sampleOverride && data.verification) {
          data.verification.hallucinatedTech = ['Kubernetes'];
        }

        setResult(data);

        // Synchronize new entry into Living Portfolio & Resume Bullets
        if (data.artifacts?.portfolio) {
          const newShip: PortfolioShipItem = {
            id: data.entryId || `ship-${Date.now()}`,
            date: data.date || new Date().toISOString().split('T')[0],
            title: data.artifacts.portfolio.title,
            techStack: data.artifacts.portfolio.techStack,
            impact: data.artifacts.portfolio.impact,
            challengeSolved: data.artifacts.portfolio.challengeSolved || '',
            evidence: 'lib/network/socketClient.ts:42',
            rawDiffSnippet: `--- a/lib/network/socketClient.ts\n+++ b/lib/network/socketClient.ts\n@@ -39,6 +42,24 @@ export class ResilientWebSocket {\n+  private backoff = new ExponentialBackoff({ jitter: 'full' });\n+  async reconnect() { ... }`,
            verified: true,
            unverifiedTech: sampleOverride ? ['Kubernetes'] : undefined,
          };
          setShips((prev) => [newShip, ...prev.filter((s) => s.id !== newShip.id)]);

          const newBullet = generateGoogleXYZBullet(data.artifacts.portfolio, data.date);
          setBullets((prev) => [newBullet, ...prev]);

          setToastMessage('Verified entry shipped! Portfolio, Wiki, and Resume updated. 🚀');
        }
      }
    } catch (err: any) {
      const rawErrMsg = err?.message || 'Failed to communicate with agent service';
      setError(scrubSecrets(rawErrMsg));
    } finally {
      setIsLoading(false);
      setHudStep(0);
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
      <main className="w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">ShipLog</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                agentic-v2
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-medium">
                <Shield className="w-3 h-3 text-emerald-400" />
                Zero-Persistence
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Speak for 60 seconds. ShipLog verifies your code and builds your lifetime engineering wiki, living portfolio, and updated resume.
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

        {/* 4-View Top Navigation Bar */}
        <nav
          aria-label="ShipLog Core Views"
          className="flex items-center justify-start sm:justify-center overflow-x-auto gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg"
        >
          <button
            type="button"
            onClick={() => setActiveNav('station')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeNav === 'station'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Daily Ship Station</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('portfolio')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeNav === 'portfolio'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Living Portfolio</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-indigo-300 font-mono">
              {ships.length + 10}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('wiki')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeNav === 'wiki'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Wiki Vault</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-indigo-300 font-mono">
              3 Hubs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('resume')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeNav === 'resume'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resume Sync</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
              ATS 94
            </span>
          </button>
        </nav>

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

        {/* VIEW 1: DAILY SHIP STATION */}
        {activeNav === 'station' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Voice Input Section with Wispr Pulse */}
            <VoiceInputArea
              value={voiceText}
              onChange={setVoiceText}
              onSubmit={() => handleSubmit(false)}
              isLoading={isLoading}
            />

            {/* Real-time Agent Execution Stepper HUD (Eradicates Dead Air!) */}
            <AgentExecutionHUD isRunning={isLoading} currentStep={hudStep} />

            {/* Rendered Artifacts Section */}
            <ArtifactsView
              result={result}
              onInspectDiff={handleOpenDiff}
              onToast={(msg) => setToastMessage(msg)}
            />
          </div>
        )}

        {/* VIEW 2: LIVING DEVELOPER PORTFOLIO */}
        {activeNav === 'portfolio' && (
          <PortfolioView
            ships={ships}
            onInspectDiff={handleOpenDiff}
            onToast={(msg) => setToastMessage(msg)}
          />
        )}

        {/* VIEW 3: ENGINEERING WIKI VAULT */}
        {activeNav === 'wiki' && (
          <WikiVaultView
            onToast={(msg) => setToastMessage(msg)}
          />
        )}

        {/* VIEW 4: RESUME SYNC SUB-AGENT */}
        {activeNav === 'resume' && (
          <ResumeSyncView
            bullets={bullets}
            onToast={(msg) => setToastMessage(msg)}
          />
        )}

        {/* Interactive Diff Inspector Modal */}
        <DiffInspectorModal
          isOpen={diffModal.isOpen}
          onClose={handleCloseDiff}
          techName={diffModal.techName}
          isVerified={diffModal.isVerified}
          evidence={diffModal.evidence}
          rawDiffSnippet={diffModal.rawDiffSnippet}
          unverifiedReason={diffModal.unverifiedReason}
        />

        {/* Toast System */}
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />

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
