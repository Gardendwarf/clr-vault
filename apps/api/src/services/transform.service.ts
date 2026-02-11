import sharp from 'sharp';
import { LRUCache } from 'lru-cache';
import { prisma } from '../utils/prisma.js';
import { storageService } from './storage.service.js';
import { createChildLogger } from '../utils/logger.js';
import { generateStorageKey } from '../utils/hash.js';
import { isTransformable } from '../utils/mime.js';

const logger = createChildLogger('transform');

interface TransformOptions {
  w?: number;
  h?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
}

// In-memory LRU cache for transform results (stores Buffer references)
const memoryCache = new LRUCache<string, Buffer>({
  max: 200,
  maxSize: 256 * 1024 * 1024, // 256MB total
  sizeCalculation: (value) => value.length,
  ttl: 1000 * 60 * 30, // 30 minutes
});

function buildCacheKey(assetId: string, options: TransformOptions): string {
  const parts = [
    assetId,
    options.w ? `w${options.w}` : '',
    options.h ? `h${options.h}` : '',
    options.format || '',
    options.fit || '',
    options.quality ? `q${options.quality}` : '',
  ]
    .filter(Boolean)
    .join('_');
  return parts;
}

function getFormatMime(format: string): string {
  const map: Record<string, string> = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    png: 'image/png',
    avif: 'image/avif',
  };
  return map[format] || 'image/jpeg';
}

function getFormatExt(format: string): string {
  const map: Record<string, string> = {
    webp: '.webp',
    jpeg: '.jpg',
    png: '.png',
    avif: '.avif',
  };
  return map[format] || '.jpg';
}

export const transformService = {
  async transform(
    assetId: string,
    storageKey: string,
    mimeType: string,
    options: TransformOptions
  ): Promise<{ buffer: Buffer; contentType: string }> {
    if (!isTransformable(mimeType)) {
      throw new Error(`MIME type ${mimeType} is not transformable`);
    }

    const cacheKey = buildCacheKey(assetId, options);

    // 1. Check in-memory cache
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      logger.debug({ assetId, cacheKey }, 'Memory cache hit');
      const format = options.format || 'webp';
      return { buffer: cached, contentType: getFormatMime(format) };
    }

    // 2. Check DB transform cache
    const dbCached = await prisma.transformCache.findUnique({
      where: { assetId_params: { assetId, params: cacheKey } },
    });

    if (dbCached) {
      logger.debug({ assetId, cacheKey }, 'DB cache hit');
      try {
        const buffer = await storageService.getBuffer(dbCached.storageKey);
        memoryCache.set(cacheKey, buffer);

        // Update last accessed
        await prisma.transformCache.update({
          where: { id: dbCached.id },
          data: { lastAccessedAt: new Date() },
        });

        const format = options.format || 'webp';
        return { buffer, contentType: getFormatMime(format) };
      } catch {
        // If storage retrieval fails, regenerate
        logger.warn({ assetId, cacheKey }, 'DB cache entry found but storage retrieval failed');
      }
    }

    // 3. Fetch original and transform
    logger.debug({ assetId, cacheKey }, 'Cache miss, transforming');
    const originalBuffer = await storageService.getBuffer(storageKey);

    let pipeline = sharp(originalBuffer);
    const format = options.format || 'webp';
    const quality = options.quality || 80;
    const fit = options.fit || 'cover';

    if (options.w || options.h) {
      pipeline = pipeline.resize({
        width: options.w,
        height: options.h,
        fit: fit as keyof sharp.FitEnum,
        withoutEnlargement: true,
      });
    }

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
    }

    const resultBuffer = await pipeline.toBuffer();

    // Store in memory cache
    memoryCache.set(cacheKey, resultBuffer);

    // Store in R2 and DB (non-blocking)
    const transformStorageKey = generateStorageKey('transforms', getFormatExt(format));
    storageService
      .upload(transformStorageKey, resultBuffer, getFormatMime(format))
      .then(async () => {
        await prisma.transformCache.upsert({
          where: { assetId_params: { assetId, params: cacheKey } },
          update: {
            storageKey: transformStorageKey,
            sizeBytes: BigInt(resultBuffer.length),
            lastAccessedAt: new Date(),
          },
          create: {
            assetId,
            params: cacheKey,
            storageKey: transformStorageKey,
            sizeBytes: BigInt(resultBuffer.length),
          },
        });
      })
      .catch((err) => {
        logger.error({ err, assetId, cacheKey }, 'Failed to persist transform cache');
      });

    return { buffer: resultBuffer, contentType: getFormatMime(format) };
  },

  async invalidateAssetCache(assetId: string): Promise<number> {
    const entries = await prisma.transformCache.findMany({
      where: { assetId },
    });

    for (const entry of entries) {
      try {
        await storageService.delete(entry.storageKey);
      } catch {
        // Ignore cleanup errors
      }
      const cacheKey = entry.params;
      memoryCache.delete(cacheKey);
    }

    const result = await prisma.transformCache.deleteMany({
      where: { assetId },
    });

    return result.count;
  },

  async cleanOldCacheEntries(olderThanDays = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const entries = await prisma.transformCache.findMany({
      where: { lastAccessedAt: { lt: cutoff } },
    });

    for (const entry of entries) {
      try {
        await storageService.delete(entry.storageKey);
      } catch {
        // Ignore
      }
    }

    const result = await prisma.transformCache.deleteMany({
      where: { lastAccessedAt: { lt: cutoff } },
    });

    return result.count;
  },
};
