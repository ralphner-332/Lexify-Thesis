import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMProvider, ModelConfig } from './llm-provider.interface';

export class GeminiProvider implements ILLMProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  async evaluatePrompt(prompt: string, config: ModelConfig): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment');
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.modelId || 'gemini-2.0-flash',
      generationConfig: {
        temperature: config.temperature ?? 0.2,
        topP: config.topP ?? 0.95,
        maxOutputTokens: config.maxOutputTokens || 3000,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
