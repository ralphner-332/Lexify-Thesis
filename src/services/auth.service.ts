import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AuthUserPayload } from '../middleware/auth';
import { AuditService } from './audit.service';

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(pwd);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters long.');
  if (!hasUppercase) errors.push('Password must contain at least one uppercase letter.');
  if (!hasLowercase) errors.push('Password must contain at least one lowercase letter.');
  if (!hasNumber) errors.push('Password must contain at least one number.');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character.');

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    errors,
  };
}

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
   * Public Student Registration.
   * Strictly enforces STUDENT role, password complexity policy, and hashes password with bcrypt.
   */
  static async registerStudent(input: {
    name: string;
    email: string;
    passwordPlain: string;
  }) {
    const name = input.name?.trim();
    const email = input.email?.toLowerCase().trim();
    const password = input.passwordPlain;

    if (!name || name.length < 2) {
      throw new Error('Please enter your full name (minimum 2 characters).');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please provide a valid institutional email address.');
    }

    const validation = validatePasswordComplexity(password);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'STUDENT',
        isDemo: false,
      },
    });

    await AuditService.logAction({
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'USER_REGISTER',
      entityType: 'USER',
      entityId: newUser.id,
      details: { role: 'STUDENT', isDemo: false },
      isDemo: false,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
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
      STUDENT: 'student@lexify.local',
      EXPERT: 'expert@lexify.local',
      ADMIN: 'admin@lexify.local',
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
