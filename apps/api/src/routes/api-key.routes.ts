import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { apiKeyService } from '../services/api-key.service.js';
import { requireAuth } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod, uuidSchema } from '../utils/validation.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'transform'])).optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  quotaBytes: z.number().int().positive().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'transform'])).optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export async function apiKeyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/api-keys
  app.get('/', async (request, reply) => {
    const keys = await apiKeyService.list(request.authUser!.userId);
    success(reply, keys);
  });

  // POST /api/api-keys
  app.post('/', async (request, reply) => {
    const validation = validateZod(createSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const result = await apiKeyService.create({
      userId: request.authUser!.userId,
      ...validation.data,
    });

    success(reply, result, 201);
  });

  // PUT /api/api-keys/:id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid API key ID');
    }

    const validation = validateZod(updateSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      const apiKey = await apiKeyService.update(id, request.authUser!.userId, validation.data);
      success(reply, apiKey);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        return errors.notFound(reply, 'API key');
      }
      return errors.internal(reply);
    }
  });

  // DELETE /api/api-keys/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid API key ID');
    }

    const deleted = await apiKeyService.delete(id, request.authUser!.userId);
    if (!deleted) {
      return errors.notFound(reply, 'API key');
    }

    success(reply, { message: 'API key deleted' });
  });

  // POST /api/api-keys/:id/regenerate
  app.post('/:id/regenerate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid API key ID');
    }

    try {
      const result = await apiKeyService.regenerate(id, request.authUser!.userId);
      success(reply, result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        return errors.notFound(reply, 'API key');
      }
      return errors.internal(reply);
    }
  });
}
