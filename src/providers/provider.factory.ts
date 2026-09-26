import { ILLMProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

export class ProviderFactory {
  private static geminiProvider = new GeminiProvider();
  private static openAICompatibleProvider = new OpenAICompatibleProvider();

  static getProvider(providerName: string): ILLMProvider {
    const normalized = (providerName || '').toLowerCase().trim();

    if (normalized === 'google' || normalized === 'gemini') {
      return this.geminiProvider;
    }

    if (
      normalized === 'openrouter' ||
      normalized === 'openai' ||
      normalized === 'groq' ||
      normalized === 'mistral' ||
      normalized === 'together' ||
      normalized === 'deepinfra' ||
      normalized === 'custom' ||
      normalized === 'ollama'
    ) {
      return this.openAICompatibleProvider;
    }

    // Default fallback to OpenAI-compatible interface for standard chat completion endpoints
    return this.openAICompatibleProvider;
  }
}
