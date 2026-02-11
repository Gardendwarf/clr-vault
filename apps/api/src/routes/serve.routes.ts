import type { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { storageService } from '../services/storage.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { optionalAuth } from '../middleware/auth.js';
import { optionalApiKey } from '../middleware/api-key.js';
import { errors } from '../utils/response.js';
import { Readable } from 'stream';

export async function serveRoutes(app: FastifyInstance) {
  // GET /api/serve/:id — serve original file
  app.get(
    '/:id',
    { preHandler: [optionalAuth, optionalApiKey] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const startTime = Date.now();

      const asset = await prisma.asset.findUnique({ where: { id } });
      if (!asset) {
        return errors.notFound(reply, 'Asset');
      }

      // Check visibility: private assets require auth or API key
      if (asset.visibility === 'PRIVATE') {
        if (!request.authUser && !request.apiKey) {
          return errors.unauthorized(reply, 'Authentication required for private assets');
        }
      }

      try {
        const { body, contentType, contentLength } = await storageService.download(asset.storageKey);
        if (!body) {
          return errors.internal(reply, 'Failed to retrieve file');
        }

        const responseTime = Date.now() - startTime;

        // Log access (non-blocking)
        analyticsService.logAccess({
          assetId: asset.id,
          apiKeyId: request.apiKey?.id,
          action: 'serve',
          ip: request.ip,
          bytesServed: contentLength,
          responseTime,
        });

        reply
          .header('Content-Type', contentType)
          .header('Content-Length', contentLength)
          .header('Content-Disposition', `inline; filename="${asset.originalName}"`)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          .header('ETag', `"${asset.contentHash}"`)
          .header('X-Asset-Id', asset.id);

        // Convert web ReadableStream to Node.js stream
        const nodeStream = Readable.fromWeb(body as any);
        return reply.send(nodeStream);
      } catch (err) {
        return errors.internal(reply, 'Failed to serve file');
      }
    }
  );

  // GET /api/serve/:id/thumbnail — serve thumbnail
  app.get(
    '/:id/thumbnail',
    { preHandler: [optionalAuth, optionalApiKey] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const asset = await prisma.asset.findUnique({ where: { id } });
      if (!asset) {
        return errors.notFound(reply, 'Asset');
      }

      if (asset.visibility === 'PRIVATE') {
        if (!request.authUser && !request.apiKey) {
          return errors.unauthorized(reply, 'Authentication required for private assets');
        }
      }

      if (!asset.thumbnailKey) {
        return errors.notFound(reply, 'Thumbnail');
      }

      try {
        const { body, contentType, contentLength } = await storageService.download(asset.thumbnailKey);
        if (!body) {
          return errors.internal(reply, 'Failed to retrieve thumbnail');
        }

        reply
          .header('Content-Type', contentType)
          .header('Content-Length', contentLength)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          .header('ETag', `"thumb-${asset.contentHash}"`);

        const nodeStream = Readable.fromWeb(body as any);
        return reply.send(nodeStream);
      } catch {
        return errors.internal(reply, 'Failed to serve thumbnail');
      }
    }
  );
}
