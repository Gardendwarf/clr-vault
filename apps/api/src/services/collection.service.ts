import { prisma } from '../utils/prisma.js';
import { createChildLogger } from '../utils/logger.js';
import { generateSlug } from '../utils/validation.js';
import type { Prisma } from '@prisma/client';

const logger = createChildLogger('collection');

function formatCollection(collection: any) {
  return {
    ...collection,
    assetCount: collection._count?.assets ?? collection.assetCount ?? 0,
    children: collection.children?.map(formatCollection) ?? [],
  };
}

export const collectionService = {
  async list() {
    const collections = await prisma.collection.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: { _count: { select: { assets: true } } },
            },
            _count: { select: { assets: true } },
          },
        },
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    });

    return collections.map(formatCollection);
  },

  async getById(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        children: {
          include: { _count: { select: { assets: true } } },
        },
        parent: true,
        _count: { select: { assets: true } },
      },
    });

    if (!collection) return null;
    return formatCollection(collection);
  },

  async create(data: { name: string; slug?: string; parentId?: string }) {
    const slug = data.slug || generateSlug(data.name);

    // Check for existing slug
    const existing = await prisma.collection.findUnique({ where: { slug } });
    if (existing) {
      throw new Error('Collection with this slug already exists');
    }

    // Build path
    let path = `/${slug}`;
    if (data.parentId) {
      const parent = await prisma.collection.findUnique({ where: { id: data.parentId } });
      if (!parent) {
        throw new Error('Parent collection not found');
      }
      path = `${parent.path}/${slug}`;
    }

    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        slug,
        parentId: data.parentId,
        path,
      },
      include: {
        children: true,
        _count: { select: { assets: true } },
      },
    });

    logger.info({ collectionId: collection.id, name: collection.name }, 'Collection created');
    return formatCollection(collection);
  },

  async update(id: string, data: { name?: string; slug?: string }) {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Collection not found');
    }

    const updateData: Prisma.CollectionUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.slug) {
      const slugExists = await prisma.collection.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugExists) throw new Error('Slug already exists');
      updateData.slug = data.slug;
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        children: true,
        _count: { select: { assets: true } },
      },
    });

    return formatCollection(collection);
  },

  async delete(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { children: true, _count: { select: { assets: true } } },
    });

    if (!collection) return false;

    if (collection.children.length > 0) {
      throw new Error('Cannot delete collection with children. Delete children first.');
    }

    // Remove all asset-collection links
    await prisma.assetCollection.deleteMany({ where: { collectionId: id } });

    await prisma.collection.delete({ where: { id } });
    logger.info({ collectionId: id, name: collection.name }, 'Collection deleted');
    return true;
  },

  async getAssets(collectionId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.assetCollection.findMany({
        where: { collectionId },
        include: {
          asset: {
            include: {
              tags: { include: { tag: true } },
              collections: { include: { collection: true } },
            },
          },
        },
        skip,
        take: pageSize,
      }),
      prisma.assetCollection.count({ where: { collectionId } }),
    ]);

    return {
      items: items.map((ac) => ({
        ...ac.asset,
        sizeBytes: ac.asset.sizeBytes.toString(),
        tags: ac.asset.tags.map((at) => at.tag),
        collections: ac.asset.collections.map((acl) => acl.collection),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
