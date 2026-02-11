import { prisma } from '../utils/prisma.js';
import { storageService } from './storage.service.js';
import { createChildLogger } from '../utils/logger.js';
import { sha256, generateStorageKey } from '../utils/hash.js';
import { getExtension, isImage } from '../utils/mime.js';
import type { AssetStatus, AssetVisibility, Prisma } from '@prisma/client';

const logger = createChildLogger('asset');

interface CreateAssetInput {
  buffer: Buffer;
  filename: string;
  originalName: string;
  mimeType: string;
  apiKeyId?: string;
  visibility?: AssetVisibility;
}

interface ListAssetsInput {
  page: number;
  pageSize: number;
  status?: AssetStatus;
  visibility?: AssetVisibility;
  mimeType?: string;
  tagId?: string;
  collectionId?: string;
  sort?: string;
  order?: 'asc' | 'desc';
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

export const assetService = {
  async create(input: CreateAssetInput) {
    const { buffer, filename, originalName, mimeType, apiKeyId, visibility } = input;
    const contentHash = sha256(buffer);

    // Check for duplicate content
    const existing = await prisma.asset.findFirst({
      where: { contentHash, status: { not: 'ERROR' } },
      include: assetInclude,
    });

    if (existing) {
      logger.info({ contentHash, existingId: existing.id }, 'Duplicate content detected, reusing asset');
      return formatAsset(existing);
    }

    const ext = getExtension(mimeType) || '';
    const storageKey = generateStorageKey('assets', ext);

    // Upload to R2
    await storageService.upload(storageKey, buffer, mimeType);

    // Create DB record
    const asset = await prisma.asset.create({
      data: {
        filename,
        originalName,
        mimeType,
        sizeBytes: BigInt(buffer.length),
        storageKey,
        contentHash,
        status: 'PROCESSING',
        visibility: visibility || 'PRIVATE',
        apiKeyId,
      },
      include: assetInclude,
    });

    // Update API key usage if applicable
    if (apiKeyId) {
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { usedBytes: { increment: BigInt(buffer.length) } },
      });
    }

    logger.info({ assetId: asset.id, storageKey, size: buffer.length }, 'Asset created');
    return formatAsset(asset);
  },

  async createFromPresigned(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    contentHash: string;
    apiKeyId?: string;
  }) {
    const asset = await prisma.asset.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: BigInt(data.sizeBytes),
        storageKey: data.storageKey,
        contentHash: data.contentHash,
        status: 'PROCESSING',
        visibility: 'PRIVATE',
        apiKeyId: data.apiKeyId,
      },
      include: assetInclude,
    });

    if (data.apiKeyId) {
      await prisma.apiKey.update({
        where: { id: data.apiKeyId },
        data: { usedBytes: { increment: BigInt(data.sizeBytes) } },
      });
    }

    return formatAsset(asset);
  },

  async list(input: ListAssetsInput) {
    const { page, pageSize, status, visibility, mimeType, tagId, collectionId, sort, order } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AssetWhereInput = {};
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (mimeType) where.mimeType = { startsWith: mimeType };
    if (tagId) where.tags = { some: { tagId } };
    if (collectionId) where.collections = { some: { collectionId } };

    const orderBy: Prisma.AssetOrderByWithRelationInput = {};
    const sortField = sort || 'createdAt';
    orderBy[sortField as keyof Prisma.AssetOrderByWithRelationInput] = order || 'desc';

    const [items, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: assetInclude,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      items: items.map(formatAsset),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: assetInclude,
    });

    if (!asset) return null;
    return formatAsset(asset);
  },

  async update(id: string, data: {
    filename?: string;
    alt?: string;
    caption?: string;
    visibility?: AssetVisibility;
    status?: AssetStatus;
  }) {
    const asset = await prisma.asset.update({
      where: { id },
      data,
      include: assetInclude,
    });
    return formatAsset(asset);
  },

  async delete(id: string) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return false;

    // Delete from R2
    try {
      await storageService.delete(asset.storageKey);
      if (asset.thumbnailKey) {
        await storageService.delete(asset.thumbnailKey);
      }
    } catch (err) {
      logger.error({ err, assetId: id }, 'Failed to delete from storage');
    }

    // Delete transform cache entries from R2
    const transforms = await prisma.transformCache.findMany({ where: { assetId: id } });
    for (const t of transforms) {
      try {
        await storageService.delete(t.storageKey);
      } catch {
        // Ignore storage cleanup errors for transforms
      }
    }

    // Reduce API key usage
    if (asset.apiKeyId) {
      await prisma.apiKey.update({
        where: { id: asset.apiKeyId },
        data: { usedBytes: { decrement: asset.sizeBytes } },
      });
    }

    await prisma.asset.delete({ where: { id } });
    logger.info({ assetId: id }, 'Asset deleted');
    return true;
  },

  async bulkDelete(ids: string[]) {
    let deleted = 0;
    for (const id of ids) {
      const result = await assetService.delete(id);
      if (result) deleted++;
    }
    return deleted;
  },

  async addTag(assetId: string, tagId: string) {
    const existing = await prisma.assetTag.findFirst({
      where: { assetId, tagId },
    });
    if (existing) return existing;

    return prisma.assetTag.create({
      data: { assetId, tagId },
    });
  },

  async removeTag(assetId: string, tagId: string) {
    return prisma.assetTag.deleteMany({
      where: { assetId, tagId },
    });
  },

  async addToCollection(assetId: string, collectionId: string) {
    const existing = await prisma.assetCollection.findFirst({
      where: { assetId, collectionId },
    });
    if (existing) return existing;

    return prisma.assetCollection.create({
      data: { assetId, collectionId },
    });
  },

  async removeFromCollection(assetId: string, collectionId: string) {
    return prisma.assetCollection.deleteMany({
      where: { assetId, collectionId },
    });
  },

  async getProcessingAssets(limit = 50) {
    return prisma.asset.findMany({
      where: { status: 'PROCESSING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  },

  async updateStatus(id: string, status: AssetStatus, metadata?: Record<string, unknown>) {
    const data: Prisma.AssetUpdateInput = { status };
    if (metadata) {
      data.metadata = metadata as Prisma.InputJsonValue;
    }
    return prisma.asset.update({ where: { id }, data });
  },

  async setThumbnail(id: string, thumbnailKey: string) {
    return prisma.asset.update({
      where: { id },
      data: { thumbnailKey },
    });
  },

  async setDimensions(id: string, width: number, height: number) {
    return prisma.asset.update({
      where: { id },
      data: { width, height },
    });
  },
};
