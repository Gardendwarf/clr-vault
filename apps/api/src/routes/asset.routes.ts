import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { assetService } from '../services/asset.service.js';
import { requireAuth } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod, paginationSchema, uuidSchema } from '../utils/validation.js';

const listSchema = paginationSchema.extend({
  status: z.enum(['PROCESSING', 'ACTIVE', 'ARCHIVED', 'ERROR']).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  mimeType: z.string().optional(),
  tagId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  sort: z.enum(['createdAt', 'sizeBytes', 'filename']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const updateSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  alt: z.string().max(500).optional(),
  caption: z.string().max(1000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

const addTagSchema = z.object({
  tagId: z.string().uuid(),
});

const addCollectionSchema = z.object({
  collectionId: z.string().uuid(),
});

export async function assetRoutes(app: FastifyInstance) {
  // All asset routes require authentication
  app.addHook('preHandler', requireAuth);

  // GET /api/assets
  app.get('/', async (request, reply) => {
    const validation = validateZod(listSchema, request.query);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const result = await assetService.list(validation.data);
    success(reply, result);
  });

  // POST /api/assets (multipart upload)
  app.post('/', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return errors.badRequest(reply, 'No file uploaded');
      }

      const buffer = await data.toBuffer();
      const asset = await assetService.create({
        buffer,
        filename: data.filename,
        originalName: data.filename,
        mimeType: data.mimetype,
      });

      success(reply, asset, 201);
    } catch (err) {
      if (err instanceof Error) {
        return errors.badRequest(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // GET /api/assets/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid asset ID');
    }

    const asset = await assetService.getById(id);
    if (!asset) {
      return errors.notFound(reply, 'Asset');
    }

    success(reply, asset);
  });

  // PUT /api/assets/:id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid asset ID');
    }

    const validation = validateZod(updateSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      const asset = await assetService.update(id, validation.data);
      success(reply, asset);
    } catch {
      return errors.notFound(reply, 'Asset');
    }
  });

  // DELETE /api/assets/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid asset ID');
    }

    const deleted = await assetService.delete(id);
    if (!deleted) {
      return errors.notFound(reply, 'Asset');
    }

    success(reply, { message: 'Asset deleted' });
  });

  // POST /api/assets/bulk-delete
  app.post('/bulk-delete', async (request, reply) => {
    const validation = validateZod(bulkDeleteSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const deleted = await assetService.bulkDelete(validation.data.ids);
    success(reply, { deleted });
  });

  // POST /api/assets/:id/tags
  app.post('/:id/tags', async (request, reply) => {
    const { id } = request.params as { id: string };
    const validation = validateZod(addTagSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      await assetService.addTag(id, validation.data.tagId);
      const asset = await assetService.getById(id);
      success(reply, asset);
    } catch {
      return errors.badRequest(reply, 'Failed to add tag');
    }
  });

  // DELETE /api/assets/:id/tags/:tagId
  app.delete('/:id/tags/:tagId', async (request, reply) => {
    const { id, tagId } = request.params as { id: string; tagId: string };

    await assetService.removeTag(id, tagId);
    const asset = await assetService.getById(id);
    success(reply, asset);
  });

  // POST /api/assets/:id/collections
  app.post('/:id/collections', async (request, reply) => {
    const { id } = request.params as { id: string };
    const validation = validateZod(addCollectionSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      await assetService.addToCollection(id, validation.data.collectionId);
      const asset = await assetService.getById(id);
      success(reply, asset);
    } catch {
      return errors.badRequest(reply, 'Failed to add to collection');
    }
  });

  // DELETE /api/assets/:id/collections/:collectionId
  app.delete('/:id/collections/:collectionId', async (request, reply) => {
    const { id, collectionId } = request.params as { id: string; collectionId: string };

    await assetService.removeFromCollection(id, collectionId);
    const asset = await assetService.getById(id);
    success(reply, asset);
  });
}
