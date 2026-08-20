"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const env_1 = require("../config/env");
const audit_service_1 = require("./audit.service");
class AuthService {
    static generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isDemo: user.isDemo,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: '7d' });
    }
    static async login(email, passwordPlain) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isValid = await bcryptjs_1.default.compare(passwordPlain, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        const token = this.generateToken(user);
        await audit_service_1.AuditService.logAction({
            userId: user.id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            entityType: 'USER',
            entityId: user.id,
            details: { role: user.role, isDemo: user.isDemo },
            isDemo: user.isDemo,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isDemo: user.isDemo,
                disclaimerAcceptedAt: user.disclaimerAcceptedAt,
            },
        };
    }
    /**
     * Development Quick Login: Gated strictly by environment settings.
     * Disallowed in production.
     */
    static async quickLogin(role) {
        if (!env_1.env.ALLOW_QUICK_LOGIN || env_1.env.NODE_ENV === 'production') {
            throw new Error('Quick login is disabled in this environment');
        }
        const emailMap = {
            STUDENT: 'student@yawa.local',
            EXPERT: 'expert@yawa.local',
            ADMIN: 'admin@yawa.local',
        };
        const targetEmail = emailMap[role];
        if (!targetEmail) {
            throw new Error(`Unknown quick login role: ${role}`);
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: targetEmail },
        });
        if (!user) {
            throw new Error(`Seeded user for ${role} not found. Please run seed script.`);
        }
        const token = this.generateToken(user);
        await audit_service_1.AuditService.logAction({
            userId: user.id,
            userEmail: user.email,
            action: 'QUICK_LOGIN_DEMO',
            entityType: 'USER',
            entityId: user.id,
            details: { role: user.role, environment: env_1.env.NODE_ENV },
            isDemo: true,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isDemo: user.isDemo,
                disclaimerAcceptedAt: user.disclaimerAcceptedAt,
            },
        };
    }
    static async acceptDisclaimer(userId) {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { disclaimerAcceptedAt: new Date() },
        });
        await audit_service_1.AuditService.logAction({
            userId: user.id,
            userEmail: user.email,
            action: 'ACCEPT_DISCLAIMER',
            entityType: 'USER',
            entityId: user.id,
            details: { acceptedAt: user.disclaimerAcceptedAt },
            isDemo: user.isDemo,
        });
        return user;
    }
}
exports.AuthService = AuthService;
