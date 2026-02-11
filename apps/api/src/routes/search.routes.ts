import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { searchService } from '../services/search.service.js';
import { requireAuth } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod, paginationSchema } from '../utils/validation.js';

const searchSchema = paginationSchema.extend({
  q: z.string().optional(),
  type: z.string().optional(),
  tag: z.string().optional(),
  collection: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function searchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/search
  app.get('/', async (request, reply) => {
    const validation = validateZod(searchSchema, request.query);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const result = await searchService.search(validation.data);
    success(reply, result);
  });
}
