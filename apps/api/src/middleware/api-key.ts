import type { FastifyRequest, FastifyReply } from 'fastify';
import { errors } from '../utils/response.js';
import { prisma } from '../utils/prisma.js';
import { hashApiKey } from '../utils/hash.js';
import type { ApiKey } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: ApiKey;
  }
}

export async function requireApiKey(request: FastifyRequest, reply: FastifyReply) {
  const headerKey = request.headers['x-api-key'] as string | undefined;

  if (!headerKey) {
    return errors.unauthorized(reply, 'API key required. Pass X-API-Key header.');
  }

  if (!headerKey.startsWith('clrv_')) {
    return errors.unauthorized(reply, 'Invalid API key format');
  }

  const keyHash = hashApiKey(headerKey);

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash },
  });

  if (!apiKey) {
    return errors.unauthorized(reply, 'Invalid API key');
  }

  if (!apiKey.isActive) {
    return errors.forbidden(reply, 'API key is deactivated');
  }

  // Update last used timestamp (non-blocking)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Ignore errors from updating last used time
    });

  request.apiKey = apiKey;
}

export function requirePermission(...permissions: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const apiKey = request.apiKey;
    if (!apiKey) {
      return errors.unauthorized(reply, 'API key required');
    }

    const hasPermission = permissions.some((p) => apiKey.permissions.includes(p));
    if (!hasPermission) {
      return errors.forbidden(
        reply,
        `API key requires one of: ${permissions.join(', ')}`
      );
    }
  };
}

export async function optionalApiKey(request: FastifyRequest, _reply: FastifyReply) {
  const headerKey = request.headers['x-api-key'] as string | undefined;

  if (!headerKey || !headerKey.startsWith('clrv_')) {
    return;
  }

  const keyHash = hashApiKey(headerKey);
  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });

  if (apiKey) {
    request.apiKey = apiKey;
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});
  }
}
