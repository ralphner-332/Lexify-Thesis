"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiProvider {
    apiKey;
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
    }
    async evaluatePrompt(prompt, config) {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is not configured in the environment');
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
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
exports.GeminiProvider = GeminiProvider;
