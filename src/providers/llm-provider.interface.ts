export interface ModelConfig {
  provider: 'google' | 'anthropic' | 'openai' | 'custom' | string;
  modelId: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  [key: string]: any;
}

export interface ILLMProvider {
  /**
   * Evaluates a prompt and returns the raw text response from the LLM provider.
   */
  evaluatePrompt(prompt: string, config: ModelConfig): Promise<string>;
}
