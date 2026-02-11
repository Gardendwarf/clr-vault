import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { createChildLogger } from '../utils/logger.js';
import type { User } from '@prisma/client';

const logger = createChildLogger('auth');

function parseExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 15 * 60 * 1000); // Default 15m
  }
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + value * multipliers[unit]);
}

export const authService = {
  async register(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    logger.info({ userId: user.id, email }, 'User registered');
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    logger.info({ userId: user.id, email }, 'User logged in');
    return user;
  },

  async createRefreshToken(userId: string, expiresIn: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = parseExpiry(expiresIn);

    await prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  },

  async verifyRefreshToken(token: string) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new Error('Invalid refresh token');
    }

    if (refreshToken.revokedAt) {
      throw new Error('Refresh token has been revoked');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }

    if (!refreshToken.user.isActive) {
      throw new Error('Account is deactivated');
    }

    return refreshToken;
  },

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async cleanExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });
    return result.count;
  },

  sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  },
};
