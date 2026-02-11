import { prisma } from '../utils/prisma.js';
import { createChildLogger } from '../utils/logger.js';
import type { Prisma } from '@prisma/client';

const logger = createChildLogger('search');

interface SearchInput {
  q?: string;
  type?: string;
  tag?: string;
  collection?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

const assetInclude = {
  tags: { include: { tag: true } },
  collections: { include: { collection: true } },
};

function formatAsset(asset: any) {
  return {
    ...asset,
    sizeBytes: asset.sizeBytes.toString(),
    tags: asset.tags?.map((at: any) => at.tag) ?? [],
    collections: asset.collections?.map((ac: any) => ac.collection) ?? [],
  };
}

export const searchService = {
  async search(input: SearchInput) {
    const { q, type, tag, collection, dateFrom, dateTo, page, pageSize } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AssetWhereInput = {
      status: { not: 'ERROR' },
    };

    // Full-text search on filename, originalName, alt, caption
    if (q) {
      where.OR = [
        { filename: { contains: q, mode: 'insensitive' } },
        { originalName: { contains: q, mode: 'insensitive' } },
        { alt: { contains: q, mode: 'insensitive' } },
        { caption: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filter by MIME type category
    if (type) {
      const typeMap: Record<string, string> = {
        image: 'image/',
        video: 'video/',
        audio: 'audio/',
        document: 'application/',
        font: 'font/',
      };
      const prefix = typeMap[type];
      if (prefix) {
        where.mimeType = { startsWith: prefix };
      }
    }

    // Filter by tag slug
    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag },
        },
      };
    }

    // Filter by collection slug
    if (collection) {
      where.collections = {
        some: {
          collection: { slug: collection },
        },
      };
    }

    // Date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [items, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: assetInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.asset.count({ where }),
    ]);

    logger.debug({ q, type, tag, collection, total }, 'Search executed');

    return {
      items: items.map(formatAsset),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
