import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import { logger, createChildLogger } from './utils/logger.js';
import { prisma } from './utils/prisma.js';
import { workerService } from './services/worker.service.js';

// Route imports
import { authRoutes } from './routes/auth.routes.js';
import { assetRoutes } from './routes/asset.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { serveRoutes } from './routes/serve.routes.js';
import { transformRoutes } from './routes/transform.routes.js';
import { collectionRoutes } from './routes/collection.routes.js';
import { tagRoutes } from './routes/tag.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { apiKeyRoutes } from './routes/api-key.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { adminRoutes } from './routes/admin.routes.js';

const log = createChildLogger('server');

async function buildApp() {
  const app = Fastify({
    logger: false,
    genReqId: () => randomUUID(),
    trustProxy: true,
  });

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (request) => {
      return request.headers['x-api-key'] as string || request.ip;
    },
  });

  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: config.MAX_MULTIPART_FILES,
    },
  });

  // Request logging
  app.addHook('onRequest', async (request) => {
    log.debug({ method: request.method, url: request.url, id: request.id }, 'Incoming request');
  });

  app.addHook('onResponse', async (request, reply) => {
    log.debug(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'Request completed'
    );
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(serveRoutes, { prefix: '/api/serve' });
  await app.register(transformRoutes, { prefix: '/api/transform' });
  await app.register(collectionRoutes, { prefix: '/api/collections' });
  await app.register(tagRoutes, { prefix: '/api/tags' });
  await app.register(searchRoutes, { prefix: '/api/search' });
  await app.register(apiKeyRoutes, { prefix: '/api/api-keys' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    log.error({ err: error }, 'Unhandled error');

    if (error.statusCode === 413) {
      reply.status(413).send({
        success: false,
        error: { code: 'TOO_LARGE', message: 'Request entity too large' },
      });
      return;
    }

    if (error.statusCode === 429) {
      reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' },
      });
      return;
    }

    reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  return app;
}

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    const app = await buildApp();

    // Start server
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info({ port: config.PORT, host: config.HOST }, 'ClrVault API server started');

    // Start background workers
    workerService.start();

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info({ signal }, 'Received shutdown signal');
        workerService.stop();
        await app.close();
        await prisma.$disconnect();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });
    }
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
