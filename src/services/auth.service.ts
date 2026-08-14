import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AuthUserPayload } from '../middleware/auth';
import { AuditService } from './audit.service';

export class AuthService {
  static generateToken(user: { id: string; email: string; name: string; role: string; isDemo: boolean }) {
    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isDemo: user.isDemo,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);

    await AuditService.logAction({
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
  static async quickLogin(role: 'STUDENT' | 'EXPERT' | 'ADMIN') {
    if (!env.ALLOW_QUICK_LOGIN || env.NODE_ENV === 'production') {
      throw new Error('Quick login is disabled in this environment');
    }

    const emailMap: Record<string, string> = {
      STUDENT: 'student@yawa.local',
      EXPERT: 'expert@yawa.local',
      ADMIN: 'admin@yawa.local',
    };

    const targetEmail = emailMap[role];
    if (!targetEmail) {
      throw new Error(`Unknown quick login role: ${role}`);
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      throw new Error(`Seeded user for ${role} not found. Please run seed script.`);
    }

    const token = this.generateToken(user);

    await AuditService.logAction({
      userId: user.id,
      userEmail: user.email,
      action: 'QUICK_LOGIN_DEMO',
      entityType: 'USER',
      entityId: user.id,
      details: { role: user.role, environment: env.NODE_ENV },
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

  static async acceptDisclaimer(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { disclaimerAcceptedAt: new Date() },
    });

    await AuditService.logAction({
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
