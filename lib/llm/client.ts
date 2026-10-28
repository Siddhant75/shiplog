import OpenAI from 'openai';

export type LLMProviderConfig =
  | { provider: 'gemini'; apiKey: string }
  | { provider: 'openai'; apiKey: string }
  | { provider: 'anthropic'; apiKey: string }
  | { provider: 'ollama'; baseUrl?: string; model?: string };

export function createLLMClient(config: LLMProviderConfig): { client: OpenAI; model: string } {
  switch (config.provider) {
    case 'ollama':
      return {
        client: new OpenAI({
          baseURL: (config.baseUrl || 'http://localhost:11434') + '/v1',
          apiKey: 'ollama',
        }),
        model: config.model || 'llama3.2',
      };
    case 'gemini':
      return {
        client: new OpenAI({
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: config.apiKey,
        }),
        model: 'gemini-1.5-flash',
      };
    case 'openai':
      return {
        client: new OpenAI({ apiKey: config.apiKey }),
        model: 'gpt-4o-mini',
      };
    case 'anthropic':
      return {
        client: new OpenAI({
          baseURL: 'https://api.anthropic.com/v1/',
          apiKey: config.apiKey,
        }),
        model: 'claude-3-5-haiku-latest',
      };
  }
}
