import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod, uuidSchema } from '../utils/validation.js';

const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
});

const updateQuotaSchema = z.object({
  quotaBytes: z.number().int().positive().optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin);

  // GET /api/admin/users
  app.get('/users', async (_request, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { apiKeys: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    success(
      reply,
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        apiKeyCount: u._count.apiKeys,
        createdAt: u.createdAt.toISOString(),
      }))
    );
  });

  // PUT /api/admin/users/:id
  app.put('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid user ID');
    }

    const validation = validateZod(updateUserSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return errors.notFound(reply, 'User');
    }

    // Prevent admins from demoting themselves
    if (id === request.authUser!.userId && validation.data.role === 'USER') {
      return errors.badRequest(reply, 'Cannot demote yourself');
    }

    const user = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { apiKeys: true } },
      },
    });

    success(reply, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      apiKeyCount: user._count.apiKeys,
      createdAt: user.createdAt.toISOString(),
    });
  });

  // GET /api/admin/quotas
  app.get('/quotas', async (_request, reply) => {
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    success(
      reply,
      apiKeys.map((k) => ({
        apiKeyId: k.id,
        appId: k.appId,
        name: k.name,
        quotaBytes: k.quotaBytes.toString(),
        usedBytes: k.usedBytes.toString(),
        rateLimit: k.rateLimit,
        userId: k.userId,
        userName: k.user.name,
        userEmail: k.user.email,
      }))
    );
  });

  // PUT /api/admin/quotas/:apiKeyId
  app.put('/quotas/:apiKeyId', async (request, reply) => {
    const { apiKeyId } = request.params as { apiKeyId: string };
    const valid = uuidSchema.safeParse(apiKeyId);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid API key ID');
    }

    const validation = validateZod(updateQuotaSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const existing = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!existing) {
      return errors.notFound(reply, 'API key');
    }

    const data: { quotaBytes?: bigint; rateLimit?: number } = {};
    if (validation.data.quotaBytes !== undefined) {
      data.quotaBytes = BigInt(validation.data.quotaBytes);
    }
    if (validation.data.rateLimit !== undefined) {
      data.rateLimit = validation.data.rateLimit;
    }

    const apiKey = await prisma.apiKey.update({
      where: { id: apiKeyId },
      data,
      include: { user: { select: { name: true, email: true } } },
    });

    success(reply, {
      apiKeyId: apiKey.id,
      appId: apiKey.appId,
      name: apiKey.name,
      quotaBytes: apiKey.quotaBytes.toString(),
      usedBytes: apiKey.usedBytes.toString(),
      rateLimit: apiKey.rateLimit,
      userId: apiKey.userId,
      userName: apiKey.user.name,
      userEmail: apiKey.user.email,
    });
  });
}
