import type { FastifyRequest, FastifyReply } from 'fastify';
import { errors } from '../utils/response.js';
import { prisma } from '../utils/prisma.js';
import type { UserRole } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthPayload;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<AuthPayload>();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return errors.unauthorized(reply, 'Account is inactive or not found');
    }

    request.authUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch {
    return errors.unauthorized(reply, 'Invalid or expired token');
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) return;

  if (request.authUser?.role !== 'ADMIN') {
    return errors.forbidden(reply, 'Admin access required');
  }
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<AuthPayload>();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      request.authUser = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    }
  } catch {
    // Optional auth - no error if missing/invalid
  }
}
