import { prisma } from '../utils/prisma.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('analytics');

export const analyticsService = {
  async getOverview() {
    const [totalAssets, totalCollections, totalTags, assetsByStatus, assetsByType, totalSize] =
      await Promise.all([
        prisma.asset.count(),
        prisma.collection.count(),
        prisma.tag.count(),
        prisma.asset.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.asset.groupBy({
          by: ['mimeType'],
          _count: { id: true },
          _sum: { sizeBytes: true },
          orderBy: { _count: { id: 'desc' } },
          take: 20,
        }),
        prisma.asset.aggregate({
          _sum: { sizeBytes: true },
        }),
      ]);

    const statusMap: Record<string, number> = {
      PROCESSING: 0,
      ACTIVE: 0,
      ARCHIVED: 0,
      ERROR: 0,
    };
    for (const s of assetsByStatus) {
      statusMap[s.status] = s._count.id;
    }

    return {
      totalAssets,
      totalSizeBytes: (totalSize._sum.sizeBytes ?? BigInt(0)).toString(),
      totalCollections,
      totalTags,
      assetsByStatus: statusMap,
      assetsByType: assetsByType.map((t) => ({
        mimeType: t.mimeType,
        count: t._count.id,
        sizeBytes: (t._sum.sizeBytes ?? BigInt(0)).toString(),
      })),
    };
  },

  async getBandwidth(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.accessLog.findMany({
      where: {
        createdAt: { gte: startDate },
        action: 'serve',
      },
      select: {
        createdAt: true,
        bytesServed: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by day
    const dayMap = new Map<string, { bytesServed: bigint; requests: number }>();

    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      const existing = dayMap.get(dateKey) || { bytesServed: BigInt(0), requests: 0 };
      existing.bytesServed += log.bytesServed;
      existing.requests += 1;
      dayMap.set(dateKey, existing);
    }

    // Fill in missing days
    const result: { date: string; bytesServed: string; requests: number }[] = [];
    const current = new Date(startDate);
    const today = new Date();

    while (current <= today) {
      const dateKey = current.toISOString().split('T')[0];
      const data = dayMap.get(dateKey);
      result.push({
        date: dateKey,
        bytesServed: (data?.bytesServed ?? BigInt(0)).toString(),
        requests: data?.requests ?? 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  },

  async getPerAppUsage() {
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { assets: true, accessLogs: true } },
      },
    });

    const result = [];
    for (const key of apiKeys) {
      const totalBytesServed = await prisma.accessLog.aggregate({
        where: { apiKeyId: key.id },
        _sum: { bytesServed: true },
      });

      result.push({
        apiKeyId: key.id,
        appId: key.appId,
        name: key.name,
        totalRequests: key._count.accessLogs,
        totalBytesServed: (totalBytesServed._sum.bytesServed ?? BigInt(0)).toString(),
        assetCount: key._count.assets,
        usedBytes: key.usedBytes.toString(),
        quotaBytes: key.quotaBytes.toString(),
      });
    }

    return result;
  },

  async getTopAssets(limit = 20) {
    const topAssets = await prisma.accessLog.groupBy({
      by: ['assetId'],
      where: { assetId: { not: null } },
      _count: { id: true },
      _sum: { bytesServed: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const assetIds = topAssets
      .map((a) => a.assetId)
      .filter((id): id is string => id !== null);

    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, filename: true, originalName: true, mimeType: true },
    });

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    return topAssets
      .filter((a) => a.assetId && assetMap.has(a.assetId))
      .map((a) => {
        const asset = assetMap.get(a.assetId!)!;
        return {
          id: asset.id,
          filename: asset.filename,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          accessCount: a._count.id,
          bytesServed: (a._sum.bytesServed ?? BigInt(0)).toString(),
        };
      });
  },

  async logAccess(data: {
    assetId?: string;
    apiKeyId?: string;
    action: string;
    ip?: string;
    bytesServed?: number;
    responseTime?: number;
  }) {
    try {
      await prisma.accessLog.create({
        data: {
          assetId: data.assetId,
          apiKeyId: data.apiKeyId,
          action: data.action,
          ip: data.ip,
          bytesServed: BigInt(data.bytesServed || 0),
          responseTime: data.responseTime,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to log access');
    }
  },
};
