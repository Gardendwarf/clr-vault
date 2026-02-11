import { prisma } from '../utils/prisma.js';
import { createChildLogger } from '../utils/logger.js';
import { generateApiKey, hashApiKey, generateAppId } from '../utils/hash.js';

const logger = createChildLogger('api-key');

interface CreateApiKeyInput {
  userId: string;
  name: string;
  permissions?: string[];
  rateLimit?: number;
  quotaBytes?: number;
}

function formatApiKey(apiKey: any) {
  return {
    ...apiKey,
    quotaBytes: apiKey.quotaBytes.toString(),
    usedBytes: apiKey.usedBytes.toString(),
  };
}

export const apiKeyService = {
  async list(userId: string) {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(formatApiKey);
  },

  async create(input: CreateApiKeyInput) {
    const { userId, name, permissions = ['read'], rateLimit = 100, quotaBytes = 5368709120 } = input;

    const { key, prefix } = generateApiKey();
    const keyHash = hashApiKey(key);
    const appId = generateAppId();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        appId,
        keyHash,
        keyPrefix: prefix,
        permissions,
        rateLimit,
        quotaBytes: BigInt(quotaBytes),
      },
    });

    logger.info({ apiKeyId: apiKey.id, appId, userId }, 'API key created');

    return {
      apiKey: formatApiKey(apiKey),
      rawKey: key,
    };
  },

  async update(id: string, userId: string, data: { name?: string; permissions?: string[]; rateLimit?: number; isActive?: boolean }) {
    const existing = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('API key not found');
    }

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data,
    });

    return formatApiKey(apiKey);
  },

  async delete(id: string, userId: string) {
    const existing = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existing) return false;

    await prisma.apiKey.delete({ where: { id } });
    logger.info({ apiKeyId: id }, 'API key deleted');
    return true;
  },

  async regenerate(id: string, userId: string) {
    const existing = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('API key not found');
    }

    const { key, prefix } = generateApiKey();
    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { keyHash, keyPrefix: prefix },
    });

    logger.info({ apiKeyId: id }, 'API key regenerated');

    return {
      apiKey: formatApiKey(apiKey),
      rawKey: key,
    };
  },

  async getByAppId(appId: string) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { appId },
    });
    return apiKey ? formatApiKey(apiKey) : null;
  },
};
