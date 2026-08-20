"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const gemini_provider_1 = require("./gemini.provider");
class ProviderFactory {
    static geminiProvider = new gemini_provider_1.GeminiProvider();
    static getProvider(providerName) {
        const normalized = (providerName || '').toLowerCase().trim();
        if (normalized === 'google' || normalized === 'gemini') {
            return this.geminiProvider;
        }
        throw new Error(`Unsupported or un-implemented LLM provider: "${providerName}". Supported provider adapter in Phase 2 is "google". System will fail safely rather than silently switch providers.`);
    }
}
exports.ProviderFactory = ProviderFactory;
