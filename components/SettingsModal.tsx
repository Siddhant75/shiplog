'use client';
import React, { useState, useEffect } from 'react';
import { Shield, Key, Server, X, Lock } from 'lucide-react';

export interface SettingsState {
  provider: 'ollama' | 'gemini' | 'openai' | 'anthropic';
  key: string;
  baseUrl?: string;
  model?: string;
  githubToken: string;
}

export const DEFAULT_SETTINGS: SettingsState = {
  provider: 'ollama',
  key: '',
  baseUrl: '',
  model: '',
  githubToken: '',
};

export interface ProviderOption {
  id: 'ollama' | 'gemini' | 'openai' | 'anthropic';
  label: string;
  requiresKey: boolean;
  hint: string;
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: 'ollama',
    label: 'Ollama (100% Air-Gapped Local, No Key required)',
    requiresKey: false,
    hint: 'Runs entirely on your local machine. No data leaves your computer.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini (BYOK)',
    requiresKey: true,
    hint: 'Uses your personal Google AI Studio / Gemini API key.',
  },
  {
    id: 'openai',
    label: 'OpenAI (BYOK)',
    requiresKey: true,
    hint: 'Uses your personal OpenAI API key (gpt-4o-mini).',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude (BYOK)',
    requiresKey: true,
    hint: 'Uses your personal Anthropic API key.',
  },
];

export function isCloudProvider(provider: string): boolean {
  return provider !== 'ollama';
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: SettingsState) => void;
  initialSettings?: Partial<SettingsState>;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: SettingsModalProps) {
  const [provider, setProvider] = useState<'ollama' | 'gemini' | 'openai' | 'anthropic'>(
    initialSettings?.provider || DEFAULT_SETTINGS.provider
  );
  const [key, setKey] = useState(initialSettings?.key || DEFAULT_SETTINGS.key);
  const [baseUrl, setBaseUrl] = useState(initialSettings?.baseUrl || '');
  const [model, setModel] = useState(initialSettings?.model || '');
  const [githubToken, setGithubToken] = useState(initialSettings?.githubToken || '');

  // Synchronize with initialSettings when opened
  useEffect(() => {
    if (isOpen && initialSettings) {
      if (initialSettings.provider) setProvider(initialSettings.provider);
      if (initialSettings.key !== undefined) setKey(initialSettings.key);
      if (initialSettings.baseUrl !== undefined) setBaseUrl(initialSettings.baseUrl);
      if (initialSettings.model !== undefined) setModel(initialSettings.model);
      if (initialSettings.githubToken !== undefined) setGithubToken(initialSettings.githubToken);
    }
  }, [isOpen, initialSettings]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      provider,
      key: isCloudProvider(provider) ? key : '',
      baseUrl: provider === 'ollama' ? baseUrl : undefined,
      model: provider === 'ollama' ? model : undefined,
      githubToken,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 text-slate-100 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-white tracking-tight">Security & Model Settings</h2>
              <p className="text-xs text-slate-400">Configure BYOK or 100% Air-Gapped Local Inference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm">
          {/* Provider Selection */}
          <div>
            <label
              htmlFor="model-provider-select"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" /> Model Provider
            </label>
            <select
              id="model-provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              {PROVIDER_OPTIONS.find((p) => p.id === provider)?.hint}
            </p>
          </div>

          {/* Cloud Provider API Key */}
          {isCloudProvider(provider) && (
            <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-3.5 space-y-2">
              <label
                htmlFor="api-key-input"
                className="flex items-center gap-2 text-xs font-semibold text-indigo-300"
              >
                <Key className="w-3.5 h-3.5" /> API Key (Session-Only Memory)
              </label>
              <div className="relative">
                <input
                  id="api-key-input"
                  type="password"
                  placeholder={
                    provider === 'gemini'
                      ? 'AIzaSy...'
                      : provider === 'openai'
                      ? 'sk-...'
                      : 'sk-ant-...'
                  }
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Zero persistence: Never saved to disk or database. Passed in transient memory.</span>
              </div>
            </div>
          )}

          {/* Custom Ollama Settings */}
          {provider === 'ollama' && (
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              <div>
                <label
                  htmlFor="ollama-base-url"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Custom Ollama Base URL (Optional)
                </label>
                <input
                  id="ollama-base-url"
                  type="text"
                  placeholder="http://localhost:11434/v1 (default)"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="ollama-model-name"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Custom Model Name (Optional)
                </label>
                <input
                  id="ollama-model-name"
                  type="text"
                  placeholder="llama3.2 (default)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>
            </div>
          )}

          {/* GitHub PAT */}
          <div>
            <label
              htmlFor="github-token-input"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              <Key className="w-3.5 h-3.5 text-slate-400" /> GitHub Read-Only PAT (Optional)
            </label>
            <input
              id="github-token-input"
              type="password"
              placeholder="ghp_... (for private repos & commit verification)"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
            />
            <p className="mt-1 text-xs text-slate-500">
              Used strictly to cross-reference your commits and diffs with voice recaps.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
