"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    JWT_SECRET: zod_1.z.string().default('yawa_research_secret_key_development_only_min_32_characters'),
    DATABASE_URL: zod_1.z.string().default('file:./dev.db'),
    ALLOW_QUICK_LOGIN: zod_1.z
        .string()
        .default('true')
        .transform((val) => val === 'true' || val === '1'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment configuration');
}
// In production, force ALLOW_QUICK_LOGIN to false
const validatedEnv = {
    ...parsed.data,
    ALLOW_QUICK_LOGIN: parsed.data.NODE_ENV === 'production' ? false : parsed.data.ALLOW_QUICK_LOGIN,
};
exports.env = validatedEnv;
