import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { collectionService } from '../services/collection.service.js';
import { requireAuth } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod, paginationSchema, uuidSchema, slugSchema } from '../utils/validation.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema.optional(),
  parentId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: slugSchema.optional(),
});

export async function collectionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/collections
  app.get('/', async (_request, reply) => {
    const collections = await collectionService.list();
    success(reply, collections);
  });

  // POST /api/collections
  app.post('/', async (request, reply) => {
    const validation = validateZod(createSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      const collection = await collectionService.create(validation.data);
      success(reply, collection, 201);
    } catch (err) {
      if (err instanceof Error) {
        return errors.conflict(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // GET /api/collections/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid collection ID');
    }

    const collection = await collectionService.getById(id);
    if (!collection) {
      return errors.notFound(reply, 'Collection');
    }

    success(reply, collection);
  });

  // PUT /api/collections/:id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid collection ID');
    }

    const validation = validateZod(updateSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      const collection = await collectionService.update(id, validation.data);
      success(reply, collection);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('not found')) return errors.notFound(reply, 'Collection');
        return errors.conflict(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // DELETE /api/collections/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid collection ID');
    }

    try {
      const deleted = await collectionService.delete(id);
      if (!deleted) {
        return errors.notFound(reply, 'Collection');
      }
      success(reply, { message: 'Collection deleted' });
    } catch (err) {
      if (err instanceof Error) {
        return errors.badRequest(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // GET /api/collections/:id/assets
  app.get('/:id/assets', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid collection ID');
    }

    const validation = validateZod(paginationSchema, request.query);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const collection = await collectionService.getById(id);
    if (!collection) {
      return errors.notFound(reply, 'Collection');
    }

    const result = await collectionService.getAssets(id, validation.data.page, validation.data.pageSize);
    success(reply, result);
  });
}
