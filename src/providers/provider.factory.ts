import { ILLMProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';

export class ProviderFactory {
  private static geminiProvider = new GeminiProvider();

  static getProvider(providerName: string): ILLMProvider {
    const normalized = (providerName || '').toLowerCase().trim();

    if (normalized === 'google' || normalized === 'gemini') {
      return this.geminiProvider;
    }

    throw new Error(
      `Unsupported or un-implemented LLM provider: "${providerName}". Supported provider adapter in Phase 2 is "google". System will fail safely rather than silently switch providers.`
    );
  }
}
