import OpenAI from 'openai';

export type LLMProviderConfig =
  | { provider: 'gemini'; apiKey: string }
  | { provider: 'openai'; apiKey: string }
  | { provider: 'anthropic'; apiKey: string }
  | { provider: 'ollama'; baseUrl?: string; model?: string };

function cleanBaseUrl(url?: string): string {
  const base = (url || 'http://localhost:11434').trim().replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

function requireApiKey(provider: string, apiKey?: string): string {
  if (!apiKey || !apiKey.trim()) {
    throw new Error(`API key is required for provider: ${provider}`);
  }
  return apiKey.trim();
}

export function createLLMClient(config: LLMProviderConfig): { client: OpenAI; model: string } {
  switch (config.provider) {
    case 'ollama':
      return {
        client: new OpenAI({
          baseURL: cleanBaseUrl(config.baseUrl),
          apiKey: 'ollama',
        }),
        model: config.model?.trim() || 'llama3.2',
      };
    case 'gemini':
      return {
        client: new OpenAI({
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: requireApiKey('gemini', config.apiKey),
        }),
        model: 'gemini-1.5-flash',
      };
    case 'openai':
      return {
        client: new OpenAI({ apiKey: requireApiKey('openai', config.apiKey) }),
        model: 'gpt-4o-mini',
      };
    case 'anthropic':
      return {
        client: new OpenAI({
          baseURL: 'https://api.anthropic.com/v1/',
          apiKey: requireApiKey('anthropic', config.apiKey),
        }),
        model: 'claude-3-5-haiku-latest',
      };
  }
}
