import { ILLMProvider, ModelConfig } from './llm-provider.interface';

export class OpenAICompatibleProvider implements ILLMProvider {
  async evaluatePrompt(prompt: string, config: ModelConfig): Promise<string> {
    const isOllama = (config.provider || '').toLowerCase() === 'ollama';
    const apiKeyEnvVar = config.apiKeyEnvVar || (isOllama ? 'LOCAL_INFERENCE' : 'OPENROUTER_API_KEY');
    const apiKey = isOllama
      ? (process.env[apiKeyEnvVar] || 'ollama-local')
      : (process.env[apiKeyEnvVar] || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);

    if (!apiKey && !isOllama) {
      throw new Error(
        `AI Evaluation could not be completed for model "${config.modelId}": ${apiKeyEnvVar} is not configured in the environment. Real research mode fails safely without generating fabricated scores.`
      );
    }

    const endpointUrl =
      config.endpointUrl ||
      (isOllama
        ? 'http://localhost:11434/v1/chat/completions'
        : config.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : config.provider === 'mistral'
        ? 'https://api.mistral.ai/v1/chat/completions'
        : config.provider === 'together'
        ? 'https://api.together.xyz/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fsuu.edu.ph/lexify',
      'X-Title': 'Lexify Academic Legal AI Evaluator',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const modelTag = config.exactModelId || config.modelId;
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelTag,
        messages: [
          {
            role: 'system',
            content:
              'You are an authoritative legal evaluation AI assisting legal education research. Return ONLY a valid JSON object adhering strictly to the requested schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.temperature ?? 0.2,
        top_p: config.topP ?? 0.95,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        max_tokens: config.maxOutputTokens ?? config.maxTokens ?? 2048,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(isOllama ? 180000 : 60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LLM Provider "${config.provider}" returned HTTP ${response.status} for model "${modelTag}": ${errorText}`
      );
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`Empty response content received from LLM Provider "${config.provider}"`);
    }

    return content;
  }

  /**
   * Forces Ollama to immediately unload a model from GPU VRAM / RAM after evaluation.
   */
  static async unloadOllamaModel(modelTag: string, customEndpoint?: string): Promise<void> {
    try {
      const baseUrl = customEndpoint
        ? customEndpoint.replace(/\/v1\/chat\/completions\/?$/, '')
        : 'http://localhost:11434';

      await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelTag,
          keep_alive: 0,
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch (err: any) {
      // Non-blocking warning if Ollama is not actively responding or already unloaded
      console.warn(`[OLLAMA UNLOAD] Model ${modelTag} unload signal sent (keep_alive: 0). Note: ${err.message}`);
    }
  }
}
