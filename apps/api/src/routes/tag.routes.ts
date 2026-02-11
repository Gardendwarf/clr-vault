import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { success, errors } from '../utils/response.js';
import { validateZod, uuidSchema, slugSchema, generateSlug } from '../utils/validation.js';

const createSchema = z.object({
  name: z.string().min(1).max(50),
  slug: slugSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color')
    .optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  slug: slugSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color')
    .optional(),
});

export async function tagRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/tags
  app.get('/', async (_request, reply) => {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });

    success(
      reply,
      tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        assetCount: t._count.assets,
        createdAt: t.createdAt.toISOString(),
      }))
    );
  });

  // POST /api/tags
  app.post('/', async (request, reply) => {
    const validation = validateZod(createSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const { name, color } = validation.data;
    const slug = validation.data.slug || generateSlug(name);

    const existing = await prisma.tag.findFirst({
      where: { OR: [{ slug }, { name }] },
    });
    if (existing) {
      return errors.conflict(reply, 'Tag with this name or slug already exists');
    }

    const tag = await prisma.tag.create({
      data: { name, slug, color: color || '#6366f1' },
    });

    success(reply, {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      assetCount: 0,
      createdAt: tag.createdAt.toISOString(),
    }, 201);
  });

  // PUT /api/tags/:id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid tag ID');
    }

    const validation = validateZod(updateSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return errors.notFound(reply, 'Tag');
    }

    if (validation.data.slug || validation.data.name) {
      const checkSlug = validation.data.slug || (validation.data.name ? generateSlug(validation.data.name) : null);
      if (checkSlug) {
        const conflict = await prisma.tag.findFirst({
          where: { slug: checkSlug, id: { not: id } },
        });
        if (conflict) {
          return errors.conflict(reply, 'Tag slug already exists');
        }
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: validation.data,
      include: { _count: { select: { assets: true } } },
    });

    success(reply, {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      assetCount: tag._count.assets,
      createdAt: tag.createdAt.toISOString(),
    });
  });

  // DELETE /api/tags/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const valid = uuidSchema.safeParse(id);
    if (!valid.success) {
      return errors.badRequest(reply, 'Invalid tag ID');
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return errors.notFound(reply, 'Tag');
    }

    // Remove all asset-tag links first
    await prisma.assetTag.deleteMany({ where: { tagId: id } });
    await prisma.tag.delete({ where: { id } });

    success(reply, { message: 'Tag deleted' });
  });
}
