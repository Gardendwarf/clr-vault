import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service.js';
import { requireAuth } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod } from '../utils/validation.js';

const bandwidthSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const topAssetsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/analytics/overview
  app.get('/overview', async (_request, reply) => {
    const overview = await analyticsService.getOverview();
    success(reply, overview);
  });

  // GET /api/analytics/bandwidth
  app.get('/bandwidth', async (request, reply) => {
    const validation = validateZod(bandwidthSchema, request.query);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const data = await analyticsService.getBandwidth(validation.data.days);
    success(reply, data);
  });

  // GET /api/analytics/per-app
  app.get('/per-app', async (_request, reply) => {
    const data = await analyticsService.getPerAppUsage();
    success(reply, data);
  });

  // GET /api/analytics/top-assets
  app.get('/top-assets', async (request, reply) => {
    const validation = validateZod(topAssetsSchema, request.query);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const data = await analyticsService.getTopAssets(validation.data.limit);
    success(reply, data);
  });
}
