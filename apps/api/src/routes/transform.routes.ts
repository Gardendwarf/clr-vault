import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { transformService } from '../services/transform.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { optionalAuth } from '../middleware/auth.js';
import { optionalApiKey } from '../middleware/api-key.js';
import { errors } from '../utils/response.js';
import { validateZod } from '../utils/validation.js';
import { isTransformable } from '../utils/mime.js';

const transformQuerySchema = z.object({
  w: z.coerce.number().int().min(1).max(8192).optional(),
  h: z.coerce.number().int().min(1).max(8192).optional(),
  format: z.enum(['webp', 'jpeg', 'png', 'avif']).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  quality: z.coerce.number().int().min(1).max(100).optional(),
});

export async function transformRoutes(app: FastifyInstance) {
  // GET /api/transform/:id?w=&h=&format=&fit=&quality=
  app.get(
    '/:id',
    { preHandler: [optionalAuth, optionalApiKey] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const startTime = Date.now();

      const validation = validateZod(transformQuerySchema, request.query);
      if (!validation.success) {
        return errors.validation(reply, validation.errors);
      }

      const options = validation.data;

      const asset = await prisma.asset.findUnique({ where: { id } });
      if (!asset) {
        return errors.notFound(reply, 'Asset');
      }

      if (asset.visibility === 'PRIVATE') {
        if (!request.authUser && !request.apiKey) {
          return errors.unauthorized(reply, 'Authentication required for private assets');
        }
      }

      if (!isTransformable(asset.mimeType)) {
        return errors.badRequest(reply, `Cannot transform ${asset.mimeType}. Supported: jpeg, png, webp, avif, tiff, gif`);
      }

      try {
        const { buffer, contentType } = await transformService.transform(
          asset.id,
          asset.storageKey,
          asset.mimeType,
          options
        );

        const responseTime = Date.now() - startTime;

        // Log access
        analyticsService.logAccess({
          assetId: asset.id,
          apiKeyId: request.apiKey?.id,
          action: 'transform',
          ip: request.ip,
          bytesServed: buffer.length,
          responseTime,
        });

        reply
          .header('Content-Type', contentType)
          .header('Content-Length', buffer.length)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          .header('X-Transform-Time', `${responseTime}ms`);

        return reply.send(buffer);
      } catch (err) {
        if (err instanceof Error) {
          return errors.badRequest(reply, err.message);
        }
        return errors.internal(reply, 'Transform failed');
      }
    }
  );
}
