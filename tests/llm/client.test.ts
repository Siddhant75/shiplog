import { describe, it, expect } from 'vitest';
import { createLLMClient, LLMProviderConfig } from '@/lib/llm/client';

describe('Universal LLM Client Factory (Pillars 1 & 2)', () => {
  it('configures Ollama with default localhost baseURL and dummy key', () => {
    const config: LLMProviderConfig = { provider: 'ollama' };
    const { client, model } = createLLMClient(config);
    expect(client.baseURL).toBe('http://localhost:11434/v1');
    expect(model).toBe('llama3.2');

    // Test with trailing slash and custom port
    const customConfig: LLMProviderConfig = { provider: 'ollama', baseUrl: 'http://127.0.0.1:11434/' };
    const { client: customClient } = createLLMClient(customConfig);
    expect(customClient.baseURL).toBe('http://127.0.0.1:11434/v1');
  });

  it('throws an error if cloud provider API key is missing or empty', () => {
    expect(() => createLLMClient({ provider: 'openai', apiKey: '' })).toThrow(/API key is required/);
    expect(() => createLLMClient({ provider: 'gemini', apiKey: '   ' })).toThrow(/API key is required/);
    expect(() => createLLMClient({ provider: 'anthropic', apiKey: undefined as any })).toThrow(/API key is required/);
  });

  it('configures Gemini with Google OpenAI-compatible endpoint', () => {
    const config: LLMProviderConfig = { provider: 'gemini', apiKey: 'fake-gemini-key' };
    const { client, model } = createLLMClient(config);
    expect(client.baseURL).toContain('generativelanguage.googleapis.com');
    expect(client.apiKey).toBe('fake-gemini-key');
    expect(model).toBe('gemini-1.5-flash');
  });

  it('configures OpenAI and Anthropic properly', () => {
    const openaiConfig: LLMProviderConfig = { provider: 'openai', apiKey: 'fake-openai-key' };
    const { client: oClient, model: oModel } = createLLMClient(openaiConfig);
    expect(oClient.apiKey).toBe('fake-openai-key');
    expect(oModel).toBe('gpt-4o-mini');

    const anthropicConfig: LLMProviderConfig = { provider: 'anthropic', apiKey: 'fake-anthropic-key' };
    const { client: aClient } = createLLMClient(anthropicConfig);
    expect(aClient.baseURL).toContain('anthropic.com');
  });
});
